import os
import bcrypt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from dotenv import load_dotenv
import os, secrets, string, datetime as dt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import bcrypt

SECRET_KEY = os.getenv("SECRET_KEY", "devsecret")
ts = URLSafeTimedSerializer(SECRET_KEY)

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def check_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())

def make_reset_token(email: str) -> str:
    return ts.dumps(email)

def read_reset_token(token: str, max_age_seconds: int = 3600) -> str | None:
    try:
        return ts.loads(token, max_age=max_age_seconds)
    except (BadSignature, SignatureExpired):
        return None

def generate_otp(n: int = 6) -> str:
    # numeric OTP like "483920"
    return "".join(secrets.choice(string.digits) for _ in range(n))

def hash_otp(otp: str) -> str:
    return bcrypt.hashpw(otp.encode(), bcrypt.gensalt()).decode()

def check_otp(otp: str, hashed: str) -> bool:
    return bcrypt.checkpw(otp.encode(), hashed.encode())

def now_utc():
    return dt.datetime.utcnow()

def plus_minutes(m: int):
    return now_utc() + dt.timedelta(minutes=m)


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
serializer = URLSafeTimedSerializer(SECRET_KEY)

# Store as UTF-8 strings in Mongo to avoid BSON Binary issues
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def check_password(plain: str, hashed_str: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed_str.encode("utf-8"))
    except Exception:
        return False

# Password-reset token helpers (signed, time-limited)
def make_reset_token(email: str) -> str:
    return serializer.dumps(email, salt="pw-reset")

def read_reset_token(token: str, max_age_seconds: int = 3600) -> str | None:
    try:
        return serializer.loads(token, salt="pw-reset", max_age=max_age_seconds)
    except (BadSignature, SignatureExpired):
        return None

# (Optional) You can wire actual email via SMTP later.
# For now we just return/print links from the API response.