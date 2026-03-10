/**
 * ForgotResetPage — Step 3
 * User sets a new password after OTP has been verified.
 * Flow: ForgotPasswordPage → ForgotOtpPage → ForgotResetPage → LoginPage
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "../App";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import "./Pages.css";

const ForgotResetPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { forgotReset } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Guard: must have a valid OTP-verified session to be here
    if (
      !sessionStorage.getItem("forgotEmail") ||
      !sessionStorage.getItem("forgotOtpVerified")
    ) {
      addToast("Session expired — please start again", "error");
      navigate("/forgot-password");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      addToast("Please fill in both fields", "error");
      return;
    }
    if (password !== confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    if (password.length < 6) {
      addToast("Password must be at least 6 characters", "error");
      return;
    }
    setLoading(true);
    const res = await forgotReset(password, confirmPassword);
    setLoading(false);
    if (res.ok) {
      addToast("Password reset successful — please log in", "success");
      navigate("/login");
    } else {
      addToast(res.error || "Password reset failed", "error");
    }
  };

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-container">
        <Card className="auth-card">
          <h1>Set New Password</h1>
          <p className="auth-subtitle">
            Choose a strong password for your account.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                placeholder="Enter new password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="auth-button" loading={loading}>
              Reset Password
            </Button>
          </form>

          <p className="auth-footer">
            <a onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>
              Back to Login
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ForgotResetPage;
