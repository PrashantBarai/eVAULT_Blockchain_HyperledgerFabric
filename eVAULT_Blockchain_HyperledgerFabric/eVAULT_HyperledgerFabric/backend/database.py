from pymongo import MongoClient

# Database connection
client = MongoClient("mongodb+srv://ammar:F10zIHigRBhYxtrm@cluster0.o2qwc.mongodb.net/")
db = client['evault']

users_collection = db["users"]
case_collection = db["cases"]
lawyer_notification = db["lawyer_notifications"]
benchclerk_notification = db["benchclerk_notifications"]
