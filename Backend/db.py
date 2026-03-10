import os
from pymongo import MongoClient
from pymongo.uri_parser import parse_uri
from pymongo.errors import ServerSelectionTimeoutError
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError(
        "MONGO_URI is not set. Please add your MongoDB Atlas URI to the .env file as MONGO_URI."
    )

# Create client with a short server selection timeout so failures are fast
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)

# Determine the database name: prefer DB from URI, else use MONGO_DB or 'iads'
try:
    parsed = parse_uri(MONGO_URI)
    db_name = parsed.get("database") or os.getenv("MONGO_DB", "iads")
except Exception:
    db_name = os.getenv("MONGO_DB", "iads")

# Verify connection
try:
    client.admin.command("ping")
except ServerSelectionTimeoutError as e:
    raise RuntimeError(f"Cannot connect to MongoDB server: {e}") from e

db = client[db_name]
users = db["users"]
scans = db["scans"]