import os
from dotenv import load_dotenv
from emailer import send_email

load_dotenv()

TO = os.getenv("TEST_TO")

if not TO:
    print("Set TEST_TO in .env to the recipient email to test sending.")
    exit(1)

res = send_email(TO, "IADS SMTP Test", "<p>This is a test message from IADS backend.</p>")
if res:
    print("Test email sent successfully to", TO)
else:
    print("Test email failed. Check SMTP settings (SMTP_USER, SMTP_PASS, SMTP_HOST, SMTP_PORT).\nIf running locally and you don't want to configure SMTP, set DEV_MODE=true to use dev fallback.")
