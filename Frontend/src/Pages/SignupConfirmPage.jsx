import React, { useState } from "react";
import { useNavigate } from "../App";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import "./Pages.css";
import { useEffect } from "react";

const SignupConfirmPage = () => {
  const [otp, setOtp] = useState("");
  const { completeSignup } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const otpPrefill = sessionStorage.getItem("signupOtp");
    if (otpPrefill) {
      setOtp(otpPrefill);
      // remove it so it's not reused accidentally
      sessionStorage.removeItem("signupOtp");
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    (async () => {
      const res = await completeSignup(otp);
      if (res.ok) {
        addToast("Signup complete — logged in", "success");
        navigate("/dashboard");
      } else {
        addToast(res.error || "OTP verification failed", "error");
      }
    })();
  };

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-container">
        <Card className="auth-card">
          <h1>Confirm Your Email</h1>
          <p className="auth-subtitle">Enter the OTP sent to your email</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>OTP</label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="auth-button">
              Verify & Complete Signup
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SignupConfirmPage;
