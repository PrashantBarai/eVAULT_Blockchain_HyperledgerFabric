from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from models import *
from utils import *
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
from config import *
from database import users_collection,case_collection, profile_collection
from typing import List, Optional
from bson import ObjectId
import random
import os
import uuid

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:7000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Check if email or licenseId already exists
@app.post("/check-duplicate")
async def check_duplicate(request: Request):
    data = await request.json()
    email = data.get("email", "")
    licenseId = data.get("licenseId", "")
    
    result = {"emailExists": False, "licenseIdExists": False}
    
    if email:
        existing_email = users_collection.find_one({"email": email})
        if existing_email:
            result["emailExists"] = True
    
    if licenseId:
        existing_license = users_collection.find_one({"licenseId": licenseId})
        if existing_license:
            result["licenseIdExists"] = True
    
    return result


@app.post("/signup")
async def signup(
    user_type: str = Form(...),
    username: str = Form(...),
    email: str = Form(...),
    licenseId: str = Form(...),
    password: str = Form(...),
    confirmPassword: str = Form(...),
    phone_number: str = Form(...),
    address: str = Form(...),
    barCouncilNumber: str = Form(""),
    practicingAreas: str = Form(""),
    experienceYears: str = Form(""),
    courtAssigned: str = Form(""),
    judgementExpertise: str = Form(""),
    appointmentDate: str = Form(""),
    courtSection: str = Form(""),
    clerkId: str = Form(""),
    joiningDate: str = Form(""),
    registrarId: str = Form(""),
    department: str = Form(""),
    designation: str = Form(""),
    reporterId: str = Form(""),
    reportingArea: str = Form(""),
    certificationDate: str = Form(""),
    documents: List[UploadFile] = File(None)
):
    print("Received signup data:")
    
    # Base data for all users
    data = {
        "user_type": user_type,
        "username": username,
        "email": email,
        "licenseId": licenseId,
        "password": password,
        "phone_number": phone_number,
        "address": address, 
        "notifications":[],
        "cases": [],
    }
    
    # Add role-specific fields based on user_type
    if user_type == "lawyer":
        data.update({
            "barCouncilNumber": barCouncilNumber,
            "practicingAreas": practicingAreas,
            "experienceYears": experienceYears,
        })
    elif user_type == "judge":
        data.update({
            "courtAssigned": courtAssigned,
            "judgementExpertise": judgementExpertise,
            "appointmentDate": appointmentDate,
        })
    elif user_type == "benchclerk":
        data.update({
            "courtSection": courtSection,
            "clerkId": clerkId,
            "joiningDate": joiningDate,
        })
    elif user_type == "registrar":
        data.update({
            "registrarId": registrarId,
            "department": department,
            "designation": designation,
        })
    elif user_type == "stampreporter":
        data.update({
            "reporterId": reporterId,
            "reportingArea": reportingArea,
            "department": department,
            "certificationDate": certificationDate,
            "digital_sign": str(uuid.uuid1()),
        })
    
    print("Saving user data:", data)
    users_collection.insert_one(data)
    
    return {"message": "Signup data received"}



@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if password != user["password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convert ObjectId to string and ensure user_type is included
    user_id = str(user["_id"])
    user["_id"] = user_id
    
    # Ensure user_type is in the response
    if "user_type" not in user:
        user["user_type"] = "lawyer"  # Default fallback
    
    # Create JWT token with user data
    token_data = {
        "sub": user["email"],
        "user_id": user_id,
        "user_type": user.get("user_type"),
        "username": user.get("username"),
        "licenseId": user.get("licenseId", "")
    }
    
    access_token = create_access_token(data=token_data)
    
    print(f"Login successful for {email}, user_type: {user.get('user_type')}, username: {user.get('username')}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_data": user
    }


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
    description: str = Form(...),
    files: Optional[List[UploadFile]] = File(None)
):
    try:
        filed_date_parsed = datetime.strptime(filed_date, "%a, %d %b %Y %H:%M:%S %Z")
        case_data = {
            "uid_party1": uid_party1,
            "uid_party2": uid_party2,
            "filed_date": filed_date_parsed,
            # "associated_lawyers": associated_lawyers,
            # "associated_judge": associated_judge,
            "case_subject": case_subject,
            "latest_update": latest_update,
            "status": status,
            "user_id": user_id,
            "client": client,
            "case_type": case_type,
            "description": description,
            "approved": False,
            "rejected": {"status": False, "reason": ""},
            "file_cids": []
        }
        # print(case_data)
        if files:
            file_cids = await upload_files_to_ipfs(files)
            case_data["file_cids"] = file_cids

        # insert case record
        case_result = case_collection.insert_one(case_data)
        case_id = str(case_result.inserted_id)

        # update user pending cases and add case ID to cases array
        update_result = users_collection.update_one(
            {'_id': ObjectId(user_id), "user_type": "lawyer"},
            {
                '$inc': {'pending_cases': 1},
                '$push': {'cases': case_id}  # Store case ID for easy lookup
            }
        )
        print(f"Updated user {user_id}: matched={update_result.matched_count}, modified={update_result.modified_count}")
        print(f"Added case ID {case_id} to user's cases array")

        user = users_collection.find_one({"_id": ObjectId(user_id)})
        print(f"User cases array after update: {user.get('cases', [])}")

        return {
            "message": "Case submitted successfully",
            "case_id": case_id,
            "user": {"user_id": user_id, "pending_cases": user['pending_cases']},
            "file_cids": case_data["file_cids"]
        }

    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=400, detail=f"Error submitting case: {str(e)}")


# Endpoint to add case ID to user's cases array (called from fabric-api)
@app.post("/user/add-case")
async def add_case_to_user(request: Request):
    try:
        data = await request.json()
        user_id = data.get("user_id")
        case_id = data.get("case_id")
        
        if not user_id or not case_id:
            raise HTTPException(status_code=400, detail="user_id and case_id are required")
        
        print(f"Adding case {case_id} to user {user_id}")
        
        # Update user's cases array
        update_result = users_collection.update_one(
            {'_id': ObjectId(user_id)},
            {
                '$push': {'cases': case_id}
            }
        )
        
        print(f"Updated user {user_id}: matched={update_result.matched_count}, modified={update_result.modified_count}")
        
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"User not found with ID: {user_id}")
        
        return {
            "success": True,
            "message": f"Case {case_id} added to user {user_id}",
            "modified": update_result.modified_count
        }
    except Exception as e:
        print(f"Error adding case to user: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error adding case to user: {str(e)}")


@app.post("/lawyer/profile")
async def save_profile(request: Request):
    data = await request.json()
    profile_collection.update_one(
        {"email": data["email"]},
        {"$set": data},
        upsert=True
    )
    return {"message": "Profile saved successfully", "profile": data}

@app.get("/get-profile/{userid}")
async def get_profile(userid: str):
    try:
        # First check profile_collection for saved profile
        profile = profile_collection.find_one({"userId": userid})
        
        # If not in profile_collection, get from users_collection
        if not profile:
            user = users_collection.find_one({"_id": ObjectId(userid)})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            user_type = user.get("user_type", "lawyer")
            
            # Base profile fields
            profile = {
                "userId": userid,
                "name": user.get("username", ""),
                "email": user.get("email", ""),
                "phone": user.get("phone_number", ""),
                "address": user.get("address", ""),
                "bio": "",
                "user_type": user_type,
                "_id": str(user["_id"])
            }
            
            # Add role-specific fields
            if user_type == "lawyer":
                profile.update({
                    "barNumber": user.get("barCouncilNumber", user.get("licenseId", "")),
                    "specialization": user.get("practicingAreas", ""),
                    "experience": user.get("experienceYears", ""),
                })
            elif user_type == "judge":
                profile.update({
                    "courtAssigned": user.get("courtAssigned", ""),
                    "judgementExpertise": user.get("judgementExpertise", ""),
                    "appointmentDate": user.get("appointmentDate", ""),
                })
            elif user_type == "benchclerk":
                profile.update({
                    "courtSection": user.get("courtSection", ""),
                    "clerkId": user.get("clerkId", ""),
                    "joiningDate": user.get("joiningDate", ""),
                })
            elif user_type == "registrar":
                profile.update({
                    "registrarId": user.get("registrarId", ""),
                    "department": user.get("department", ""),
                    "designation": user.get("designation", ""),
                })
            elif user_type == "stampreporter":
                profile.update({
                    "reporterId": user.get("reporterId", ""),
                    "reportingArea": user.get("reportingArea", ""),
                    "department": user.get("department", ""),
                    "certificationDate": user.get("certificationDate", ""),
                    "digital_sign": user.get("digital_sign", ""),
                })
        else:
            profile["_id"] = str(profile["_id"])
        
        print("Profile data:", profile)
        return {"success": True, "profile": profile}
    except Exception as e:
        print(f"Error in get_profile: {e}")
        raise HTTPException(status_code=400, detail=f"Error fetching profile: {str(e)}")

@app.put("/update-profile/{userid}")
async def update_profile(userid: str, request: Request):
    try:
        body = await request.json()
        print(f"Update profile for {userid}: {body}")
        
        # Build update dict - only include fields that are provided
        update_fields = {}
        
        # Common fields
        if "username" in body:
            update_fields["username"] = body["username"]
        if "name" in body:
            update_fields["username"] = body["name"]
        if "phone_number" in body:
            update_fields["phone_number"] = body["phone_number"]
        if "phone" in body:
            update_fields["phone_number"] = body["phone"]
        if "address" in body:
            update_fields["address"] = body["address"]
        if "bio" in body:
            update_fields["bio"] = body["bio"]
        
        # Role-specific fields
        # Stamp Reporter
        if "reportingArea" in body:
            update_fields["reportingArea"] = body["reportingArea"]
        if "reporterId" in body:
            update_fields["reporterId"] = body["reporterId"]
        if "certificationDate" in body:
            update_fields["certificationDate"] = body["certificationDate"]
        
        # Lawyer
        if "barCouncilNumber" in body:
            update_fields["barCouncilNumber"] = body["barCouncilNumber"]
        if "practicingAreas" in body:
            update_fields["practicingAreas"] = body["practicingAreas"]
        if "experienceYears" in body:
            update_fields["experienceYears"] = body["experienceYears"]
        
        # Judge
        if "courtAssigned" in body:
            update_fields["courtAssigned"] = body["courtAssigned"]
        if "judgementExpertise" in body:
            update_fields["judgementExpertise"] = body["judgementExpertise"]
        if "appointmentDate" in body:
            update_fields["appointmentDate"] = body["appointmentDate"]
        
        # Bench Clerk
        if "courtSection" in body:
            update_fields["courtSection"] = body["courtSection"]
        if "clerkId" in body:
            update_fields["clerkId"] = body["clerkId"]
        if "joiningDate" in body:
            update_fields["joiningDate"] = body["joiningDate"]
        
        # Registrar
        if "registrarId" in body:
            update_fields["registrarId"] = body["registrarId"]
        if "department" in body:
            update_fields["department"] = body["department"]
        if "designation" in body:
            update_fields["designation"] = body["designation"]
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update in users_collection (primary source)
        result = users_collection.update_one(
            {"_id": ObjectId(userid)},
            {"$set": update_fields}
        )
        
        # Also update in profile_collection if it exists
        profile_collection.update_one(
            {"userId": userid},
            {"$set": update_fields},
            upsert=False
        )
        
        print(f"Updated {result.modified_count} document(s) in users_collection")
        
        return {"success": True, "message": "Profile updated successfully", "modified": result.modified_count}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_profile: {e}")
        raise HTTPException(status_code=400, detail=f"Error updating profile: {str(e)}")


@app.get("/get-cases/{user_id}")
async def get_cases(user_id: str):
    print(f"Received user_id: {user_id}")
    if not ObjectId.is_valid(user_id):
        return {"error": "Invalid user_id"}
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        return {"error": "User not found"}
    cases = list(case_collection.find({"user_id": user_id}))
    for c in cases:
        c["_id"] = str(c["_id"])
        c['filed_date'] = c['filed_date'].strftime('%Y-%m-%d %H:%M:%S')
        c['assigned_registrar'] = str(c.get('assigned_registrar', ''))
        c['assigned_stamp_reporter'] = str(c.get('assigned_stamp_reporter', ''))

    # print(cases)
    return {"cases": cases}



    
@app.get("/case-history/{user_id}")
async def case_history(user_id: str):
    try:
        cases = list(case_collection.find({"user_id": user_id}))
        for c in cases:
            c["_id"] = str(c["_id"])
            c['assigned_registrar'] = str(c.get('assigned_registrar', ''))
        return {"cases": cases}
    except Exception as e:
        print(f"Error fetching cases: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    

@app.get('/case/{case_id}')
async def case_details(case_id: str):
    try:
        case1 = case_collection.find_one({"_id": ObjectId(case_id)})
        if not case1:
            raise HTTPException(status_code=404, detail="Case not found")
        for key, value in case1.items():
            if isinstance(value, ObjectId):
                case1[key] = str(value)
        return {"case": case1}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching case details: {str(e)}")


@app.post('/assign-case-to-registrar')
async def assign_case_to_registrar(request: Request):
    """
    Assign a blockchain case to a specific registrar based on queue (least cases first).
    This works with blockchain case IDs and stores the assignment in MongoDB.
    """
    try:
        data = await request.json()
        blockchain_case_id = data.get("caseID")
        case_subject = data.get("caseSubject", "")
        lawyer_email = data.get("lawyerEmail", "")
        
        if not blockchain_case_id:
            raise HTTPException(status_code=400, detail="caseID is required")
        
        # Check if case is already assigned to a registrar
        existing_assignment = case_collection.find_one({
            "case_id": blockchain_case_id,
            "assigned_registrar": {"$exists": True, "$ne": None}
        })
        
        if existing_assignment:
            # Return success with existing assignment instead of blocking retries
            return {
                "success": True,
                "message": "Case already assigned to a registrar",
                "case_id": blockchain_case_id,
                "assigned_registrar_id": existing_assignment.get("assigned_registrar", ""),
                "assigned_registrar_name": existing_assignment.get("registrar_name", "Registrar"),
                "assigned_registrar_email": existing_assignment.get("registrar_email", ""),
                "already_assigned": True
            }
        
        # Get all registrars - use case-insensitive regex for user_type
        registrars = list(users_collection.find({
            "user_type": {"$regex": "^registrar$", "$options": "i"}
        }))
        
        # Debug: Print all user types in database
        all_users = list(users_collection.find({}, {"user_type": 1, "email": 1}))
        print(f"DEBUG: All users in DB: {all_users}")
        print(f"DEBUG: Found {len(registrars)} registrars")
        
        if not registrars:
            raise HTTPException(status_code=404, detail="No registrars available in the system. Please ensure at least one registrar account exists.")
        
        # Queue-based allocation: Find registrar with least cases
        registrar_case_counts = []
        for reg in registrars:
            case_count = len(reg.get("cases", []))
            registrar_case_counts.append({
                "registrar": reg,
                "case_count": case_count
            })
        
        # Sort by case count (ascending) and pick the one with least cases
        registrar_case_counts.sort(key=lambda x: x["case_count"])
        assigned_registrar = registrar_case_counts[0]["registrar"]
        registrar_id = assigned_registrar["_id"]
        
        # Update registrar's cases array - add the blockchain case ID
        users_collection.update_one(
            {"_id": registrar_id},
            {"$addToSet": {"cases": blockchain_case_id}}
        )
        
        # Update or create case reference in case_collection
        case_collection.update_one(
            {"case_id": blockchain_case_id},
            {
                "$set": {
                    "assigned_registrar": str(registrar_id),
                    "registrar_email": assigned_registrar.get("email"),
                    "registrar_name": assigned_registrar.get("username"),
                    "status": "PENDING_REGISTRAR_REVIEW",
                    "assigned_at": datetime.now().isoformat()
                }
            },
            upsert=True
        )
        
        # Add notification for the registrar
        notification = {
            "type": "NEW_CASE",
            "message": f"New case assigned: {case_subject or blockchain_case_id}",
            "case_id": blockchain_case_id,
            "timestamp": datetime.now().isoformat(),
            "read": False
        }
        users_collection.update_one(
            {"_id": registrar_id},
            {"$push": {"notifications": notification}}
        )
        
        return {
            "success": True,
            "message": "Case assigned to registrar successfully",
            "case_id": blockchain_case_id,
            "assigned_registrar_id": str(registrar_id),
            "assigned_registrar_name": assigned_registrar.get("username", "Registrar"),
            "assigned_registrar_email": assigned_registrar.get("email", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error assigning case: {e}")
        raise HTTPException(status_code=500, detail=f"Error assigning case: {str(e)}")


@app.get('/registrar-cases/{registrar_id}')
async def get_registrar_cases(registrar_id: str):
    """
    Get all blockchain case IDs assigned to a specific registrar.
    """
    try:
        registrar = users_collection.find_one({"_id": ObjectId(registrar_id)})
        if not registrar:
            raise HTTPException(status_code=404, detail="Registrar not found")
        
        case_ids = registrar.get("cases", [])
        
        return {
            "success": True,
            "registrar_id": registrar_id,
            "case_ids": case_ids,
            "total_cases": len(case_ids)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching registrar cases: {str(e)}")


# ==================== STAMP REPORTER ASSIGNMENT ====================

@app.post('/assign-case-to-stampreporter')
async def assign_case_to_stampreporter(request: Request):
    """
    Assign a blockchain case to a specific stamp reporter based on queue (least cases first).
    This works with blockchain case IDs and stores the assignment in MongoDB.
    """
    try:
        data = await request.json()
        blockchain_case_id = data.get("caseID")
        case_subject = data.get("caseSubject", "")
        registrar_email = data.get("registrarEmail", "")
        department = data.get("department", "")
        
        if not blockchain_case_id:
            raise HTTPException(status_code=400, detail="caseID is required")
        
        # Check if case is already assigned to a stamp reporter
        existing_assignment = case_collection.find_one({
            "case_id": blockchain_case_id,
            "assigned_stampreporter": {"$exists": True, "$ne": None}
        })
        
        if existing_assignment:
            # Return success with existing assignment instead of blocking retries
            return {
                "success": True,
                "message": "Case already assigned to a stamp reporter",
                "case_id": blockchain_case_id,
                "assigned_stampreporter_name": existing_assignment.get("stampreporter_name", "Stamp Reporter"),
                "assigned_stampreporter_email": existing_assignment.get("stampreporter_email", ""),
                "already_assigned": True
            }
        
        # Get all stamp reporters - AND filter by the requested department EXACTLY
        query = {"user_type": {"$regex": "^stampreporter$", "$options": "i"}}
        
        # In DB, stamp reporters have a "department" field for case matching
        if department:
            query["department"] = department
            
        stampreporters = list(users_collection.find(query))
        
        print(f"DEBUG: Found {len(stampreporters)} stamp reporters for department {department}")
        
        if not stampreporters:
            raise HTTPException(status_code=404, detail=f"No users present in '{department}' department. Please try again later when an official from this department is available.")
        
        # Queue-based allocation: Find stamp reporter with least cases
        reporter_case_counts = []
        for rep in stampreporters:
            case_count = len(rep.get("cases", []))
            reporter_case_counts.append({"reporter": rep, "case_count": case_count})
        
        reporter_case_counts.sort(key=lambda x: x["case_count"])
        assigned_reporter = reporter_case_counts[0]["reporter"]
        reporter_id = assigned_reporter["_id"]
        
        # Update stamp reporter's cases array - add the blockchain case ID
        users_collection.update_one(
            {"_id": reporter_id},
            {"$addToSet": {"cases": blockchain_case_id}}
        )
        
        # Update or create case reference in case_collection
        case_collection.update_one(
            {"case_id": blockchain_case_id},
            {
                "$set": {
                    "assigned_stampreporter": str(reporter_id),
                    "stampreporter_email": assigned_reporter.get("email"),
                    "stampreporter_name": assigned_reporter.get("username"),
                    "department": department,
                    "status": "PENDING_STAMP_REPORTER_REVIEW",
                    "stampreporter_assigned_at": datetime.now().isoformat()
                }
            },
            upsert=True
        )
        
        # Add notification for the stamp reporter
        notification = {
            "type": "NEW_CASE",
            "message": f"New case assigned: {case_subject or blockchain_case_id}",
            "case_id": blockchain_case_id,
            "department": department,
            "timestamp": datetime.now().isoformat(),
            "read": False
        }
        users_collection.update_one(
            {"_id": reporter_id},
            {"$push": {"notifications": notification}}
        )
        
        return {
            "success": True,
            "message": "Case assigned to stamp reporter successfully",
            "case_id": blockchain_case_id,
            "assigned_stampreporter_id": str(reporter_id),
            "assigned_stampreporter_name": assigned_reporter.get("username", "Stamp Reporter"),
            "assigned_stampreporter_email": assigned_reporter.get("email", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error assigning case to stamp reporter: {e}")
        raise HTTPException(status_code=500, detail=f"Error assigning case: {str(e)}")


# ==================== CASE STATUS UPDATE (Called by fabric-api) ====================

@app.post('/update-case-status')
async def update_case_status(request: Request):
    """
    Update case status and timeline in MongoDB.
    Called by fabric-api after successful blockchain transactions.
    """
    try:
        data = await request.json()
        case_id = data.get("caseID")
        new_status = data.get("status")
        timeline_entries = data.get("timeline", [])
        
        if not case_id:
            raise HTTPException(status_code=400, detail="caseID is required")
        
        print(f"Updating case {case_id} status to {new_status}")
        
        # Build update query
        update_fields = {"last_modified": datetime.now().isoformat()}
        
        if new_status:
            update_fields["status"] = new_status
        
        # Update case in case_collection (by case_id field, not _id)
        result = case_collection.update_one(
            {"case_id": case_id},
            {
                "$set": update_fields,
                "$push": {"timeline": {"$each": timeline_entries}} if timeline_entries else {}
            }
        )
        
        # Also try updating by blockchain case_id pattern
        if result.matched_count == 0:
            result = case_collection.update_one(
                {"case_id": {"$regex": case_id}},
                {
                    "$set": update_fields,
                    "$push": {"timeline": {"$each": timeline_entries}} if timeline_entries else {}
                }
            )
        
        print(f"Update result: matched={result.matched_count}, modified={result.modified_count}")
        
        return {
            "success": True,
            "message": f"Case status updated to {new_status}",
            "case_id": case_id,
            "matched": result.matched_count,
            "modified": result.modified_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating case status: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating case status: {str(e)}")


@app.get('/case-status/{case_id}')
async def get_case_status(case_id: str):
    """
    Get case status and timeline from MongoDB by blockchain case_id.
    Used by lawyer dashboard to see updated status/timeline.
    """
    try:
        # Find by blockchain case_id field
        case_doc = case_collection.find_one({"case_id": case_id})
        
        # Also try regex match for pattern
        if not case_doc:
            case_doc = case_collection.find_one({"case_id": {"$regex": case_id}})
        
        if not case_doc:
            return {
                "success": True,
                "case_id": case_id,
                "status": None,
                "timeline": [],
                "message": "No MongoDB record found - case may only exist on blockchain"
            }
        
        # Convert ObjectId to string
        if "_id" in case_doc:
            case_doc["_id"] = str(case_doc["_id"])
        
        return {
            "success": True,
            "case_id": case_id,
            "status": case_doc.get("status"),
            "timeline": case_doc.get("timeline", []),
            "last_modified": case_doc.get("last_modified"),
            "assigned_registrar": case_doc.get("assigned_registrar"),
            "assigned_stampreporter": case_doc.get("assigned_stampreporter"),
            "assigned_benchclerk": case_doc.get("assigned_benchclerk")
        }
        
    except Exception as e:
        print(f"Error getting case status: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting case status: {str(e)}")


@app.post('/notify-lawyer')
async def notify_lawyer(request: Request):
    """
    Send notification to lawyer about case status update.
    Called by fabric-api after blockchain operations.
    """
    try:
        data = await request.json()
        lawyer_email = data.get("lawyerEmail")
        case_id = data.get("caseID")
        case_subject = data.get("caseSubject", "")
        message = data.get("message", "Your case status has been updated")
        notification_type = data.get("type", "CASE_STATUS_UPDATE")
        
        if not case_id:
            raise HTTPException(status_code=400, detail="caseID is required")
        
        # Find lawyer by email or by case association
        lawyer = None
        if lawyer_email:
            lawyer = users_collection.find_one({"email": lawyer_email, "user_type": "lawyer"})
        
        # If no email provided, try to find lawyer from case
        if not lawyer:
            case_doc = case_collection.find_one({"case_id": case_id})
            if case_doc:
                lawyer_id = case_doc.get("user_id")
                if lawyer_id:
                    lawyer = users_collection.find_one({"_id": ObjectId(lawyer_id)})
        
        if not lawyer:
            print(f"Lawyer not found for case {case_id}")
            return {"success": False, "message": "Lawyer not found"}
        
        # Create notification
        notification = {
            "type": notification_type,
            "message": message,
            "case_id": case_id,
            "case_subject": case_subject,
            "timestamp": datetime.now().isoformat(),
            "read": False
        }
        
        # Add notification to lawyer's notifications array
        users_collection.update_one(
            {"_id": lawyer["_id"]},
            {"$push": {"notifications": notification}}
        )
        
        print(f"Notification sent to lawyer {lawyer.get('email')} for case {case_id}")
        
        return {
            "success": True,
            "message": "Notification sent successfully",
            "lawyer_id": str(lawyer["_id"]),
            "lawyer_email": lawyer.get("email")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error sending notification: {e}")
        raise HTTPException(status_code=500, detail=f"Error sending notification: {str(e)}")


# ==================== BENCH CLERK ASSIGNMENT ====================

@app.post('/assign-case-to-benchclerk')
async def assign_case_to_benchclerk(request: Request):
    """
    Assign a blockchain case to a specific bench clerk based on queue (least cases first).
    This works with blockchain case IDs and stores the assignment in MongoDB.
    """
    try:
        data = await request.json()
        blockchain_case_id = data.get("caseID")
        case_subject = data.get("caseSubject", "")
        stamp_reporter_email = data.get("stampReporterEmail", "")
        
        if not blockchain_case_id:
            raise HTTPException(status_code=400, detail="caseID is required")
        
        # Check if case is already assigned to a bench clerk
        existing_assignment = case_collection.find_one({
            "case_id": blockchain_case_id,
            "assigned_benchclerk": {"$exists": True, "$ne": None}
        })
        
        if existing_assignment:
            # Return success with existing assignment instead of blocking retries
            return {
                "success": True,
                "message": "Case already assigned to a bench clerk",
                "case_id": blockchain_case_id,
                "assigned_benchclerk_name": existing_assignment.get("benchclerk_name", "Bench Clerk"),
                "assigned_benchclerk_email": existing_assignment.get("benchclerk_email", ""),
                "already_assigned": True
            }
        
        # Get all bench clerks - use case-insensitive regex for user_type
        benchclerks = list(users_collection.find({
            "user_type": {"$regex": "^benchclerk$", "$options": "i"}
        }))
        
        print(f"DEBUG: Found {len(benchclerks)} bench clerks")
        
        if not benchclerks:
            raise HTTPException(status_code=404, detail="No bench clerks available in the system. Please ensure at least one bench clerk account exists.")
        
        # Queue-based allocation: Find bench clerk with least cases
        clerk_case_counts = []
        for clerk in benchclerks:
            case_count = len(clerk.get("cases", []))
            clerk_case_counts.append({
                "clerk": clerk,
                "case_count": case_count
            })
        
        # Sort by case count (ascending) and pick the one with least cases
        clerk_case_counts.sort(key=lambda x: x["case_count"])
        assigned_clerk = clerk_case_counts[0]["clerk"]
        clerk_id = assigned_clerk["_id"]
        
        # Update bench clerk's cases array - add the blockchain case ID
        users_collection.update_one(
            {"_id": clerk_id},
            {"$addToSet": {"cases": blockchain_case_id}}
        )
        
        # Update or create case reference in case_collection
        case_collection.update_one(
            {"case_id": blockchain_case_id},
            {
                "$set": {
                    "assigned_benchclerk": str(clerk_id),
                    "benchclerk_email": assigned_clerk.get("email"),
                    "benchclerk_name": assigned_clerk.get("username"),
                    "status": "PENDING_BENCH_CLERK_REVIEW",
                    "benchclerk_assigned_at": datetime.now().isoformat()
                }
            },
            upsert=True
        )
        
        # Add notification for the bench clerk
        notification = {
            "type": "NEW_CASE",
            "message": f"New case assigned: {case_subject or blockchain_case_id}",
            "case_id": blockchain_case_id,
            "timestamp": datetime.now().isoformat(),
            "read": False
        }
        users_collection.update_one(
            {"_id": clerk_id},
            {"$push": {"notifications": notification}}
        )
        
        return {
            "success": True,
            "message": "Case assigned to bench clerk successfully",
            "case_id": blockchain_case_id,
            "assigned_benchclerk_id": str(clerk_id),
            "assigned_benchclerk_name": assigned_clerk.get("username", "Bench Clerk"),
            "assigned_benchclerk_email": assigned_clerk.get("email", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error assigning case to bench clerk: {e}")
        raise HTTPException(status_code=500, detail=f"Error assigning case: {str(e)}")


@app.get('/benchclerk-cases/{benchclerk_id}')
async def get_benchclerk_cases(benchclerk_id: str):
    """
    Get all blockchain case IDs assigned to a specific bench clerk.
    """
    try:
        benchclerk = users_collection.find_one({"_id": ObjectId(benchclerk_id)})
        if not benchclerk:
            raise HTTPException(status_code=404, detail="Bench clerk not found")
        
        case_ids = benchclerk.get("cases", [])
        
        return {
            "success": True,
            "benchclerk_id": benchclerk_id,
            "case_ids": case_ids,
            "total_cases": len(case_ids)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching bench clerk cases: {str(e)}")


@app.get('/stampreporter-cases/{stampreporter_id}')
async def get_stampreporter_cases(stampreporter_id: str):
    """
    Get all blockchain case IDs assigned to a specific stamp reporter.
    """
    try:
        stampreporter = users_collection.find_one({"_id": ObjectId(stampreporter_id)})
        if not stampreporter:
            raise HTTPException(status_code=404, detail="Stamp reporter not found")
        
        case_ids = stampreporter.get("cases", [])
        
        return {
            "success": True,
            "stampreporter_id": stampreporter_id,
            "case_ids": case_ids,
            "total_cases": len(case_ids)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching stamp reporter cases: {str(e)}")

    
@app.post('/case/{case_id}/send-to-registrar')
async def send_to_registrar(case_id: str):
    case = case_collection.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    # Check if case is already assigned
    if case.get("assigned_registrar"):
        raise HTTPException(status_code=400, detail="Case already assigned to a registrar")
    
    registrars = list(users_collection.find({"user_type": "registrar"}))
    if not registrars:
        raise HTTPException(status_code=404, detail="No registrars found")
    
    # Queue-based allocation: Find registrar with least cases
    registrar_case_counts = []
    for reg in registrars:
        case_count = len(reg.get("cases", []))
        registrar_case_counts.append({
            "registrar": reg,
            "case_count": case_count
        })
    
    # Sort by case count (ascending) and pick the one with least cases
    registrar_case_counts.sort(key=lambda x: x["case_count"])
    assigned_registrar = registrar_case_counts[0]["registrar"]
    registrar_id = assigned_registrar["_id"]
    
    # Update registrar's cases list
    users_collection.update_one(
        {"_id": registrar_id},
        {"$addToSet": {"cases": case_id}}
    )
    
    # Update case with assigned registrar
    case_collection.update_one(
        {"_id": ObjectId(case_id)},
        {"$set": {"assigned_registrar": str(registrar_id), "status": "PENDING_REGISTRAR_REVIEW"}}
    )
    
    # Add notification for the registrar
    notification = {
        "type": "NEW_CASE",
        "message": f"New case assigned: {case.get('case_subject', case_id)}",
        "case_id": case_id,
        "timestamp": datetime.now().isoformat(),
        "read": False
    }
    users_collection.update_one(
        {"_id": registrar_id},
        {"$push": {"notifications": notification}}
    )

    updated_registrar = users_collection.find_one({"_id": registrar_id})
    updated_cases = updated_registrar.get("cases", [])

    return {
        "message": "Case assigned successfully",
        "case_id": case_id,
        "assigned_registrar": str(registrar_id),
        "registrar_name": assigned_registrar.get("username", "Registrar"),
        "registrar_cases": updated_cases
    }

    
@app.get('/registrar/{user_id}')
async def registrar_dashboard(user_id: str):
    try:
        registrar = users_collection.find_one({"_id": ObjectId(user_id), "user_type": "registrar"})
        if not registrar:
            raise HTTPException(status_code=404, detail="Registrar not found")
        assigned_cases = registrar.get("cases", [])
        total_cases = len(assigned_cases)
        notifications = registrar.get("notifications", [])
        return {
            "name": registrar.get("name", "Registrar"),
            "total_cases": total_cases,
            "notifications": len(notifications)
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching registrar data: {str(e)}")
from bson import ObjectId

def convert_objectids(doc):
    if isinstance(doc, dict):
        return {k: convert_objectids(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [convert_objectids(i) for i in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc


from bson import ObjectId
from fastapi import HTTPException

@app.get("/get-cases-registrar/{user_id}")
async def get_cases(user_id: str):
    print(f"Received user_id: {user_id}")

    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id")

    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    case_ids = user.get('cases', [])
    object_ids = [ObjectId(c) for c in case_ids if ObjectId.is_valid(c)]
    
    # Fetch cases
    cursor = case_collection.find({"_id": {"$in": object_ids}})
    case_docs = []
    
    for c in cursor:
        # Convert all ObjectId fields in the document to strings
        def convert_objectid(doc):
            for key, value in doc.items():
                if isinstance(value, ObjectId):
                    doc[key] = str(value)
                elif isinstance(value, dict):
                    doc[key] = convert_objectid(value)
                elif isinstance(value, list):
                    doc[key] = [str(v) if isinstance(v, ObjectId) else v for v in value]
            return doc
        
        case_docs.append(convert_objectid(c))

    print(case_docs)
    return {"cases": case_docs}


@app.get("/get-cases-stampreporter/{user_id}")
async def get_cases(user_id: str):
    print(f"Received user_id: {user_id}")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id")
    
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    case_ids = user.get('cases', [])
    print(case_ids)
    
    object_ids = [ObjectId(c) for c in case_ids]
    cursor = case_collection.find({"_id": {"$in": object_ids}})
    
    case_docs = [convert_objectids(c) for c in cursor]
    
    print(case_docs)
    return {"cases": case_docs}


from bson import ObjectId
from fastapi import HTTPException

def convert_objectid(doc):
    """
    Recursively convert ObjectId fields to string in a dictionary or list.
    """
    if isinstance(doc, dict):
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                doc[key] = str(value)
            elif isinstance(value, (dict, list)):
                doc[key] = convert_objectid(value)
    elif isinstance(doc, list):
        doc = [convert_objectid(item) for item in doc]
    return doc

@app.get('/registrar/case-verification/{case_id}')
async def case_verification(case_id: str):
    if not ObjectId.is_valid(case_id):
        raise HTTPException(status_code=400, detail="Invalid case_id")

    case1 = case_collection.find_one({"_id": ObjectId(case_id)})
    if not case1:
        raise HTTPException(status_code=404, detail="Case not found")

    case1 = convert_objectid(case1)
    return {"case": case1}



@app.post("/case/{case_id}/reject")
async def case_reject(case_id: str, request: Request):
    try:
        case1 = case_collection.find_one({"_id": ObjectId(case_id)})
        if not case1:
            raise HTTPException(status_code=404, detail="Case not found")
        data = await request.json()
        reason = data.get("reason")
        if not reason:
            raise HTTPException(status_code=400, detail="Reason for rejection is required")
        
        # Update the case status and rejection reason
        case_collection.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"status": "Rejected", "rejected": {"status": True, "reason": reason}}}
        )
        
        # Add the case ID to the rejected_cases list of the stamp reporter
        stamp_reporter_id = case1.get("assigned_stamp_reporter")
        if stamp_reporter_id:
            users_collection.update_one(
                {"_id": ObjectId(stamp_reporter_id)},
                {"$addToSet": {"rejected_cases": case_id}}
            )
        
        # Add a notification for the lawyer
        notification_data = {
            "case_id": case_id,
            "message": f"Case rejected: {reason}",
            "timestamp": datetime.now(),
            "lawyer_id": case1["user_id"]
        }
        lawyer_notification.insert_one(notification_data)

        return {"message": "Case rejected successfully", "case_id": case_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rejecting case: {str(e)}")



@app.get('/notification/{uid}')
async def get_notifications(uid: str):
    try:
        print(f"Looking for user with ID: {uid}")
        user_object_id = ObjectId(uid)
        print(f"Converted to ObjectId: {user_object_id}")
        
        user = users_collection.find_one({"_id": user_object_id})
        print(f"User found: {user is not None}")
        
        if not user:
            raise HTTPException(status_code=404, detail=f"User not found with ID: {uid}")
        
        notifications = user.get("notifications", [])
        
        if not notifications:
            return {
                "user_id": str(user_object_id), 
                "notifications": [],
                "message": "No notifications present"
            }
        
        return {"user_id": str(user_object_id), "notifications": notifications}
    except Exception as e:
        print(f"Error in get_notifications: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error fetching notifications: {str(e)}")


  
    
    from fastapi import HTTPException
from bson import ObjectId
import random  # add this import

@app.post('/registrar/case-assignment/{case_id}')
async def send_to_stamp_reporter(case_id: str):
    print(case_id)
    try:
        # fetch the case
        case = case_collection.find_one({"_id": ObjectId(case_id)})
        print(case)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")

        # fetch all stamp reporters
        stamp_reporters = list(users_collection.find({"user_type": "stampreporter"}))
        if not stamp_reporters:
            raise HTTPException(status_code=400, detail="No stamp reporters found")

        # randomly pick one
        assigned_reporter = random.choice(stamp_reporters)
        reporter_id = assigned_reporter["_id"]

        # update the chosen reporter's cases (add case_id if not already there)
        users_collection.update_one(
            {"_id": reporter_id},
            {"$addToSet": {"cases": case_id}}  # Ensures uniqueness
        )

        # **update the case to reflect the assigned reporter**
        case_collection.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"assigned_stamp_reporter": reporter_id}}
        )

        return {
            "message": "Case assigned to stamp reporter successfully",
            "case_id": case_id,
            "assigned_stamp_reporter": str(reporter_id),
            "reporter_cases": assigned_reporter.get("cases", []) + [case_id]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error assigning case: {str(e)}")


# Stamp Reporter


class CaseStampVerifyRequest(BaseModel):
    user_id: str

@app.post('/case-stamp-verif/{case_id}')
async def case_stamp_verif(case_id: str, request: CaseStampVerifyRequest):
    try:
        user_id = request.user_id
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        user_cases = user.get("cases", [])
        matching_case = next((c for c in user_cases if c == case_id), None)
        
        if not matching_case:
            raise HTTPException(status_code=404, detail="Case not found in user's cases")
            
        case = case_collection.find_one({'_id': ObjectId(matching_case)})
        
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
            
        # Convert ObjectId to string and other BSON types to JSON-compatible types
        case['_id'] = str(case['_id'])
        if 'user_id' in case:
            case['user_id'] = str(case['user_id'])
        if 'assigned_registrar' in case:
            case['assigned_registrar'] = str(case['assigned_registrar'])
        if 'assigned_stamp_reporter' in case:
            case['assigned_stamp_reporter'] = str(case['assigned_stamp_reporter'])
            
        # Handle file_cids if it exists
        if 'file_cids' in case and isinstance(case['file_cids'], list):
            for file in case['file_cids']:
                if isinstance(file, dict) and '_id' in file:
                    file['_id'] = str(file['_id'])
                    
        return {"message": "Case found", "case": jsonable_encoder(case)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching case: {str(e)}")




@app.post("/case/{case_id}/accept")
async def accept_case(case_id: str, request: Request):
    try:
        case1 = case_collection.find_one({"_id": ObjectId(case_id)})
        if not case1:
            raise HTTPException(status_code=404, detail="Case not found")
        
        data = await request.json()
        print(data)
        digital_signature = data.get("digital_signature")
        if not digital_signature:
            raise HTTPException(status_code=400, detail="Digital signature is required")
        
        stamp_reporter = users_collection.find_one({"_id": ObjectId(case1.get("assigned_stamp_reporter"))})
        if not stamp_reporter:
            raise HTTPException(status_code=404, detail="Stamp reporter not found")
        
        print(digital_signature)

        print(stamp_reporter.get("digital_sign"))
        if digital_signature != stamp_reporter.get("digital_sign"):
            raise HTTPException(status_code=400, detail="Invalid digital signature")
        
        # Update case status
        case_collection.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"status": "Verified", "approved": True}}
        )
        
        # Add to stamp reporter's verified cases
        users_collection.update_one(
            {"_id": ObjectId(stamp_reporter["_id"])},
            {"$addToSet": {"verified_cases": case_id}}
        )
                
        bench_clerks = list(users_collection.find({"user_type": "benchclerk"}))
        if not bench_clerks:
            raise HTTPException(status_code=400, detail="No bench clerks found")

        # randomly select one
        assigned_clerk = random.choice(bench_clerks)
        clerk_id = assigned_clerk["_id"]

        # update the chosen bench clerk's cases
        users_collection.update_one(
            {"_id": clerk_id},
            {"$addToSet": {"cases": case_id}}  # add case_id if not already present
        )

        # update the case with assigned bench clerk
        case_collection.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"assigned_bench_clerk": clerk_id}}
        )
        return {"message": "Case accepted and verified successfully", "case_id": case_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error accepting case: {str(e)}")
    
    
    
    
@app.get("/all-cases/{user_id}")
async def get_all_cases(user_id: str):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        case_ids = user.get("verified_cases", []) + user.get("rejected_cases", [])
        all_cases = list(case_collection.find({"_id": {"$in": [ObjectId(case_id) for case_id in case_ids]}}))

        for case in all_cases:
            case["_id"] = str(case["_id"])
            case['filed_date'] = case['filed_date'].strftime('%Y-%m-%d %H:%M:%S')
            case['assigned_registrar'] = str(case.get('assigned_registrar', ''))

        return {"cases": all_cases}
    except Exception as e:
        print(f"Error fetching all cases: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    
    
    
    

@app.get("/all-sr-cases/{user_id}")
async def get_all_cases(user_id: str):
    try:
        user = users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        case_ids = user.get("cases", []) 
        all_cases = list(case_collection.find({"_id": {"$in": [ObjectId(case_id) for case_id in case_ids]}}))

        for case in all_cases:
            case["_id"] = str(case["_id"])
            case['filed_date'] = case['filed_date'].strftime('%Y-%m-%d %H:%M:%S')
            case['assigned_registrar'] = str(case.get('assigned_registrar', ''))

        return {"cases": all_cases}
    except Exception as e:
        print(f"Error fetching all cases: {str(e)}")
        raise HTTPException(status_code=500,detail="Internal server error")
    
    
    
    
@app.get('/benchclerk/notifs/{bench_id}')
async def bench_notif(bench_id: str):
    try:
        user = users_collection.find_one({"_id":ObjectId(bench_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        notifications = user.get('notifications', [])
        
        if not notifications:
            return {
                "notifications": [],
                "message": "No notifications present"
            }
        
        formatted_notifications = []
        for notification in notifications:
            formatted_notifications.append({
                "case_id": notification.get("case_id", ""),
                "message": notification.get("message", ""),
                "timestamp": notification.get("timestamp", "").strftime('%Y-%m-%d %H:%M:%S')
            })
        return {"notifications": formatted_notifications}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching notifications: {str(e)}")
    
    
@app.post('/case/{case_id}/send-to-judge')
async def send_to_registrar(case_id: str):
    case1 = case_collection.find_one({"_id": ObjectId(case_id)})
    print(case1['associated_lawyers'])
    # lawyer = users_collection.find_one({"username": case1['associated_lawyers']})
    # print("Lawyer is "+lawyer)
    # if not lawyer:
    #     raise HTTPException(status_code=404, detail="Lawyer not found")
    # users_collection.update_one(
    #     {"_id": lawyer['_id']}, 
    #     {"$inc": {"verified_cases": 1}}  
    # )
    judge = list(users_collection.find({"user_type": "judge"}))
    if not judge:
        raise HTTPException(status_code=404, detail="No registrars found")
    judge.sort(key=lambda r: len(r.get("cases", [])))  
    assigned_judge = judge[0]
    judge_id = assigned_judge["_id"]
    users_collection.update_one(
        {"_id": judge_id}, 
        {"$addToSet": {"cases": case_id}}  
    )
    case_collection.update_one(
        {"_id": ObjectId(case_id)}, 
        {"$set": {"judge_registrar": str(judge_id)}}
    )
    return {
        "message": "Case assigned successfully",
        "case_id": case_id,
        "assigned_judge": str(judge_id),
        "judge_cases": assigned_judge.get("cases", []) + [case_id]  # Updated cases list
    }



@app.post("/case/{case_id}/decision")
async def case_decision(case_id: str, request: Request):
    try:
        # Fetch the case details
        case1 = case_collection.find_one({"_id": ObjectId(case_id)})
        if not case1:
            raise HTTPException(status_code=404, detail="Case not found")

        # Parse the request data
        data = await request.json()
        decision = data.get("decision")
        reason = data.get("reason")

        if not decision or not reason:
            raise HTTPException(status_code=400, detail="Decision and reason are required")

        # Update the case status and decision reason
        case_collection.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"status": decision, "decision_reason": reason}}
        )

        # Create a notification message
        notification_message = f"Case '{case1['case_subject']}' (ID: {case_id}) has been {decision}. Reason: {reason}"

        # Notify the lawyer
        lawyer_id = case1.get("user_id")
        if lawyer_id:
            lawyer_notification.insert_one({
                "case_id": case_id,
                "message": notification_message,
                "timestamp": datetime.now(),
                "lawyer_id": lawyer_id
            })

        # Notify the registrar
        registrar_id = case1.get("assigned_registrar")
        if registrar_id:
            users_collection.update_one(
                {"_id": ObjectId(registrar_id)},
                {"$push": {"notifications": {"case_id": case_id, "message": notification_message, "timestamp": datetime.now()}}}
            )

        # Notify the stamp reporter
        stamp_reporter_id = case1.get("assigned_stamp_reporter")
        if stamp_reporter_id:
            users_collection.update_one(
                {"_id": ObjectId(stamp_reporter_id)},
                {"$push": {"notifications": {"case_id": case_id, "message": notification_message, "timestamp": datetime.now()}}}
            )

        # Notify the bench clerk
        bench_clerk = users_collection.find_one({"user_type": "bench-clerk", "cases": case_id})
        if bench_clerk:
            users_collection.update_one(
                {"_id": bench_clerk["_id"]},
                {"$push": {"notifications": {"case_id": case_id, "message": notification_message, "timestamp": datetime.now()}}}
            )

        # Notify the judge
        judge_id = case1.get("judge_registrar")
        if judge_id:
            users_collection.update_one(
                {"_id": ObjectId(judge_id)},
                {"$push": {"notifications": {"case_id": case_id, "message": notification_message, "timestamp": datetime.now()}}}
            )

        return {"message": "Decision recorded and notifications sent successfully", "case_id": case_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing decision: {str(e)}")


@app.post("/upload-to-ipfs")
async def upload_to_ipfs(file: UploadFile = File(...)):
    """
    Upload a file to IPFS using Pinata
    """
    try:
        import httpx
        
        # Read file content
        file_content = await file.read()
        
        # Prepare the request to Pinata
        files = {
            'file': (file.filename, file_content, file.content_type)
        }
        
        headers = {
            'pinata_api_key': PINATA_API_KEY,
            'pinata_secret_api_key': PINATA_SECRET_API_KEY
        }
        
        # Upload to Pinata
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                PINATA_URL,
                files=files,
                headers=headers
            )
        
        if response.status_code == 200:
            result = response.json()
            return {
                "success": True,
                "ipfsHash": result["IpfsHash"],
                "pinSize": result["PinSize"],
                "timestamp": result["Timestamp"],
                "filename": file.filename
            }
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to upload to IPFS: {response.text}"
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading to IPFS: {str(e)}")


@app.post("/link-case")
async def link_case(
    case_id: str = Form(...),
    user_type: str = Form(...),
    username: str = Form(...),
    license_id: str = Form(...),
    email: str = Form(...)
):
    """
    Store a reference linking a blockchain case to a user in MongoDB.
    This allows querying cases by user without storing full case data in MongoDB.
    """
    try:
        case_reference = {
            "case_id": case_id,
            "user_type": user_type,
            "username": username,
            "license_id": license_id,
            "email": email,
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = case_collection.insert_one(case_reference)
        
        if result.inserted_id:
            return {
                "success": True,
                "message": "Case linked successfully",
                "reference_id": str(result.inserted_id)
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to link case")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error linking case: {str(e)}")


@app.get("/user-cases/{email}")
async def get_user_cases(email: str):
    """
    Get all case IDs associated with a user by their email.
    Frontend should then fetch full case details from blockchain API using these IDs.
    """
    try:
        case_references = list(case_collection.find({"email": email}))
        
        # Convert ObjectId to string for JSON serialization
        for ref in case_references:
            ref["_id"] = str(ref["_id"])
        
        return {
            "success": True,
            "case_ids": [ref["case_id"] for ref in case_references],
            "references": case_references
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user cases: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)



@app.get("/judges")
async def get_all_judges():
    try:
        judges = list(users_collection.find({"user_type": "judge"}, {"_id": 1, "username": 1, "email": 1, "judgeId": 1}))
        for judge in judges:
            judge["_id"] = str(judge["_id"])
        return {"success": True, "judges": judges}
    except Exception as e:
        return JSONResponse(status_code=500, content={"success": False, "message": str(e)})

@app.put('/notification/{uid}/mark-read')
async def mark_notifications_read(uid: str):
    try:
        user_object_id = ObjectId(uid)
        result = users_collection.update_one(
            {"_id": user_object_id},
            {"$set": {"notifications.$[].read": True}}
        )
        return {"success": True, "message": "Notifications marked as read"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating notifications: {str(e)}")
