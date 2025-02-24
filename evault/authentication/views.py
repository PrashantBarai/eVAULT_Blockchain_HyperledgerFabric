from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from pymongo import MongoClient
import json
import bcrypt
from authentication.utils import verify_password, hash_password
import jwt
import datetime
from django.conf import settings

client = MongoClient("mongodb://localhost:27017/")
db = client["evault"]
users_collection = db["users"]


@csrf_exempt  
def signup(request):
    if request.method == "OPTIONS":
        response = JsonResponse({"message": "CORS preflight successful"})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        print(response)
        return response
    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))  
            print("Received data:", data)
            username = data['username']
            password = data['password']
            email = data['email']
            hashed_pw = hash_password(password)
            role = data['role']
            users_collection.insert_one({"username":username,"password":password,"email":email,"hpassw":hashed_pw,"role":role})
            return JsonResponse({"message": "Signup successful", "data": data}, status=201)
        except json.JSONDecodeError as e:
            return JsonResponse({"error": "Invalid JSON", "details": str(e)}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)



SECRET_KEY = "your_secret_key"  

@csrf_exempt  
def login(request):
    if request.method == "OPTIONS":
        response = JsonResponse({"message": "CORS preflight successful"})
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    if request.method == "POST":
        try:
            data = json.loads(request.body.decode("utf-8"))
            username = data.get("username")
            password = data.get("password")

            user = users_collection.find_one({"username": username})
            if user and verify_password(password, user["hpassw"]):
                # Generate JWT token
                payload = {
                    "username": user["username"],
                    "role": user["role"].lower(),
                    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1),
                }
                token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

                return JsonResponse({
                    "message": "Login successful",
                    "username": user["username"],
                    "role": user["role"].lower(),
                    "uid": str(user["_id"]),  # Convert ObjectId to string
                    "token": token,  
                }, status=200)
            else:
                return JsonResponse({"error": "Invalid username or password"}, status=401)
        except json.JSONDecodeError as e:
            return JsonResponse({"error": "Invalid JSON", "details": str(e)}, status=400)

    return JsonResponse({"error": "Invalid request method"}, status=405)
