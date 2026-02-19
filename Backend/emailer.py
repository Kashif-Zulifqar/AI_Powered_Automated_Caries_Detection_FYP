import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr, parseaddr
import os
from dotenv import load_dotenv

# Load environment variables from .env early
load_dotenv()

# Read SMTP settings (defaults tuned for Brevo SMTP relay)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "IADS Support <no-reply@iads.local>")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "IADS Support")

masked_user = (SMTP_USER or "").split("@", 1)[0] if SMTP_USER else "(none)"
masked_pass = (SMTP_PASS[:4] + "********") if SMTP_PASS else "(none)"
print("SMTP configuration loaded:", masked_user, "@", SMTP_HOST, ":", SMTP_PORT)
print("SMTP_PASS mask:", masked_pass)


def _format_from(from_value: str) -> str:
    """Return a properly formatted From header using parseaddr/formataddr."""
    name, addr = parseaddr(from_value)
    if not addr:
        # Fall back to SMTP_USER if parse fails
        addr = SMTP_USER or "no-reply@iads.local"
    if not name:
        name = SMTP_FROM_NAME or "IADS Support"
    return formataddr((name, addr))


def send_email(to_email: str, subject: str, html: str):
    """Send an HTML email using the configured SMTP server.

    Expects `SMTP_USER` and `SMTP_PASS` to be set in the environment.
    Works with Brevo's `smtp-relay.brevo.com` (port 587) when credentials are provided.
    """
    msg = MIMEText(html, "html")
    msg["From"] = _format_from(SMTP_FROM)
    msg["To"] = to_email
    msg["Subject"] = subject

    # If credentials are missing, don't crash — return False so callers can
    # decide how to proceed (useful for local development / tests).
    if not SMTP_USER or not SMTP_PASS:
        print("send_email: SMTP credentials missing — skipping send (dev fallback)")
        return False

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
            print(f"Email successfully sent to {to_email}")
            return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"SMTP authentication error: {e}")
        return False
    except Exception as e:
        print(f"Email sending failed: {e}")
        return False