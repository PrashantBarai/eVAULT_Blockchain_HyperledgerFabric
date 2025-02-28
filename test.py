from flask import Flask, request, jsonify, session, redirect, url_for
import couchdb
import os
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from urllib.parse import quote
from werkzeug.utils import secure_filename
import requests
from flask_cors import CORS
from flask_session import Session


load_dotenv()

app = Flask(__name__)
app.secret_key = "your_secret_key"
app.config["SECRET_KEY"] = "your_secret_key"
app.config["SESSION_TYPE"] = "filesystem"  # Use server-side session storage
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False  # For local session storage
app.config["WTF_CSRF_ENABLED"] = False

CORS(app, supports_credentials=True)
Session(app)
COUCH_PASS = os.getenv("COUCH_PASS")
COUCH_PASS_ENCODED = quote(COUCH_PASS, safe='')
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "docx", "jpg", "png"}

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

COUCHDB_URL = f"http://ammar:{COUCH_PASS_ENCODED}@127.0.0.1:5984/"
JWT = os.getenv('JWT')
PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY")
PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"
app.config["SESSION_COOKIE_HTTPONLY"] = False
app.config["SESSION_COOKIE_SAMESITE"] = "None"
# app.config["SESSION_COOKIE_SECURE"] = True  #
server = couchdb.Server(COUCHDB_URL)

try:
    users_db = server.create("users")
except couchdb.http.PreconditionFailed:
    users_db = server["users"]

try:
    cases_db = server.create("cases")
except couchdb.http.PreconditionFailed:
    cases_db = server["cases"]

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# API Routes
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    phone = data.get("phone")
    aadhar = data.get("aadhar")
    credit_card = data.get("credit_card")
    role = data.get("role")

    for user in users_db:
        if users_db[user]["email"] == email:
            return jsonify({"error": "Email already exists"}), 400

    hashed_password = generate_password_hash(password)
    user_id = users_db.save({
        "username": username,
        "email": email,
        "password": hashed_password,
        "phone": phone,
        "aadhar": aadhar,
        "credit_card": credit_card,
        "role": role
    })

    return jsonify({"message": "User created successfully", "user_id": user_id}), 201

@app.route("/login", methods=["POST","GET"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    # Find user by username
    user = None
    for user_id in users_db:
        if users_db[user_id]["username"] == username:
            user = users_db[user_id]
            break

    # Validate user and password
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    session["user_id"] = user_id
    session["username"] = user["username"]
    session["email"] = user["email"]
    session["role"] = user["role"]
    session.modified = True
    
    return jsonify({
        "message": "Login successful",
        "user_id": user_id,
        "role": user["role"]
    }), 200


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200


import uuid


@app.route("/lawyer/<user_id>", methods=["GET", "POST"])
def lawyer_dashboard(user_id):
    if str(session.get("user_id")) != str(user_id):
        return jsonify({"error": "Unauthorized"}), 401
    print("Session Data:", session)

    user = users_db.get(user_id, {})  
    lawyer_cases = [doc for doc in cases_db if doc.get("user_id") == user_id]

    for case1 in lawyer_cases:
        case1["_id"] = str(case1["_id"])  # Ensure `_id` is a string for JSON

    if request.method == "GET":
        return jsonify({"userId": user_id, "cases": lawyer_cases})  # ✅ Return JSON for frontend

    if request.method == "POST":
        data = request.json()  # 🔥 Use request.json for React compatibility
        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400

        title = data.get("title")
        content = data.get("content")
        case_type = data.get("case_type")
        party1_uid = data.get("party1_uid")
        party2_uid = data.get("party2_uid")
        date_of_filing = data.get("date_of_filing")
        updated_on = data.get("updated_on")

        cid = None
        if "file" in request.files:
            file = request.files["file"]
            if allowed_file(file.filename):
                if not os.path.exists(app.config["UPLOAD_FOLDER"]): 
                    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
                file.save(filepath)

                cid = pin_file_to_ipfs(filepath)  
                if not cid:
                    print(f"Failed to upload {filename} to Pinata")

        new_doc = {
            "_id": str(uuid.uuid4()),  # Generate a unique ID
            "title": title,
            "content": content,
            "case_type": case_type,
            "party1_uid": party1_uid,
            "party2_uid": party2_uid,
            "date_of_filing": date_of_filing,
            "updated_on": updated_on,
            "user_id": user_id,
            "file": cid,
            "status": ["filed"]
        }

        cases_db.save(new_doc)  # ✅ Save to CouchDB

        return jsonify({"message": "Case added successfully", "cases": new_doc})  #



@app.route("/registrar/<user_id>/cases", methods=["GET"])
def registrar_cases(user_id):
    if "user_id" not in session or session["user_id"] != user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Fetch cases assigned to the registrar
    user = users_db.get(user_id, {})
    assigned_cases = [cases_db[case_id] for case_id in user.get("cases", [])]
    return jsonify(assigned_cases), 200

@app.route("/cases/<case_id>", methods=["GET"])
def get_case(case_id):
    case = cases_db.get(case_id)
    if not case:
        return jsonify({"error": "Case not found"}), 404
    return jsonify(case), 200

@app.route("/cases/<case_id>/send-to-registrar", methods=["POST"])
def send_to_registrar(case_id):
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    case = cases_db.get(case_id)
    if not case:
        return jsonify({"error": "Case not found"}), 404

    registrars = [users_db[uid] for uid in users_db if users_db[uid].get("role") == "registrar"]
    if not registrars:
        return jsonify({"error": "No registrars available"}), 500

    selected_registrar = min(registrars, key=lambda r: len(r.get("cases", [])))
    if "cases" not in selected_registrar:
        selected_registrar["cases"] = []

    selected_registrar["cases"].append(case_id)
    users_db.save(selected_registrar)
    case["status"] = "Sent to Registrar"
    case["assigned_registrar"] = selected_registrar["_id"]
    cases_db.save(case)

    return jsonify({"message": "Case sent to registrar successfully"}), 200

# Helper function to upload files to IPFS
def pin_file_to_ipfs(file_path):
    try:
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {"Authorization": f"Bearer {JWT}"}
        with open(file_path, "rb") as file:
            files = {"file": (os.path.basename(file_path), file)}
            response = requests.post(url, headers=headers, files=files)
        return response.json().get("IpfsHash")
    except Exception as e:
        print("Error:", e)
        return None

if __name__ == "__main__":
    
    app.run(debug=True, port=8000)