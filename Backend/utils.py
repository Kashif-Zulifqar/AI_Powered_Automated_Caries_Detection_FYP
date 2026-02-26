import os
import secrets
import string
import datetime as dt
from dotenv import load_dotenv
import bcrypt
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

load_dotenv(override=True)

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
serializer = URLSafeTimedSerializer(SECRET_KEY)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(plain: str, hashed_str: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed_str.encode("utf-8"))
    except Exception:
        return False


def make_reset_token(email: str) -> str:
    return serializer.dumps(email, salt="pw-reset")


def read_reset_token(token: str, max_age_seconds: int = 3600) -> str | None:
    try:
        return serializer.loads(token, salt="pw-reset", max_age=max_age_seconds)
    except (BadSignature, SignatureExpired):
        return None


def generate_otp(n: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(n))


def hash_otp(otp: str) -> str:
    return bcrypt.hashpw(otp.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_otp(otp: str, hashed_str: str) -> bool:
    try:
        return bcrypt.checkpw(otp.encode("utf-8"), hashed_str.encode("utf-8"))
    except Exception:
        return False


def now_utc() -> dt.datetime:
    return dt.datetime.utcnow()


def plus_minutes(m: int) -> dt.datetime:
    return now_utc() + dt.timedelta(minutes=m)