from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
from dotenv import load_dotenv
import requests
import uuid
import os

# Load environment variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY")
PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"

# MongoDB Setup
client = MongoClient("mongodb://localhost:27017/")
db = client["evault"]
users_collection = db["users"]
case_collection = db["cases"]

# FastAPI App
app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: str
    phone_number: str
    password: str
    user_type: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_data: dict

class Case(BaseModel):
    uid_party1: str
    uid_party2: str
    filed_date: Optional[datetime] = None
    associated_lawyers: str
    associated_judge: str
    case_subject: str
    latest_update: str
    status: str

# Helper Functions
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

def pin_file_to_ipfs(file: UploadFile):
    try:
        headers = {
            "pinata_api_key": PINATA_API_KEY,
            "pinata_secret_api_key": PINATA_SECRET_API_KEY,
        }
        files = {"file": (file.filename, file.file, file.content_type)}
        response = requests.post(PINATA_URL, headers=headers, files=files)
        response.raise_for_status()  # Raise an exception for HTTP errors
        response_data = response.json()
        return response_data.get("IpfsHash")
    except Exception as e:
        print("Error uploading file to Pinata:", e)
    
# Routes
@app.post("/signup")
async def signup(user: UserCreate):
    existing_user = users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    user_data = {
        "username": user.username,
        "email": user.email,
        "phone_number": user.phone_number,
        "password": user.password,
        "user_type": user.user_type,
    }
    result = users_collection.insert_one(user_data)
    if result.inserted_id:
        return {"message": "User created successfully", "user_id": str(result.inserted_id)}
    else:
        raise HTTPException(status_code=500, detail="Failed to create user")

@app.post("/", response_model=Token)
async def login(user: UserLogin):
    user = authenticate_user(user.email, user.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    user_data = {
        "user_id":str(user['_id']),
        "username": user["username"],
        "email": user["email"],
        "user_type": user["user_type"],
    }
    return {"access_token": access_token, "token_type": "bearer", "user_data": user_data}