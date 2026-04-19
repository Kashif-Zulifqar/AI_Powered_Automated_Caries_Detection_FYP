"""
DentalAI — Authentication Routes
=================================
Handles user registration (OTP email verification), login,
password reset (forgot-password flow), and user profile retrieval.
"""

from flask import Blueprint, request, jsonify, g
from db import users, scans
from utils import (
    hash_password, check_password,
    generate_otp, hash_otp, check_otp,
    now_utc, plus_minutes,
    make_reset_token, read_reset_token,
    make_jwt, verify_jwt,
)
from middleware import login_required
from emailer import send_email, get_last_error
import os
import logging

auth = Blueprint("auth", __name__, url_prefix="/auth")
log = logging.getLogger("dentalai.auth")

DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"
if DEV_MODE:
    log.warning("DEV_MODE is ON — OTPs will be included in API responses")


# ─── Email templates ─────────────────────────────────────────────────────────

def _otp_email_html(name: str, otp: str, purpose: str = "verification") -> str:
    """Generate a branded HTML email body for OTP delivery."""
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px;
                margin: 0 auto; padding: 32px; background: #ffffff;
                border-radius: 12px; border: 1px solid #e5e7eb;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px;">🦷</span>
        <h2 style="margin: 8px 0 0; color: #1e40af; font-size: 22px;">DentalAI</h2>
      </div>
      <p style="color: #374151; font-size: 15px;">Hello <strong>{name}</strong>,</p>
      <p style="color: #374151; font-size: 15px;">Your {purpose} code is:</p>
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background: #eff6ff; border: 2px solid #bfdbfe;
                    border-radius: 10px; padding: 16px 32px; font-size: 32px;
                    font-weight: 800; letter-spacing: 8px; color: #1d4ed8;">
          {otp}
        </div>
      </div>
      <p style="color: #6b7280; font-size: 13px; text-align: center;">
        This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #9ca3af; font-size: 11px; text-align: center;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    """


# ─── 1. Register: Step 1 — Send OTP ─────────────────────────────────────────

@auth.post("/register-start")
def register_start():
    data  = request.get_json(force=True, silent=True) or {}
    name  = (data.get("name") or "").strip()
    email = (data.get("email") or "").lower().strip()

    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400

    # Block duplicate verified accounts
    existing = users.find_one({"email": email})
    if existing and existing.get("emailVerified"):
        return jsonify({"error": "Email already registered"}), 400

    # Generate and store OTP
    otp      = generate_otp(6)
    otp_hash = hash_otp(otp)
    expires  = plus_minutes(10)

    users.update_one(
        {"email": email},
        {"$set": {
            "name": name,
            "email": email,
            "emailVerified": False,
            "otpHash": otp_hash,
            "otpExpires": expires,
        }},
        upsert=True,
    )

    # Attempt to send OTP email
    html = _otp_email_html(name, otp, "verification")
    email_sent = False
    try:
        email_sent = send_email(email, "Your DentalAI Verification Code", html)
    except Exception as exc:
        log.exception(f"Email send error for {email}: {exc}")

    # Build response
    if email_sent:
        resp = {"message": "OTP sent to your email", "emailSent": True}
    elif DEV_MODE:
        resp = {"message": "OTP generated (dev mode)", "emailSent": False}
    else:
        return jsonify({
            "error": "Failed to send verification email. Please try again.",
            "detail": get_last_error(),
        }), 500

    # Dev mode: include OTP in response for local testing
    if DEV_MODE:
        resp["dev"] = True
        resp["otp"] = otp
        log.info(f"[DEV] Registration OTP for {email}: {otp}")

    return jsonify(resp), 200


# ─── 2. Register: Step 2 — Verify OTP + Set Password ────────────────────────

@auth.post("/register-complete")
def register_complete():
    data     = request.get_json(force=True, silent=True) or {}
    email    = (data.get("email") or "").lower().strip()
    otp      = (data.get("otp") or "").strip()
    password = data.get("password") or ""
    confirm  = data.get("confirmPassword") or ""

    if not email or not otp or not password:
        return jsonify({"error": "Email, OTP, and password are required"}), 400
    if password != confirm:
        return jsonify({"error": "Passwords do not match"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found — please sign up first"}), 404
    if user.get("emailVerified"):
        return jsonify({"error": "Email already verified"}), 400
    if not user.get("otpHash") or not user.get("otpExpires"):
        return jsonify({"error": "No OTP pending — request a new one"}), 400
    if now_utc() > user["otpExpires"]:
        return jsonify({"error": "OTP expired — request a new one"}), 400
    if not check_otp(otp, user["otpHash"]):
        return jsonify({"error": "Invalid OTP"}), 400

    users.update_one(
        {"email": email},
        {
            "$set":   {"password": hash_password(password), "emailVerified": True},
            "$unset": {"otpHash": "", "otpExpires": ""},
        },
    )
    return jsonify({"message": "Account created successfully"}), 201


# ─── 3. Login ────────────────────────────────────────────────────────────────

@auth.post("/login")
def login():
    data     = request.get_json(force=True, silent=True) or {}
    email    = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401
    if not user.get("emailVerified", False):
        return jsonify({"error": "Please verify your email before logging in"}), 403
    if not check_password(password, user.get("password", "")):
        return jsonify({"error": "Invalid email or password"}), 401

    token = make_jwt(email, user["name"])
    return jsonify({
        "message": "Login successful",
        "token": token,
        "name": user["name"],
        "email": email,
        "patientId": user.get("patientId"),
    }), 200


# ─── 4. Current User ────────────────────────────────────────────────────────

@auth.get("/me")
@login_required
def get_user():
    """Return the current authenticated user's profile."""
    return jsonify(g.current_user), 200


# ─── Profile Update ──────────────────────────────────────────────────────────

@auth.put("/profile")
@login_required
def update_profile():
    """Update the authenticated user's profile fields."""
    data = request.get_json(force=True, silent=True) or {}
    email = g.current_user["email"]

    # Only allow safe fields to be updated
    allowed_fields = {"name", "age", "gender"}
    updates = {}
    for key in allowed_fields:
        if key in data and data[key] is not None:
            updates[key] = data[key]

    if not updates:
        return jsonify({"error": "No valid fields to update"}), 400

    users.update_one({"email": email}, {"$set": updates})

    # Return updated user
    user = users.find_one(
        {"email": email},
        {"password": 0, "otpHash": 0, "otpExpires": 0},
    )
    user["_id"] = str(user["_id"])
    return jsonify({"message": "Profile updated", "user": user}), 200


# ─── Change Password ─────────────────────────────────────────────────────────

@auth.post("/change-password")
@login_required
def change_password():
    """Change password for the authenticated user (requires current password)."""
    data = request.get_json(force=True, silent=True) or {}
    current_pw = data.get("currentPassword") or ""
    new_pw     = data.get("newPassword") or ""
    confirm_pw = data.get("confirmPassword") or ""

    if not current_pw or not new_pw:
        return jsonify({"error": "Current and new passwords are required"}), 400
    if new_pw != confirm_pw:
        return jsonify({"error": "New passwords do not match"}), 400
    if len(new_pw) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    user = users.find_one({"email": g.current_user["email"]})
    if not check_password(current_pw, user.get("password", "")):
        return jsonify({"error": "Current password is incorrect"}), 400

    users.update_one(
        {"email": g.current_user["email"]},
        {"$set": {"password": hash_password(new_pw)}},
    )
    return jsonify({"message": "Password changed successfully"}), 200


# ─── Delete Account ──────────────────────────────────────────────────────────

@auth.delete("/delete-account")
@login_required
def delete_account():
    """Permanently delete the authenticated user's account and all their data."""
    email = g.current_user["email"]

    # Delete all user scans/reports
    scans.delete_many({"user_email": email})
    # Delete the user record
    users.delete_one({"email": email})

    log.info(f"Account deleted: {email}")
    return jsonify({"message": "Account deleted successfully"}), 200


# ─── 5. Forgot Password: Step 1 — Send OTP ──────────────────────────────────

@auth.post("/forgot-start")
def forgot_start():
    data  = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").lower().strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = users.find_one({"email": email})
    if not user or not user.get("emailVerified"):
        return jsonify({"error": "No verified account found for this email"}), 404

    otp      = generate_otp(6)
    otp_hash = hash_otp(otp)
    expires  = plus_minutes(10)

    users.update_one(
        {"email": email},
        {"$set": {"otpHash": otp_hash, "otpExpires": expires}},
    )

    html = _otp_email_html(user["name"], otp, "password reset")
    email_sent = False
    try:
        email_sent = send_email(email, "DentalAI Password Reset Code", html)
    except Exception as exc:
        log.exception(f"Email send error for {email}: {exc}")

    if email_sent:
        resp = {"message": "OTP sent to your email", "emailSent": True}
    elif DEV_MODE:
        resp = {"message": "OTP generated (dev mode)", "emailSent": False}
    else:
        return jsonify({
            "error": "Failed to send reset email. Please try again.",
            "detail": get_last_error(),
        }), 500

    if DEV_MODE:
        resp["dev"] = True
        resp["otp"] = otp
        log.info(f"[DEV] Forgot-password OTP for {email}: {otp}")

    return jsonify(resp), 200


# ─── 6. Forgot Password: Step 2 — Verify OTP ────────────────────────────────

@auth.post("/forgot-verify-otp")
def forgot_verify_otp():
    data  = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    otp   = (data.get("otp") or "").strip()

    if not email or not otp:
        return jsonify({"error": "Email and OTP are required"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404
    if not user.get("otpHash") or not user.get("otpExpires"):
        return jsonify({"error": "No OTP request found"}), 400
    if now_utc() > user["otpExpires"]:
        return jsonify({"error": "OTP expired"}), 400
    if not check_otp(otp, user["otpHash"]):
        return jsonify({"error": "Invalid OTP"}), 400

    return jsonify({"message": "OTP verified successfully"}), 200


# ─── 7. Forgot Password: Step 3 — Reset Password ────────────────────────────

@auth.post("/forgot-reset")
def forgot_reset():
    data     = request.get_json(force=True, silent=True) or {}
    email    = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    confirm  = data.get("confirmPassword") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if password != confirm:
        return jsonify({"error": "Passwords do not match"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    users.update_one(
        {"email": email},
        {"$set": {"password": hash_password(password)},
         "$unset": {"otpHash": "", "otpExpires": ""}},
    )
    return jsonify({"message": "Password updated successfully"}), 200


# ─── 8. Test Email (diagnostic) ─────────────────────────────────────────────

@auth.post("/test-email")
def test_email():
    """Send a test email — useful for verifying your email configuration."""
    data     = request.get_json(force=True, silent=True) or {}
    to_email = (data.get("email") or "").strip()

    if not to_email:
        return jsonify({"error": "Email is required"}), 400

    try:
        sent = send_email(
            to_email,
            "DentalAI — Test Email",
            "<h2>Email Works!</h2><p>Your DentalAI email configuration is correct.</p>",
        )
    except Exception as e:
        return jsonify({"error": f"Exception: {e}"}), 500

    if sent:
        return jsonify({"message": f"Test email sent to {to_email}"}), 200
    return jsonify({
        "error": "Email delivery failed",
        "detail": get_last_error(),
    }), 500