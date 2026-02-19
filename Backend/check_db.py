"""Simple DB connectivity check script.

Run this after you set `MONGO_URI` in .env to verify the app can reach
your MongoDB Atlas instance.
"""
from db import client, db


def main():
    try:
        # ping already performed during import in db.py; this ensures client exists
        print("Connected to MongoDB database:", db.name)
    except Exception as e:
        print("DB check failed:", e)


if __name__ == "__main__":
    main()
