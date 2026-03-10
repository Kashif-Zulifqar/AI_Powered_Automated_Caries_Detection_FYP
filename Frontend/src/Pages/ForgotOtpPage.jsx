/**
 * ForgotOtpPage — Step 2
 * User enters the 6-digit OTP that was emailed to them.
 * Flow: ForgotPasswordPage → ForgotOtpPage → ForgotResetPage → LoginPage
 */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "../App";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import { Mail, RefreshCw } from "lucide-react";
import "./Pages.css";

const RESEND_COOLDOWN = 60;

const ForgotOtpPage = () => {
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const { forgotVerifyOtp, forgotStart } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const targetEmail = sessionStorage.getItem("forgotEmail") || "your email";

  useEffect(() => {
    // Guard: if no email in session, user landed here directly — send back
    if (!sessionStorage.getItem("forgotEmail")) {
      navigate("/forgot-password");
      return;
    }
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < 5) inputRefs.current[index + 1]?.focus();
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
      addToast("Please enter the full 6-digit code", "error");
      return;
    }
    setLoading(true);
    const res = await forgotVerifyOtp(otp);
    setLoading(false);
    if (res.ok) {
      sessionStorage.removeItem("forgotDevOtp");
      addToast("OTP verified — set your new password", "success");
      navigate("/forgot-reset");
    } else {
      addToast(res.error || "OTP verification failed", "error");
      setDigits(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const res = await forgotStart(targetEmail);
    if (res.ok) {
      setDigits(Array(6).fill(""));
      addToast("New reset code sent to your email", "success");
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
          <h1>Enter Reset Code</h1>
          <p className="auth-subtitle">We sent a 6-digit code to</p>
          <p className="otp-target-email">{targetEmail}</p>
          <p className="otp-hint">Enter it below to continue.</p>

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
              Verify Code
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
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
            </button>
          </div>

          <p className="auth-footer">
            Wrong email?{" "}
            <a
              onClick={() => navigate("/forgot-password")}
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

export default ForgotOtpPage;
