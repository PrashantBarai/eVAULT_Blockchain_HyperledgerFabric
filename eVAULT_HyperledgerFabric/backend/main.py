from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from backend.models import *
from backend.utils import *
from backend.config import *
from backend.database import users_collection,case_collection
from typing import List, Optional
from bson import ObjectId
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:7000"],
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
    if user.user_type=='lawyer':
        user_data["pending_cases"] = 0
        user_data["verified_cases"] = 0
        user_data["rejected_cases"] = 0
    elif user.user_type == "registrar":
        user_data["pending_cases"] = 0
        user_data["verified_cases"] = 0
        user_data["rejected_cases"] = 0
        user_data['cases'] = []
        user_data['notifications'] = []
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
    case_type: str = Form(...),
    files: Optional[List[UploadFile]] = File([])
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
            "case_type":case_type,
            "file_cids": []
        }
        case_result = case_collection.insert_one(case_data)
        case_id = str(case_result.inserted_id) 
        print(case_id)
        users_collection.update_one(
            {'_id': ObjectId(user_id),"user_type":"lawyer"},
            {'$inc': {'pending_cases': 1}}  
        )
        if files: 
            stored_files = store_files_locally(user_id, case_id, files)
            try:
                cids = [await pin_file_to_ipfs(files["file"]) for files in stored_files]
            except Exception as e:
                print(e)
            case_collection.update_one(
                {"_id": case_result.inserted_id},
                {"$set": {"file_cids": cids}}
            )
        user = users_collection.find_one({"_id":ObjectId(user_id)})
        return {"message": "Case submitted successfully", "case_id": case_id, "user":{"user_id":user_id,"pending_cases":user['pending_cases']}}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=400, detail=f"Error submitting case: {str(e)}")
    



@app.get("/get-cases/{user_id}")
async def get_cases(user_id: str):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id), "user_type": "registrar"})
        if not user:
            raise HTTPException(status_code=404, detail="User not found or not a registrar")
        reg_c = []
        if "cases" in user and isinstance(user["cases"], list):  # Ensure 'cases' exists and is a list
            for case_id in user["cases"]:
                c = case_collection.find_one({'_id': ObjectId(case_id)})
                if c: 
                    c['_id'] = str(c['_id'])
                    c['filed_date']=c['filed_date'].strftime('%Y-%m-%d %H:%M:%S')
                    c['assigned_registrar'] = str(c['assigned_registrar'])
                    reg_c.append(c)
                print(reg_c)
            return {"cases": reg_c}
        cases = list(case_collection.find({"user_id": user_id}))
        for c in cases:
            c["_id"] = str(c["_id"])
        return {"cases": cases}
    except Exception as e:
        print(f"Error fetching cases: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    
    
@app.get("/case-history/{user_id}")
async def get_cases(user_id: str):
    try:
        cases = list(case_collection.find({"user_id": user_id}))
        for c in cases:
            c["_id"] = str(c["_id"])
        return {"cases": cases}
    except Exception as e:
        print(f"Error fetching cases: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    


@app.get('/case/{case_id}')
async def case_details(case_id: str):
    try:
        case1 = case_collection.find_one({"_id": ObjectId(case_id)})
        if not case1:raise HTTPException(status_code=404, detail="Case not found")        
        case1["_id"] = str(case1["_id"])
        return {"case": case1}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching case details: {str(e)}")
    
    
    
    
@app.post('/case/{case_id}/send-to-registrar')
async def send_to_registrar(case_id: str):
    try:
        case1 = case_collection.find_one({"_id": ObjectId(case_id)})
        lawyer = users_collection.find_one({"username":case1['associated_lawyer']})
        users_collection.update_one(
            {"_id": lawyer['_id']}, 
            {"$inc": {"verified_cases",1}}  
        )
        if not case1:raise HTTPException(status_code=404, detail="Case not found")
        registrars = list(users_collection.find({"user_type": "registrar"}))
        registrars.sort(key=lambda r: len(r.get("cases", [])))  
        if not registrars:raise HTTPException(status_code=404, detail="No registrars found")
        assigned_registrar = registrars[0]
        registrar_id = assigned_registrar["_id"]
        users_collection.update_one(
            {"_id": registrar_id}, 
            {"$push": {"cases": case_id}}  
        )
        case_collection.update_one({"_id": ObjectId(case_id)}, {"$set": {"assigned_registrar": registrar_id}})
        return {
            "message": "Case assigned successfully",
            "case_id": case_id,
            "assigned_registrar": str(registrar_id),
            "registrar_cases": assigned_registrar.get("cases", []) + [case_id]  
        }

    except Exception as e:raise HTTPException(status_code=400, detail=f"Error assigning case: {str(e)}")



    
@app.get('/registrar/{user_id}')
async def registrar_dashboard(user_id: str):
    try:
        registrar = users_collection.find_one({"_id": ObjectId(user_id), "user_type": "registrar"})
        if not registrar:
            raise HTTPException(status_code=404, detail="Registrar not found")
        assigned_cases = registrar.get("cases", [])
        # verified_cases = users_collection.find_one({"_id":ObjectId(user_id)})['verified_cases']
        # rejected_cases = users_collection.find_one({"_id":ObjectId(user_id)})['rejected_cases']
        total_cases = len(assigned_cases)
        notifications = registrar.get("notifications", [])
        return {
            "name": registrar.get("name", "Registrar"),
            # "designation": registrar.get("designation", "Registrar"),
            # "court": registrar.get("court", "Unknown Court"),
            "total_cases": total_cases,
            # "verified_cases": verified_cases,
            # "rejected_cases": rejected_cases,
            "notifications": len(notifications)
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching registrar data: {str(e)}")



