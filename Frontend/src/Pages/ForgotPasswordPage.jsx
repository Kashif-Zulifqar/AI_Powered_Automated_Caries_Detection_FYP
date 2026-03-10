/**
 * ForgotPasswordPage — Step 1
 * User enters their email; backend sends an OTP to that address.
 * Flow: ForgotPasswordPage → ForgotOtpPage → ForgotResetPage → LoginPage
 */
import React, { useState } from "react";
import { useNavigate } from "../App";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import "./Pages.css";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { forgotStart } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast("Please enter your email address", "error");
      return;
    }
    setLoading(true);
    const res = await forgotStart(email.trim().toLowerCase());
    setLoading(false);
    if (res.ok) {
      addToast("OTP sent to your email", "success");
      navigate("/forgot-otp");
    } else {
      addToast(res.error || "Failed to send OTP", "error");
    }
  };

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-container">
        <Card className="auth-card">
          <h1>Forgot Password</h1>
          <p className="auth-subtitle">
            Enter your account email and we&apos;ll send you a reset code.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <Button type="submit" className="auth-button" loading={loading}>
              Send Reset Code
            </Button>
          </form>

          <p className="auth-footer">
            Remembered it?{" "}
            <a onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>
              Back to Login
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
