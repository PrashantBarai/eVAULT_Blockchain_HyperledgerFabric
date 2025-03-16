from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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

class CaseSubmission(BaseModel):
    uid_party1: str
    uid_party2: str
    filed_date: Optional[datetime] = None
    associated_lawyers: str
    associated_judge: str
    case_subject: str
    latest_update: str
    status: str
    user_id: str
    
class Case(BaseModel):
    uid_party1: str
    uid_party2: str
    filed_date: Optional[datetime] = None
    associated_lawyers: str
    associated_judge: str
    case_subject: str
    latest_update: str
    status: str