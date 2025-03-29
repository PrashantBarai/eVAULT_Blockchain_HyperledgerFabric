from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv
from backend.database import users_collection, case_collection
import httpx
from fastapi import UploadFile
from backend.config import *
import requests
import uuid
import os

load_dotenv()
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


async def pin_file_to_ipfs(file_path: str):
    try:
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {
            "pinata_api_key": "fb4aba376ddd6ac86d4c",
            "pinata_secret_api_key": "20e8c81836e88f97bf9c185277c7c04e61716c37a8cadbe4e9f96c4fc74d9566",
        }
        with open(file_path, "rb") as f:
            file_content = f.read()
        filename = os.path.basename(file_path)
        files = {"file": (filename, file_content)}
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, files=files)
            response.raise_for_status()
            response_data = response.json()

        return response_data.get("IpfsHash")
    except Exception as e:
        print("Error uploading file to Pinata:", e)
        return None
