import React, { useState } from "react";
import { useNavigate } from "../App";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import "./Pages.css";

// Common email domain typos -> correct mapping
const EMAIL_TYPOS = {
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmail.co": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
};

const checkEmailTypo = (email) => {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  return EMAIL_TYPOS[domain] || null;
};

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [emailWarning, setEmailWarning] = useState(null);
  const { signup } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "email") {
      const suggestion = checkEmailTypo(value);
      setEmailWarning(
        suggestion
          ? `Did you mean ${value.split("@")[0]}@${suggestion}?`
          : null,
      );
    }
  };

  const handleFixEmail = () => {
    if (!emailWarning) return;
    const local = formData.email.split("@")[0];
    const suggested = emailWarning.split("@")[1].replace("?", "");
    const fixed = `${local}@${suggested}`;
    setFormData({ ...formData, email: fixed });
    setEmailWarning(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      addToast("Passwords do not match", "error");
      return;
    }
    if (!formData.name || !formData.email || !formData.password) {
      addToast("Please fill in all fields", "error");
      return;
    }
    // Block submit if there's an obvious typo warning still showing
    if (emailWarning) {
      addToast("Please fix the email address before continuing", "error");
      return;
    }
    (async () => {
      setLoading(true);
      const res = await signup(
        formData.name,
        formData.email,
        formData.password,
      );
      setLoading(false);
      if (res.ok) {
        addToast(
          "OTP sent to your email — enter it to complete signup",
          "success",
        );
        setTimeout(() => navigate("/signup/confirm"), 180);
      } else {
        const err =
          res.error || (res.data && res.data.error) || "Signup failed";
        addToast(err, "error");
      }
    })();
  };

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-container">
        <Card className="auth-card">
          <h1>Create Account</h1>
          <p className="auth-subtitle">
            Join DentalAI for advanced caries detection
          </p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {emailWarning && (
                <div className="email-typo-warning">
                  <span>⚠ {emailWarning}</span>
                  <button
                    type="button"
                    className="fix-email-btn"
                    onClick={handleFixEmail}
                  >
                    Fix it
                  </button>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password (min 8 characters)"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit" className="auth-button" loading={loading}>
              Continue — Send OTP
            </Button>
          </form>
          <p className="auth-footer">
            Already have an account?{" "}
            <a
              onClick={() => navigate("/login")}
              style={{ color: "#2563eb", cursor: "pointer" }}
            >
              Login
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
};
export default SignupPage;
