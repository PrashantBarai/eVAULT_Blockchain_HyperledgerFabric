from flask import Flask, request, render_template, redirect, url_for, session
import couchdb
import os
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from urllib.parse import quote
from werkzeug.utils import secure_filename
import requests

load_dotenv()

app = Flask(__name__)
app.secret_key = "your_secret_key"

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

server = couchdb.Server(COUCHDB_URL)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

try:
    users_db = server.create("users")
except couchdb.http.PreconditionFailed:
    users_db = server["users"]

try:
    cases_db = server.create("cases")
except couchdb.http.PreconditionFailed:
    cases_db = server["cases"]

    
    
@app.route("/")
def index():
    return render_template("index.html")



@app.route("/signup", methods=["GET", "POST"])
def signup_page():
    if request.method == "POST":
        username = request.form.get("username")
        email = request.form.get("email")
        password = request.form.get("password")
        phone = request.form.get("phone")
        aadhar = request.form.get("aadhar")
        credit_card = request.form.get("credit_card")
        role = request.form.get("role")
        for user in users_db:
            if users_db[user]["email"] == email:
                return redirect(url_for("signup_page"))
        hashed_password = generate_password_hash(password)
        users_db.save({
            "username": username,
            "email": email,
            "password": hashed_password,
            "phone": phone,
            "aadhar": aadhar,
            "credit_card": credit_card,
            "role": role
        })
        return redirect(url_for("login"))
    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        user = None
        for user_id in users_db:
            if users_db[user_id]["username"] == username:
                user = users_db[user_id]
                break
        if not user or not check_password_hash(user["password"], password):
            return redirect(url_for("login"))
        session["user_id"] = user_id
        session["username"] = user["username"]
        session["email"] = user["email"]
        session["role"] = user["role"]
        if user["role"] == "lawyer":
            return redirect(url_for("lawyer_dashboard", user_id=session["user_id"]))
        elif user["role"] == "judge":
            return redirect(url_for("judge_dashboard", user_id=session["user_id"]))
        elif user["role"] == "registrar":
            return redirect(url_for("registrar_dashboard", user_id=session["user_id"]))
        return redirect(url_for("index"))
    return render_template("login.html")


@app.route("/posts/<post_id>")
def view_case(post_id):
    case = cases_db.get(post_id)
    if not case:
        return "Case not found", 404
    return render_template("case_details.html", case=case)




@app.route("/lawyer/<user_id>", methods=["GET", "POST"])
def lawyer_dashboard(user_id):
    if "user_id" not in session or session["user_id"] != user_id:
        return redirect(url_for("login"))

    user = users_db.get(user_id, {})
    lawyer_cases = [{**cases_db[case_id], "_id": case_id} for case_id in cases_db if cases_db[case_id].get("user_id") == user_id]

    if request.method == "POST":
        title = request.form.get("title")
        content = request.form.get("content")
        case_type = request.form.get("case_type")
        file = request.files.get("file")  
        print(file)
        # cids = []
        # for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(filepath)
            print(f"File saved to {filepath}")
            cid = pin_file_to_ipfs(filepath)  # Pass the full path
            if cid:
                # cids.append(cid)
                print(f"File {filename} uploaded to Pinata with CID: {cid}")
                new_doc = {"title": title, "content": content, "case_type": case_type, "user_id": user_id, "file": cid}
                cases_db.save(new_doc)
            else:
                print(f"Failed to upload {filename} to Pinata")        
        return redirect(url_for("lawyer_dashboard", user_id=user_id))
    return render_template("lawyer_dashboard.html", user=user, cases=lawyer_cases)



@app.route("/registrar/<user_id>", methods=["GET"])
def registrar_dashboard(user_id):
    if "user_id" not in session or session["user_id"] != user_id:
        return redirect(url_for("login"))
    user = users_db.get(user_id, {})
    assigned_cases = [cases_db[case_id] for case_id in user.get("cases", [])]
    return render_template("registrar_dashboard.html", user=user, assigned_cases=assigned_cases)




@app.route('/send-to-registrar/<case_id>', methods=['POST'])
def send_to_registrar(case_id):
    case = cases_db.get(case_id)
    if not case:
        return "Case not found", 404
    registrars = [
        users_db[uid] for uid in users_db
        if users_db[uid].get("role") == "registrar"
    ]

    if not registrars:
        return "No registrars available", 500

    selected_registrar = min(registrars, key=lambda r: len(r.get("cases", [])))

    if "cases" not in selected_registrar:
        selected_registrar["cases"] = []

    selected_registrar["cases"].append(case_id)  # Save only case ID
    users_db.save(selected_registrar)  
    case["status"] = "Sent to Registrar"
    case["assigned_registrar"] = selected_registrar["_id"]
    cases_db.save(case)  

    return redirect(url_for('lawyer_dashboard', user_id=session["user_id"]))




def pin_file_to_ipfs(file_path):
    try:
        url = "https://api.pinata.cloud/pinning/pinFileToIPFS"
        headers = {
            "Authorization": f"Bearer {JWT}",
        }
        absolute_path = os.path.abspath(file_path) 
        with open(absolute_path, "rb") as file: 
            files = {"file": (os.path.basename(file_path), file)}
            response = requests.post(url, headers=headers, files=files)
        response_data = response.json()
        print(response_data)
        return response_data.get("IpfsHash")  
    except Exception as e:
        print("Error:", e)
        return None

    

    
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

if __name__ == "__main__":
    app.run(debug=True, port=8000)
