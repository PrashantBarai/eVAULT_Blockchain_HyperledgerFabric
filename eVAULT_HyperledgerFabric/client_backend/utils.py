from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv
from database import users_collection, case_collection
import httpx
from fastapi import UploadFile
from config import *
import requests
import uuid
import os

load_dotenv()

# JWT Token Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create a JWT access token with user data
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """
    Verify and decode a JWT token
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

def get_user(email: str):
    user = users_collection.find_one({"email": email})
    if user:
        return user
    return None
import os
import httpx
from fastapi import UploadFile

PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY")

async def upload_files_to_ipfs(files: list[UploadFile]) -> list[str]:
    cids = []
    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY
    }

    async with httpx.AsyncClient() as client:
        for file in files:
            # prepare file payload
            file_bytes = await file.read()
            files_payload = {
                'file': (file.filename, file_bytes, file.content_type)
            }
            resp = await client.post(
                "https://api.pinata.cloud/pinning/pinFileToIPFS",
                headers=headers,
                files=files_payload
            )   
            resp.raise_for_status()
            ipfs_hash = resp.json()["IpfsHash"]
            cids.append(ipfs_hash)
    return cids
