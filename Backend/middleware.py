"""
DentalAI — Authentication Middleware
=====================================
Reusable decorator to protect Flask routes with JWT authentication.
Verifies the Bearer token, looks up the user, and attaches
the user document to ``flask.g.current_user``.
"""

from functools import wraps
from flask import request, jsonify, g
from utils import verify_jwt
from db import users


def login_required(f):
    """
    Decorator that:
    1. Extracts the JWT from the ``Authorization: Bearer <token>`` header.
    2. Verifies + decodes the token.
    3. Looks up the user in MongoDB (excluding the password field).
    4. Sets ``g.current_user`` for downstream route handlers.
    5. Returns 401 JSON if anything fails.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication required"}), 401

        token = auth_header[7:]  # Strip "Bearer "
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Look up user — never include password in context
        user = users.find_one(
            {"email": payload["sub"]},
            {"password": 0, "otpHash": 0, "otpExpires": 0},
        )
        if not user:
            return jsonify({"error": "User not found"}), 401

        # Convert ObjectId to string for JSON serialization
        user["_id"] = str(user["_id"])
        g.current_user = user
        return f(*args, **kwargs)

    return decorated
