import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "../App";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import { Mail, RefreshCw } from "lucide-react";
import "./Pages.css";

const RESEND_COOLDOWN = 60; // seconds

const SignupConfirmPage = () => {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState(null);
  const inputRefs = useRef([]);
  const { completeSignup, resendSignupOtp } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Read target email from pending session
  const pending = JSON.parse(sessionStorage.getItem("signupPending") || "{}");
  const targetEmail = pending.email || "your email";

  // Prefill from dev-mode OTP if present
  useEffect(() => {
    const prefill = sessionStorage.getItem("signupOtp");
    if (prefill && prefill.length === 6) {
      setDigits(prefill.split(""));
      sessionStorage.removeItem("signupOtp");
    }
    // Show dev OTP banner if present
    const devCode = sessionStorage.getItem("signupDevOtp");
    if (devCode) setDevOtp(devCode);
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "").slice(-1); // only last digit
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length !== 6) {
      addToast("Please enter the full 6-digit OTP", "error");
      return;
    }
    setLoading(true);
    const res = await completeSignup(otp);
    setLoading(false);
    if (res.ok) {
      sessionStorage.removeItem("signupDevOtp");
      addToast("Account created \u2014 welcome to DentalAI!", "success");
      navigate("/dashboard");
    } else {
      addToast(res.error || "OTP verification failed", "error");
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const res = await resendSignupOtp();
    if (res.ok) {
      // Update dev OTP display if new one returned
      const data = res.data || {};
      if (data.dev && data.otp) {
        setDevOtp(data.otp);
        sessionStorage.setItem("signupDevOtp", data.otp);
        setDigits(data.otp.split(""));
      } else {
        setDigits(Array(6).fill(""));
      }
      addToast("New OTP sent to your email", "success");
      setCooldown(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
    } else {
      addToast(res.error || "Resend failed", "error");
    }
  };

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-container">
        <Card className="auth-card">
          <div className="otp-icon-wrap">
            <Mail size={40} strokeWidth={1.5} className="otp-mail-icon" />
          </div>
          <h1>Check Your Email</h1>
          <p className="auth-subtitle">We sent a 6-digit code to</p>
          <p className="otp-target-email">{targetEmail}</p>
          <p className="otp-hint">
            Enter it below to complete your registration.
          </p>

          {devOtp && (
            <div className="dev-otp-banner">
              <span className="dev-otp-label">DEV MODE — Your OTP</span>
              <div className="dev-otp-code">{devOtp}</div>
              <span className="dev-otp-note">(pre-filled below)</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="otp-digit-row" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`otp-digit-input${d ? " filled" : ""}`}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <Button type="submit" className="auth-button" loading={loading}>
              Verify & Complete Signup
            </Button>
          </form>

          <div className="otp-resend-row">
            <span className="otp-resend-label">Didn&apos;t receive it?</span>
            <button
              type="button"
              className={`otp-resend-btn${cooldown > 0 ? " disabled" : ""}`}
              onClick={handleResend}
              disabled={cooldown > 0}
            >
              <RefreshCw size={14} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
            </button>
          </div>

          <p className="auth-footer">
            Wrong email?{" "}
            <a
              onClick={() => navigate("/signup")}
              style={{ cursor: "pointer" }}
            >
              Go back
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default SignupConfirmPage;
