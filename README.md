## Dental AI Platform

This repository hosts the hybrid (Flask + React) stack used for the Dental AI project.

### Backend setup

1. `cd Backend`
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Create a `.env` file (see email configuration below) and run `python app.py`.

### Email/OTP configuration

The OTP workflow now supports two transport layers:

- **SMTP relay** (Brevo, Gmail app password, MailHog, etc.). Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `SMTP_FROM_NAME`.
- **Brevo transactional API** as an automatic fallback when SMTP is not available. Set `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME`.

Example `.env` snippet:

```
FRONTEND_ORIGIN=http://127.0.0.1:5173
SECRET_KEY=change-me

# SMTP (primary)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_login
SMTP_PASS=your_brevo_app_password
SMTP_FROM=no-reply@yourdomain.com
SMTP_FROM_NAME=DentalAI Support

# Brevo API fallback (optional but recommended)
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=no-reply@yourdomain.com
BREVO_SENDER_NAME=DentalAI Support

# Enable to see OTPs in logs during local development only
DEV_MODE=false
```

With at least one transport configured, `/auth/register-start`, `/auth/forgot-start`, and `/auth/test-email` will deliver OTPs without needing to switch code branches.


This is it.