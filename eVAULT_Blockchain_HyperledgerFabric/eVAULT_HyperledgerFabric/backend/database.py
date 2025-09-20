from pymongo import MongoClient

# Database connection
client = MongoClient("mongodb+srv://ammar:IJZdajya7pTz45q9@cluster0.o2qwc.mongodb.net/")
db = client['evault-new']

users_collection = db["users"]
case_collection = db["cases"]
lawyer_notification = db["lawyer_notifications"]
benchclerk_notification = db["benchclerk_notifications"]

