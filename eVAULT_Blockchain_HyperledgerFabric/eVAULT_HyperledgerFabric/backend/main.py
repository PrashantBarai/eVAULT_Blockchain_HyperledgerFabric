from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from models import *
from utils import *
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
from config import *
from database import users_collection,case_collection, notifications
from typing import List, Optional
from bson import ObjectId
import random
import os
import uuid

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


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
    data = {
        "user_type": user_type,
        "username": username,
        "email": email,
        "licenseId": licenseId,
        "password": password,
        "phone_number": phone_number,
        "address": address, 
        "notifications":[],
    }
    if user_type=="registrar":
        data['cases'] = []
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
    user["_id"] = str(user["_id"])
    return {"user_data": user}


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
            "associated_lawyers": associated_lawyers,
            "associated_judge": associated_judge,
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
        print(case_data)
        case_result = case_collection.insert_one(case_data)
        case_id = str(case_result.inserted_id)
        
        users_collection.update_one(
            {'_id': ObjectId(user_id), "user_type": "lawyer"},
            {'$inc': {'pending_cases': 1}}
        )

        user = users_collection.find_one({"_id": ObjectId(user_id)})

        return {
            "message": "Case submitted successfully",
            "case_id": case_id,
            "user": {"user_id": user_id, "pending_cases": user['pending_cases']}
        }
    
    except Exception as e:
        print("Error:", e)
        raise HTTPException(status_code=400, detail=f"Error submitting case: {str(e)}")



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
    
@app.post('/case/{case_id}/send-to-registrar')
async def send_to_registrar(case_id: str):
    case = case_collection.find_one({"_id": ObjectId(case_id)})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    registrars = list(users_collection.find({"user_type": "registrar"}))
    if not registrars:
        raise HTTPException(status_code=404, detail="No registrars found")
    assigned_registrar = random.choice(registrars)
    registrar_id = assigned_registrar["_id"]
    users_collection.update_one(
        {"_id": registrar_id},
        {"$addToSet": {"cases": case_id}}
    )

    updated_registrar = users_collection.find_one({"_id": registrar_id})
    updated_cases = updated_registrar.get("cases", [])

    return {
        "message": "Case assigned successfully",
        "case_id": case_id,
        "assigned_registrar": str(registrar_id),
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



@app.get("/get-cases-registrar/{user_id}")
async def get_cases(user_id: str):
    print(f"Received user_id: {user_id}")
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id")
    user = users_collection.find_one({'_id': ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    case_ids = user.get('cases', [])
    object_ids = [ObjectId(c) if ObjectId.is_valid(c) else c for c in case_ids]
    cursor = case_collection.find({"_id": {"$in": object_ids}})
    case_docs = list(cursor)
    for c in case_docs:
        c["_id"] = str(c["_id"])

    return {"cases": case_docs}



@app.get('/registrar/case-verification/{case_id}')
async def case_verification(case_id: str):
    case1 = case_collection.find_one({"_id": ObjectId(case_id)})
    print(case1)
    if not case1:raise HTTPException(status_code=404, detail="Case not found")
    case1["_id"] = str(case1["_id"])
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
    uid = ObjectId(uid)
    print(uid)
    user = users_collection.find_one({"_id": uid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    notifications = user.get("notifications", [])
    return {"user_id": str(uid), "notifications": notifications}


  
    
    
@app.post('/registrar/case-assignment/{case_id}')
async def send_to_stamp_reporter(case_id: str):
    print(case_id)
    try:
        case = case_collection.find_one({"_id": ObjectId(case_id)})
        print(case)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        registrar = users_collection.find_one({"_id": ObjectId(case.get("assigned_registrar"))})
        if not registrar:
            raise HTTPException(status_code=404, detail="Registrar not found")
        stamp_reporters = list(users_collection.find({"user_type": "stamp-reporter"}))
        if not stamp_reporters:  
            raise HTTPException(status_code=400, detail="No stamp reporters found")
        stamp_reporters.sort(key=lambda sr: len(sr.get("cases", [])))
        assigned_reporter = stamp_reporters[0]
        reporter_id = assigned_reporter["_id"]

        users_collection.update_one(
            {"_id": reporter_id},
            {"$addToSet": {"cases": case_id}}  # Ensures uniqueness
        )

        case_collection.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"assigned_stamp_reporter": str(reporter_id)}}
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
        digital_signature = data.get("digital_signature")
        if not digital_signature:
            raise HTTPException(status_code=400, detail="Digital signature is required")
        
        stamp_reporter = users_collection.find_one({"_id": ObjectId(case1.get("assigned_stamp_reporter"))})
        if not stamp_reporter:
            raise HTTPException(status_code=404, detail="Stamp reporter not found")
        
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
        
        # Find bench clerk and update
        bench_clerk = users_collection.find_one({"user_type": "bench-clerk"}, sort=[("cases", 1)])
        notification_data = {
            "case_id": case_id,
            "message": f"Case '{case1['case_subject']}' (ID: {case_id}) has been verified by the stamp reporter.",
            "timestamp": datetime.now(),
            "lawyer_id": case1["user_id"]
        }
        
        if bench_clerk:
            # Corrected update operation - combine both updates in one command
            users_collection.update_one(
                {"_id": bench_clerk["_id"]},
                {
                    "$addToSet": {
                        "cases": case_id,
                        "notifications": notification_data
                    }
                }
            )
        
        lawyer_notification.insert_one(notification_data)
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
    
@app.get('/benchclerk/notifs/{bench_id}')
async def bench_notif(bench_id: str):
    try:
        user = users_collection.find_one({"_id":ObjectId(bench_id)})
        formatted_notifications = []
        for notification in user['notifications']:
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

