import os
import smtplib
import html as html_lib
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, parseaddr, formatdate, make_msgid
from typing import Optional, Tuple

import requests
from dotenv import load_dotenv

# Load environment variables from .env early.
# override=True ensures .env values always win over stale shell env vars.
load_dotenv(override=True)

# Read SMTP settings — accept both SMTP_* (preferred) and EMAIL_* (legacy) naming
def _env(*keys, default=None):
    """Return the first non-empty value from the given env-var names."""
    for k in keys:
        v = os.getenv(k)
        if v and v.strip():
            return v.strip()
    return default

SMTP_HOST = _env("SMTP_HOST", "EMAIL_HOST", default="smtp-relay.brevo.com")
SMTP_PORT = int(_env("SMTP_PORT", "EMAIL_PORT", default="587"))
SMTP_USER = _env("SMTP_USER", "EMAIL_USER")
SMTP_PASS = _env("SMTP_PASS", "EMAIL_PASS")
SMTP_FROM = _env("SMTP_FROM", "EMAIL_FROM", default=SMTP_USER or "no-reply@iads.local")
SMTP_FROM_NAME = _env("SMTP_FROM_NAME", "EMAIL_FROM_NAME", default="DentalAI Support")

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_API_URL = os.getenv("BREVO_API_URL", "https://api.brevo.com/v3/smtp/email")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", SMTP_FROM)
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", SMTP_FROM_NAME)

_last_error: Optional[str] = None

masked_user = (SMTP_USER or "").split("@", 1)[0] if SMTP_USER else "(none)"
masked_pass = (SMTP_PASS[:4] + "********") if SMTP_PASS else "(none)"
print("SMTP configuration loaded:", masked_user, "@", SMTP_HOST, ":", SMTP_PORT)
print("SMTP_PASS mask:", masked_pass)
if BREVO_API_KEY:
    print("Brevo API fallback enabled")
else:
    print("Brevo API fallback disabled (BREVO_API_KEY not set)")


def get_last_email_error() -> Optional[str]:
    return _last_error


def _format_from(from_value: str) -> str:
    """Return a properly formatted From header using parseaddr/formataddr."""
    name, addr = parseaddr(from_value)
    if not addr:
        # Fall back to SMTP_USER if parse fails
        addr = SMTP_USER or "no-reply@iads.local"
    if not name:
        name = SMTP_FROM_NAME or "IADS Support"
    return formataddr((name, addr))


def _html_to_text(html: str) -> str:
    """Strip HTML tags to produce a plain-text fallback body."""
    text = re.sub(r"<[^>]+>", " ", html)
    text = html_lib.unescape(text)
    return re.sub(r" {2,}", " ", text).strip()


def _build_message(to_email: str, subject: str, html: str) -> MIMEMultipart:
    """Build a multipart/alternative message (text + html) with delivery headers."""
    msg = MIMEMultipart("alternative")
    msg["From"] = _format_from(SMTP_FROM)
    msg["To"] = to_email
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=False)
    msg["Message-ID"] = make_msgid(domain=(SMTP_FROM.split("@")[-1].rstrip(">").strip() or "dentalai.local"))
    msg["X-Mailer"] = "DentalAI/1.0"
    # Plain-text part first — improves spam score
    msg.attach(MIMEText(_html_to_text(html), "plain", "utf-8"))
    # HTML part second — mail clients prefer the last part
    msg.attach(MIMEText(html, "html", "utf-8"))
    return msg


def _send_via_smtp(msg: MIMEMultipart, to_email: str) -> Tuple[bool, Optional[str]]:
    if not SMTP_HOST:
        return False, "SMTP host not configured"

    if not SMTP_USER or not SMTP_PASS:
        print("send_email: SMTP credentials not provided — attempting unauthenticated send")

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.ehlo()
            try:
                server.starttls()
                server.ehlo()
            except Exception as e:
                print(f"starttls not used: {e}")

            if SMTP_USER and SMTP_PASS:
                try:
                    server.login(SMTP_USER, SMTP_PASS)
                except smtplib.SMTPAuthenticationError as e:
                    print(f"SMTP authentication error: {e}")
                    return False, f"SMTP authentication failed: {e}"
                except Exception as e:
                    print(f"SMTP login failed: {e}")
                    return False, f"SMTP login failed: {e}"

            server.send_message(msg)
            print(f"Email successfully sent to {to_email} via SMTP")
            return True, None
    except Exception as e:
        print(f"Email sending failed via SMTP: {e}")
        return False, f"SMTP delivery failed: {e}"


def _send_via_brevo_api(to_email: str, subject: str, html: str) -> Tuple[bool, Optional[str]]:
    if not BREVO_API_KEY:
        return False, "Brevo API key not configured"

    payload = {
        "sender": {
            "email": BREVO_SENDER_EMAIL,
            "name": BREVO_SENDER_NAME,
        },
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html,
    }

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    try:
        response = requests.post(
            BREVO_API_URL,
            json=payload,
            headers=headers,
            timeout=20,
        )
        response.raise_for_status()
        print(f"Email successfully sent to {to_email} via Brevo API")
        return True, None
    except requests.RequestException as exc:
        detail = None
        if exc.response is not None:
            try:
                detail = exc.response.text
            except Exception:
                detail = repr(exc)
        print(f"Brevo API send failed: {exc} {detail or ''}")
        return False, f"Brevo API delivery failed: {detail or exc}"


def send_email(to_email: str, subject: str, html: str):
    """Send an HTML email using SMTP or Brevo's transactional API."""

    global _last_error
    _last_error = None

    msg = _build_message(to_email, subject, html)

    smtp_success, smtp_error = _send_via_smtp(msg, to_email)
    if smtp_success:
        return True
    if smtp_error:
        _last_error = smtp_error

    if BREVO_API_KEY:
        api_success, api_error = _send_via_brevo_api(to_email, subject, html)
        if api_success:
            return True
        if api_error:
            _last_error = api_error
    elif not _last_error:
        _last_error = "Neither SMTP nor Brevo API credentials are configured"

    return False