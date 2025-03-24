from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv
from backend.database import users_collection, case_collection
from backend.config import *
import requests
import uuid
import os

def get_user(email: str):
    user = users_collection.find_one({"email": email})
    if user:
        return user
    return None

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user:
        return None
    if user["password"] != password:
        return None
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

import requests

import httpx
from fastapi import UploadFile

async def pin_file_to_ipfs(file: UploadFile):
    try:
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {
            # "pinata_api_key":PINATA_API_KEY,
            # "pinata_secret_api_key":PINATA_SECRET_API_KEY,
            "Authorization": f"Bearer {JWT}",      
            "Content-Type":"multipart/form-data"
            # 
        }
        file_content = await file.read()        
        files = {"file": (file.filename, file_content, file.content_type)}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, files=files)
            response.raise_for_status()
            response_data = response.json()
        
        return response_data.get("IpfsHash")
    except Exception as e:
        print("Error uploading file to Pinata:", e)
        return None


# import os
# from fastapi import UploadFile
# from typing import List

# UPLOAD_DIR = "uploads"
# def store_files_locally(user_id: str, case_id: str, files: List[UploadFile]) -> List[str]:
#     user_dir = os.path.join(UPLOAD_DIR, user_id)
#     case_dir = os.path.join(user_dir, case_id)

#     os.makedirs(case_dir, exist_ok=True)  # Create directory if not exists

#     stored_files = []
#     for file in files:
#         file_path = os.path.join(case_dir, file.filename)
#         with open(file_path, "wb") as f:
#             f.write(file.file.read())  # Save file locally
#         stored_files.append(file)

#     return stored_files



# def pin_file_to_ipfs(file_path):
#     try:
#         url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
#         headers = {
#             "Authorization": f"Bearer {JWT}",
#         }
#         absolute_path = os.path.abspath(file_path) 
#         with open(absolute_path, "rb") as file: 
#             files = {"file": (os.path.basename(file_path), file)}
#             response = requests.post(url, headers=headers, files=files)
#         response_data = response.json()
#         print(response_data)
#         return response_data.get("IpfsHash")  
#     except Exception as e:
#         print("Error:", e)
#         return None