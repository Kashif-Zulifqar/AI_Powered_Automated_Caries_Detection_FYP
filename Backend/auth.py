from flask import Blueprint, request, jsonify
from db import users
from utils import (
    hash_password, check_password,
    generate_otp, hash_otp, check_otp,
    now_utc, plus_minutes,
    make_reset_token, read_reset_token
)
from emailer import send_email
import os

auth = Blueprint("auth", __name__, url_prefix="/auth")

# -----------------------------------------------------
# 1️⃣ Register Start - name + email -> send OTP
# -----------------------------------------------------

@auth.post("/register-start")
def register_start():
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").lower().strip()

    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400

    existing = users.find_one({"email": email})
    if existing and existing.get("emailVerified"):
        return jsonify({"error": "Email already registered"}), 400

    otp = generate_otp(6)
    otp_hash = hash_otp(otp)
    expires = plus_minutes(10)

    users.update_one(
        {"email": email},
        {"$set": {
            "name": name,
            "email": email,
            "emailVerified": False,
            "otpHash": otp_hash,
            "otpExpires": expires
        }},
        upsert=True
    )

    html = f"""
    <div style='font-family:Arial,sans-serif'>
      <h2>IADS Email Verification</h2>
      <p>Hello {name},</p>
      <p>Your One-Time Password (OTP) is:</p>
      <div style='font-size:28px;font-weight:bold;letter-spacing:2px;'>{otp}</div>
      <p>This code will expire in 10 minutes.</p>
    </div>
    """

    # Try to send the email; `send_email` returns True on success, False otherwise
    try:
        sent = send_email(email, "Your IADS verification code", html)
    except Exception as e:
        # If send_email raises, return error (likely unexpected)
        return jsonify({"error": f"Failed to send OTP email: {e}"}), 500

    # Auto-enable dev-mode if SMTP credentials are missing so we don't fail
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    auto_dev = not smtp_user or not smtp_pass
    dev_mode = os.getenv("DEV_MODE", "false").lower() == "true" or auto_dev

    # If send failed but SMTP creds are missing, treat it as dev and print/return OTP
    if not sent and not auto_dev and not dev_mode:
        return jsonify({"error": "Failed to send OTP email (SMTP not configured)"}), 500

    # In dev mode print and (optionally) include OTP in response for easy testing
    try:
        if dev_mode:
            print(f"DEV REGISTER OTP for {email}: {otp}")
    except Exception:
        pass

    resp = {"message": "OTP sent to your email"}
    if dev_mode:
        resp["dev"] = True
        resp["otp"] = otp
    return jsonify(resp), 200


# -----------------------------------------------------
# 2️⃣ Complete Registration - OTP + Password
# -----------------------------------------------------
@auth.post("/register-complete")
def register_complete():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    otp = (data.get("otp") or "").strip()
    password = data.get("password") or ""
    confirm = data.get("confirmPassword") or ""

    if not email or not otp or not password:
        return jsonify({"error": "Email, OTP, and password are required"}), 400
    if password != confirm:
        return jsonify({"error": "Passwords do not match"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.get("emailVerified"):
        return jsonify({"error": "Email already verified"}), 400
    if not user.get("otpHash") or not user.get("otpExpires"):
        return jsonify({"error": "No OTP pending"}), 400
    if now_utc() > user["otpExpires"]:
        return jsonify({"error": "OTP expired"}), 400
    if not check_otp(otp, user["otpHash"]):
        return jsonify({"error": "Invalid OTP"}), 400

    users.update_one(
        {"email": email},
        {"$set": {
            "password": hash_password(password),
            "emailVerified": True
        }, "$unset": {
            "otpHash": "",
            "otpExpires": ""
        }}
    )
    return jsonify({"message": "Account created successfully"}), 201


# -----------------------------------------------------
# 3️⃣ Login - for verified accounts only
# -----------------------------------------------------
@auth.post("/login")
def login():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.get("emailVerified", False):
        return jsonify({"error": "Please verify your email before logging in"}), 403

    if not check_password(password, user.get("password", "")):
        return jsonify({"error": "Invalid email or password"}), 401

    token = make_reset_token(email)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "name": user["name"]
    }), 200


# -----------------------------------------------------
# 4️⃣ Get Current User Info
# -----------------------------------------------------
@auth.get("/me")
def get_user():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    email = read_reset_token(token)
    if not email:
        return jsonify({"error": "Invalid or expired token"}), 401

    user = users.find_one({"email": email}, {"_id": 0, "password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user), 200


# -----------------------------------------------------
# 5️⃣ Forgot Password: Step 1 — Send OTP
# -----------------------------------------------------
@auth.post("/forgot-start")
def forgot_start():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").lower().strip()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = users.find_one({"email": email})
    if not user or not user.get("emailVerified"):
        return jsonify({"error": "No verified account found for this email"}), 404

    otp = generate_otp(6)
    otp_hash = hash_otp(otp)
    expires = plus_minutes(10)

    users.update_one(
        {"email": email},
        {"$set": {"otpHash": otp_hash, "otpExpires": expires}}
    )

    html = f"""
    <div style='font-family:Arial,sans-serif'>
      <h2>IADS Password Reset</h2>
      <p>Hello {user['name']},</p>
      <p>Your One-Time Password (OTP) for resetting your password is:</p>
      <div style='font-size:28px;font-weight:bold;letter-spacing:2px;'>{otp}</div>
      <p>This OTP will expire in 10 minutes.</p>
    </div>
    """

    try:
        sent = send_email(email, "IADS Password Reset OTP", html)
    except Exception as e:
        print(f"Email send failed: {e}")
        return jsonify({"error": f"Failed to send OTP: {e}"}), 500

    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    auto_dev = not smtp_user or not smtp_pass
    dev_mode = os.getenv("DEV_MODE", "false").lower() == "true" or auto_dev

    if not sent and not auto_dev and not dev_mode:
        return jsonify({"error": "Failed to send OTP email (SMTP not configured)"}), 500

    try:
        if dev_mode:
            print(f"DEV FORGOT OTP for {email}: {otp}")
    except Exception:
        pass

    resp = {"message": "OTP sent to your email"}
    if dev_mode:
        resp["dev"] = True
        resp["otp"] = otp
    return jsonify(resp), 200


# -----------------------------------------------------
# 6️⃣ Forgot Password: Step 2 — Verify OTP
# -----------------------------------------------------
@auth.post("/forgot-verify-otp")
def forgot_verify_otp():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    otp = (data.get("otp") or "").strip()

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


# -----------------------------------------------------
# 7️⃣ Forgot Password: Step 3 — Reset Password
# -----------------------------------------------------
@auth.post("/forgot-reset")
def forgot_reset():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirmPassword") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    users.update_one(
        {"email": email},
        {"$set": {"password": hash_password(password)},
         "$unset": {"otpHash": "", "otpExpires": ""}}
    )

    return jsonify({"message": "Password updated successfully"}), 200


# -----------------------------------------------------
# Test email endpoint (useful to validate SMTP config)
# -----------------------------------------------------
@auth.post("/test-email")
def test_email():
    data = request.get_json(force=True, silent=True) or {}
    to_email = (data.get("email") or "").strip()
    subject = data.get("subject") or "IADS Test Email"
    body = data.get("html") or "<p>This is a test email from IADS backend.</p>"

    if not to_email:
        return jsonify({"error": "Email is required"}), 400

    try:
        sent = send_email(to_email, subject, body)
    except Exception as e:
        return jsonify({"error": f"Exception while sending email: {e}"}), 500

    if sent:
        return jsonify({"message": "Test email sent"}), 200
    else:
        # Give actionable guidance when send_email returned False
        return jsonify({
            "error": "SMTP appears unconfigured or send failed. Set SMTP_USER and SMTP_PASS in your environment or enable DEV_MODE for local testing.",
            "dev": (os.getenv("DEV_MODE", "false").lower() == "true")
        }), 500