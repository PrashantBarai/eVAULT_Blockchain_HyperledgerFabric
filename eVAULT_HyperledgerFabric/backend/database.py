from pymongo import MongoClient

# Database connection
client = MongoClient('mongodb://localhost:27017/')
db = client['evault']

# Collections
users_collection = db["users"]
case_collection = db["cases"]
