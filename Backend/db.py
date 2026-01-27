import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI missing in .env")

client = MongoClient(MONGO_URI)
db = client.get_database()  # uses the DB in URI (iads)
users = db["users"]         # collection for user accounts