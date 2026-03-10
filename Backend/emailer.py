"""
DentalAI — Email Delivery Module
=================================
Sends transactional emails (OTP codes, password resets) via:

  1. SMTP (Gmail, Brevo, etc.) — primary transport
     Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SENDER_EMAIL in .env

  2. Brevo HTTP API — optional alternative
     Set BREVO_API_KEY + SENDER_EMAIL in .env

Gmail App Password setup:
  1. Enable 2-Step Verification on your Google Account
  2. Go to https://myaccount.google.com/apppasswords
  3. Generate an app password for "Mail"
  4. Add it to .env as SMTP_PASS

Expected flow:
  Signup → OTP Generated → Email Sent via SMTP → User Enters OTP → Verification Successful
"""

import os
import re
import html as html_lib
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from typing import Optional

import requests
from dotenv import load_dotenv

# Always override stale shell env vars with .env values
load_dotenv(override=True)

# ─── Logger ──────────────────────────────────────────────────────────────────
log = logging.getLogger("dentalai.email")
if not log.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter(
        "%(asctime)s [%(name)s] %(levelname)s  %(message)s", datefmt="%H:%M:%S"
    ))
    log.addHandler(_h)
log.setLevel(logging.DEBUG)


# ─── Configuration ───────────────────────────────────────────────────────────
def _e(key: str, fallback: str = "", *alt_keys: str) -> str:
    """Read an env var; try alternates if primary is empty."""
    val = os.getenv(key, "").strip()
    if val:
        return val
    for alt in alt_keys:
        val = os.getenv(alt, "").strip()
        if val:
            return val
    return fallback


BREVO_API_KEY = _e("BREVO_API_KEY")
SENDER_NAME   = _e("SENDER_NAME", "DentalAI")

# SENDER_EMAIL must be set explicitly — do NOT fall back to SMTP_FROM
# (Brevo SMTP login e.g. a1192c001@smtp-brevo.com is NOT a valid sender)
SENDER_EMAIL  = _e("SENDER_EMAIL")

SMTP_HOST = _e("SMTP_HOST", "", "EMAIL_HOST")
SMTP_PORT = int(_e("SMTP_PORT", "587", "EMAIL_PORT") or "587")
SMTP_USER = _e("SMTP_USER", "", "EMAIL_USER")
SMTP_PASS = _e("SMTP_PASS", "", "EMAIL_PASS")


# ─── Startup diagnostics ────────────────────────────────────────────────────
_api_ok  = bool(BREVO_API_KEY and SENDER_EMAIL)
_smtp_ok = bool(SMTP_HOST and SMTP_USER and SMTP_PASS and SENDER_EMAIL)

log.info("─── Email configuration ───")
log.info(f"  Sender     : {SENDER_NAME} <{SENDER_EMAIL or 'NOT SET'}>")
log.info(f"  Brevo API  : {'ready' if _api_ok else 'disabled'}")
log.info(f"  SMTP       : {'ready (' + SMTP_HOST + ')' if _smtp_ok else 'disabled'}")
if not _api_ok and not _smtp_ok:
    log.error("  NO EMAIL TRANSPORT AVAILABLE — set BREVO_API_KEY or SMTP_* plus SENDER_EMAIL in .env")
log.info("────────────────────────────")


# ─── Delivery state ─────────────────────────────────────────────────────────
_last_error: Optional[str] = None


def get_last_error() -> Optional[str]:
    """Return the error message from the most recent failed send_email() call."""
    return _last_error


# Backward-compat alias used by older auth.py imports
get_last_email_error = get_last_error


# ─── Helpers ─────────────────────────────────────────────────────────────────
def _html_to_text(html_content: str) -> str:
    """Convert HTML to plain text for the multipart text/plain fallback."""
    text = re.sub(r"<br\s*/?>", "\n", html_content, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html_lib.unescape(text)
    return re.sub(r"[ \t]+", " ", text).strip()


def _via_brevo_api(to: str, subject: str, html: str) -> tuple:
    """Send via Brevo transactional email HTTP API."""
    if not BREVO_API_KEY:
        return False, "BREVO_API_KEY not set"
    if not SENDER_EMAIL:
        return False, "SENDER_EMAIL not set — add a verified sender email to .env"

    try:
        resp = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "accept": "application/json",
                "content-type": "application/json",
                "api-key": BREVO_API_KEY,
            },
            json={
                "sender": {"email": SENDER_EMAIL, "name": SENDER_NAME},
                "to": [{"email": to}],
                "subject": subject,
                "htmlContent": html,
                "textContent": _html_to_text(html),
            },
            timeout=15,
        )
        if resp.ok:
            mid = resp.json().get("messageId", "?")
            log.info(f"Brevo API  -> {to}  (messageId: {mid})")
            return True, None
        detail = resp.text[:300]
        log.error(f"Brevo API FAIL -> {to}  HTTP {resp.status_code}: {detail}")
        return False, f"Brevo API {resp.status_code}: {detail}"
    except requests.RequestException as exc:
        log.error(f"Brevo API exception: {exc}")
        return False, f"Brevo API request error: {exc}"


def _via_smtp(to: str, subject: str, html: str) -> tuple:
    """Send via SMTP relay (Brevo SMTP, Gmail, etc.)."""
    if not (SMTP_HOST and SMTP_USER and SMTP_PASS):
        return False, "SMTP not fully configured (need SMTP_HOST, SMTP_USER, SMTP_PASS)"
    if not SENDER_EMAIL:
        return False, "SENDER_EMAIL not set — required as the From address for SMTP delivery"

    from_addr = SENDER_EMAIL

    msg = MIMEMultipart("alternative")
    msg["From"]       = formataddr((SENDER_NAME, from_addr))
    msg["To"]         = to
    msg["Subject"]    = subject
    msg["Date"]       = formatdate(localtime=False)
    msg["Message-ID"] = make_msgid(domain=from_addr.split("@")[-1])
    msg.attach(MIMEText(_html_to_text(html), "plain", "utf-8"))
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as srv:
            srv.ehlo()
            srv.starttls()
            srv.ehlo()
            srv.login(SMTP_USER, SMTP_PASS)
            srv.send_message(msg)
        log.info(f"SMTP -> {to}")
        return True, None
    except smtplib.SMTPAuthenticationError as e:
        log.error(f"SMTP auth failed: {e}")
        return False, f"SMTP authentication failed: {e}"
    except Exception as e:
        log.error(f"SMTP send failed: {e}")
        return False, f"SMTP error: {e}"


# ─── Public API ──────────────────────────────────────────────────────────────
def send_email(to_email: str, subject: str, html: str) -> bool:
    """
    Send an HTML email to *to_email*.

    Tries SMTP first (Gmail/Brevo/etc.), falls back to Brevo HTTP API.
    Returns True on success, False on failure.
    Call get_last_error() after a failure for the reason.
    """
    global _last_error
    _last_error = None
    errors = []

    # Method 1: SMTP (primary — Gmail, Brevo relay, etc.)
    if SMTP_HOST and SMTP_USER and SMTP_PASS:
        try:
            ok, err = _via_smtp(to_email, subject, html)
            if ok:
                return True
            if err:
                errors.append(err)
        except Exception as exc:
            errors.append(f"SMTP exception: {exc}")
            log.exception("SMTP unexpected error")

    # Method 2: Brevo HTTP API (fallback if SMTP not configured or failed)
    if BREVO_API_KEY:
        try:
            ok, err = _via_brevo_api(to_email, subject, html)
            if ok:
                return True
            if err:
                errors.append(err)
        except Exception as exc:
            errors.append(f"Brevo API exception: {exc}")
            log.exception("Brevo API unexpected error")

    # Nothing worked
    if not errors:
        errors.append("No email transport configured — set BREVO_API_KEY or SMTP_* in .env")
    _last_error = " | ".join(errors)
    log.error(f"All delivery methods FAILED for {to_email}: {_last_error}")
    return False