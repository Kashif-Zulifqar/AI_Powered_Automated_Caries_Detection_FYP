from app import create_app
from db import users
from utils import hash_otp, plus_minutes
import json


def run_tests():
    app = create_app()
    client = app.test_client()

    email = "tester@example.com"
    name = "Tester"

    # Prepare a pending OTP for registration (known OTP: 123456)
    otp_plain = "123456"
    users.update_one(
        {"email": email},
        {"$set": {
            "email": email,
            "name": name,
            "emailVerified": False,
            "otpHash": hash_otp(otp_plain),
            "otpExpires": plus_minutes(10)
        }},
        upsert=True
    )

    # Complete registration
    resp = client.post(
        "/auth/register-complete",
        data=json.dumps({"email": email, "otp": otp_plain, "password": "pass1234", "confirmPassword": "pass1234"}),
        content_type="application/json",
    )
    print("register-complete:", resp.status_code, resp.get_json())

    # Login
    resp = client.post(
        "/auth/login",
        data=json.dumps({"email": email, "password": "pass1234"}),
        content_type="application/json",
    )
    print("login:", resp.status_code, resp.get_json())
    token = resp.get_json().get("token")

    # Get current user
    resp = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    print("me:", resp.status_code, resp.get_json())

    # Forgot password: set a known OTP for reset flow
    reset_otp = "654321"
    users.update_one({"email": email}, {"$set": {"otpHash": hash_otp(reset_otp), "otpExpires": plus_minutes(10), "emailVerified": True}})

    # Verify OTP
    resp = client.post(
        "/auth/forgot-verify-otp",
        data=json.dumps({"email": email, "otp": reset_otp}),
        content_type="application/json",
    )
    print("forgot-verify-otp:", resp.status_code, resp.get_json())

    # Reset password
    resp = client.post(
        "/auth/forgot-reset",
        data=json.dumps({"email": email, "password": "newpass123", "confirmPassword": "newpass123"}),
        content_type="application/json",
    )
    print("forgot-reset:", resp.status_code, resp.get_json())


if __name__ == "__main__":
    run_tests()
