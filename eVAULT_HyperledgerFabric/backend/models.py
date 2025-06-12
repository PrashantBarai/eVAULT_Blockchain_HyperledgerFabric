from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    email: str
    licenseId: str = None
    password: str
    phone_number: str
    address: str = None
    user_type: str

    # Lawyer-specific
    barCouncilNumber: str = None
    practicingAreas: str = None
    experienceYears: str = None

    # Judge-specific
    courtAssigned: str = None
    judgementExpertise: str = None
    appointmentDate: str = None

    # Bench Clerk-specific
    courtSection: str = None
    clerkId: str = None
    joiningDate: str = None

    # Registrar-specific
    registrarId: str = None
    department: str = None
    designation: str = None

    # Stamp Reporter-specific
    reporterId: str = None
    reportingArea: str = None
    certificationDate: str = None

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