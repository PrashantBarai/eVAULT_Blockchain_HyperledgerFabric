from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form, Request
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from datetime import datetime, timedelta
from backend.models import *
from backend.utils import *
from backend.config import *
from backend.database import users_collection,case_collection, lawyer_notification, benchclerk_notification
from typing import List, Optional
from bson import ObjectId
import os
import uuid

app = FastAPI()

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
    elif user.user_type == "stamp-reporter":
        user_data["pending_cases"] = 0
        user_data["verified_case_number"] = 0
        user_data["rejected_case_number"] = 0
        user_data["verified_cases"] = []
        user_data["rejected_cases"] = []
        user_data['digital_sign'] = str(uuid.uuid1())
        user_data['cases'] = []
    elif user.user_type == "bench-clerk":
        user_data["pending_cases"] = 0
        user_data["verified_case_number"] = 0
        user_data["rejected_case_number"] = 0
        user_data["verified_cases"] = []
        user_data["rejected_cases"] = []
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
    description: str = Form(...),
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
            "description":description,
            "approved":False,
            "rejected":{"status":False,"reason":""},
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
    print(f"Received user_id: {user_id}")  # Debug print

    if ObjectId.is_valid(user_id): 
        user = users_collection.find_one({'_id': ObjectId(user_id)})

    if not user:
        return {"error": "User not found"}

    reg_c = []
    if user['user_type'] in ('registrar', 'stamp-reporter', 'bench-clerk'):
        if "cases" in user:
            for case_id in user["cases"]:
                print(user['user_type'])
                if ObjectId.is_valid(case_id):
                    c = case_collection.find_one({'_id': ObjectId(case_id)})
                    if c:
                        c['_id'] = str(c['_id'])
                        c['filed_date'] = c['filed_date'].strftime('%Y-%m-%d %H:%M:%S')
                        c['assigned_registrar'] = str(c.get('assigned_registrar', ''))
                        reg_c.append(c)
            return {"cases": reg_c}

    # cases = list(case_collection.find({"user_id": user_id}))
    # for c in cases:
    #     c["_id"] = str(c["_id"])
    #     c['filed_date'] = c['filed_date'].strftime('%Y-%m-%d %H:%M:%S')
    #     c['assigned_registrar'] = str(c.get('assigned_registrar', ''))

    # return {"cases": cases}



    
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
        if not case1:raise HTTPException(status_code=404, detail="Case not found")        
        case1["_id"] = str(case1["_id"])
        return {"case": case1}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching case details: {str(e)}")
    
    
@app.post('/case/{case_id}/send-to-registrar')
async def send_to_registrar(case_id: str):
    try:
        case1 = case_collection.find_one({"_id": ObjectId(case_id)})
        if not case1:
            raise HTTPException(status_code=404, detail="Case not found")
        lawyer = users_collection.find_one({"username": case1['associated_lawyers']})
        if not lawyer:
            raise HTTPException(status_code=404, detail="Lawyer not found")
        users_collection.update_one(
            {"_id": lawyer['_id']}, 
            {"$inc": {"verified_cases": 1}}  
        )
        # Get the list of registrars
        registrars = list(users_collection.find({"user_type": "registrar"}))
        if not registrars:
            raise HTTPException(status_code=404, detail="No registrars found")
        # Assign to the registrar with the least cases
        registrars.sort(key=lambda r: len(r.get("cases", [])))  
        assigned_registrar = registrars[0]
        registrar_id = assigned_registrar["_id"]
        # Append the case_id to the registrar's cases list and update in MongoDB
        users_collection.update_one(
            {"_id": registrar_id}, 
            {"$addToSet": {"cases": case_id}}  # Ensures uniqueness
        )
        # Assign the registrar to the case
        case_collection.update_one(
            {"_id": ObjectId(case_id)}, 
            {"$set": {"assigned_registrar": str(registrar_id)}}
        )
        return {
            "message": "Case assigned successfully",
            "case_id": case_id,
            "assigned_registrar": str(registrar_id),
            "registrar_cases": assigned_registrar.get("cases", []) + [case_id]  # Updated cases list
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error assigning case: {str(e)}")

# @app.get('/reg/
    
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



@app.get('/lawyer/notifs/{lawyer_id}')
async def get_notifications(lawyer_id: str):
    try:
        notifications = list(lawyer_notification.find({"lawyer_id": lawyer_id}))
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
    