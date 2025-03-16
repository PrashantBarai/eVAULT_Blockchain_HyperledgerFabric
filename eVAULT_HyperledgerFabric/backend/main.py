from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from backend.models import *
from backend.utils import *
from backend.config import *
from backend.database import *
from typing import List, Optional
# from dotenv import load_dotenv
# import requests
import uuid
import os

app = FastAPI()

TEMP_UPLOAD_DIR = "temp_uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.post("/signup")
async def signup(user: UserCreate):
    existing_user = users_collection.find_one({"username": user.username})
    if existing_user:raise HTTPException(status_code=400, detail="Username already registered")
    user_data = {
        "username": user.username,
        "email": user.email,
        "phone_number": user.phone_number,
        "password": user.password,
        "user_type": user.user_type,
    }
    result = users_collection.insert_one(user_data)
    if result.inserted_id:return {"message": "User created successfully", "user_id": str(result.inserted_id)}
    else:raise HTTPException(status_code=500, detail="Failed to create user")


@app.post("/", response_model=Token)
async def login(user: UserLogin):
    user = authenticate_user(user.email, user.password)
    if not user:raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Incorrect email or password",headers={"WWW-Authenticate": "Bearer"},)
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user["email"]}, expires_delta=access_token_expires)
    user_data = {
        "user_id":str(user['_id']),
        "username": user["username"],
        "email": user["email"],
        "user_type": user["user_type"],
    }
    return {"access_token": access_token, "token_type": "bearer", "user_data": user_data}




UPLOAD_DIR = "uploads"

def store_files_locally(user_id: str, case_id: str, files: List[UploadFile]) -> List[str]:
    user_dir = os.path.join(UPLOAD_DIR, user_id)
    case_dir = os.path.join(user_dir, case_id)
    os.makedirs(case_dir, exist_ok=True)  
    stored_files = []
    for file in files:
        file_path = os.path.join(case_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())  # Save file locally
        stored_files.append({"file":file,"filepath":file_path})
    return stored_files




@app.post("/submit-case")
async def submit_case(
    uid_party1: str = Form(...),
    uid_party2: str = Form(...),
    filed_date: str = Form(...),
    associated_lawyers: str = Form(...),
    associated_judge: str = Form(...),
    case_subject: str = Form(...),
    latest_update: str = Form(...),
    status: str = Form(...),
    user_id: str = Form(...),
    client: str = Form(...),
    files: List[UploadFile] = File(...)
):
    try:
        filed_date_parsed = datetime.strptime(filed_date, "%a, %d %b %Y %H:%M:%S %Z")
        case_data = {
            "uid_party1": uid_party1,
            "uid_party2": uid_party2,
            "filed_date": filed_date_parsed,
            "associated_lawyers": associated_lawyers,
            "associated_judge": associated_judge,
            "case_subject": case_subject,
            "latest_update": latest_update,
            "status": status,
            "user_id": user_id,
            "client": client,
            "file_cids": []
        }
        case_result = case_collection.insert_one(case_data)
        case_id = str(case_result.inserted_id) 
        stored_files = store_files_locally(user_id, case_id, files)
        try:
            cids = [await pin_file_to_ipfs(files["file"]) for files in stored_files]
        except Exception as e:
            print(e)
        case_collection.update_one(
            {"_id": case_result.inserted_id},
            {"$set": {"file_cids": cids}}
        )

        return {"message": "Case submitted successfully", "case_id": case_id}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error submitting case: {str(e)}")
