import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
import os
from dotenv import load_dotenv

print("✅ Loaded SMTP_USER:", os.getenv("SMTP_USER"))
print("✅ Loaded SMTP_PASS:", os.getenv("SMTP_PASS")[:4] + "********")


# ✅ Load environment variables from .env
load_dotenv()

# ✅ Read SMTP settings
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "IADS Support <no-reply@iads.local>")

def send_email(to_email: str, subject: str, html: str):
    """
    Sends an HTML email via Gmail SMTP using credentials in .env
    """
    if not SMTP_USER or not SMTP_PASS:
        raise Exception("❌ Missing SMTP_USER or SMTP_PASS in .env")

    msg = MIMEText(html, "html")

    # Properly format 'From' header
    name, addr = (SMTP_FROM.split(" ", 1) + [""])[:2]
    msg["From"] = formataddr((name.replace("<", "").replace(">", ""), addr.strip("<>") or SMTP_FROM))
    msg["To"] = to_email
    msg["Subject"] = subject

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
            print(f"✅ Email successfully sent to {to_email}")
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ Authentication error: {e}")
        raise Exception("Gmail rejected login — check App Password or allow access.")
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        raise