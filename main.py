from flask import Flask, request, render_template, redirect, url_for, session, flash
import pymongo
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId

app = Flask(__name__)
app.secret_key = "your_secret_key"  

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["evault"]
users_collection = db["users"]
cases_collection = db["cases"]

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

        if not all([username, email, password, phone, aadhar, credit_card, role]):
            print("All fields are required!")
            return redirect(url_for("signup_page"))

        if users_collection.find_one({"email": email}):
            print("Email already exists!")
            return redirect(url_for("signup_page"))

        hashed_password = generate_password_hash(password)

        users_collection.insert_one({
            "username": username,
            "email": email,
            "password": hashed_password,
            "phone": phone,
            "aadhar": aadhar,
            "credit_card": credit_card,
            "role": role
        })

        print("Account created successfully! You can now log in.")
        return redirect(url_for("login"))

    return render_template("signup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            flash("Email and password are required!", "error")
            return redirect(url_for("login"))

        user = users_collection.find_one({"username": username})

        if not user or not check_password_hash(user["password"], password):
            flash("Invalid email or password!", "error")
            return redirect(url_for("login"))

        session["user_id"] = str(user["_id"])
        session["username"] = user["username"]
        session["email"] = user["email"]
        session["role"] = user["role"]

        print("Login successful")

        if user["role"] == "lawyer":
            return redirect(url_for("lawyer_dashboard", user_id=session["user_id"]))
        elif user["role"] == "judge":
            return redirect(url_for("judge_dashboard", user_id=session["user_id"]))
        elif user["role"] == "registrar":
            return redirect(url_for("registrar_dashboard", user_id=session["user_id"]))
        return redirect(url_for("index"))
    return render_template("login.html")


@app.route("/lawyer/<user_id>", methods=["GET", "POST"])
def lawyer_dashboard(user_id):
    if "user_id" not in session or str(session["user_id"]) != user_id:
        flash("Unauthorized access!", "error")
        return redirect(url_for("login"))
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    cases = list(cases_collection.find({"lawyer_id": session["user_id"]}))
    if request.method == "POST":
        title = request.form.get("title")
        content = request.form.get("content")
        case_type = request.form.get("case_type")
        if not title or not content or not case_type:
            flash("All fields are required!", "error")
            return redirect(url_for("lawyer_dashboard", user_id=user_id))


        case_metadata = {
            "title": title,
            "content": content,
            "case_type": case_type,
            "user_id": user_id,   
        }

        cases_collection.insert_one(case_metadata)
        print("Case uploaded successfully!")

    return render_template("lawyer_dashboard.html", user=user,cases=cases)


@app.route("/judge/<user_id>")
def judge_dashboard(user_id):
    if "user_id" not in session or session["user_id"] != user_id:
        flash("Unauthorized access!", "error")
        return redirect(url_for("login"))
    user = users_collection.find_one({"_id": pymongo.ObjectId(user_id)})
    return render_template("judge_dashboard.html", user=user)


@app.route("/registrar/<user_id>")
def registrar_dashboard(user_id):
    if "user_id" not in session or session["user_id"] != user_id:
        flash("Unauthorized access!", "error")
        return redirect(url_for("login"))
    user = users_collection.find_one({"_id": pymongo.ObjectId(user_id)})
    return render_template("registrar_dashboard.html", user=user)


@app.route("/logout")
def logout():
    session.clear()
    print("Logged out successfully.")
    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(debug=True, port=8000)
