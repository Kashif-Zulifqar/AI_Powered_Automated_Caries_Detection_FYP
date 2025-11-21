import React, { useState } from "react";
import { useNavigate } from "../App.jsx";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import "./Pages.css";

const LoginPage = () => {
  // --- Input States ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- Validation Error States ---
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // --- Hooks ---
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // --- Validation Functions ---

  const validateEmail = (emailValue) => {
    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailValue) {
        setEmailError("Email address is required.");
        return false;
    } else if (!emailRegex.test(emailValue)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (passwordValue) => {
    // Regex: Min 8 chars, at least one uppercase, one lowercase, one number, and one special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{8,}$/;

    if (!passwordValue) {
        setPasswordError("Password is required.");
        return false;
    } else if (!passwordRegex.test(passwordValue)) {
      setPasswordError(
        "Password must be at least 8 characters long and include: 1 uppercase, 1 lowercase, 1 number, and 1 special character."
      );
      return false;
    }
    setPasswordError("");
    return true;
  };

  // --- Form Submission Handler (CRITICAL FIXES HERE) ---

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Run final validation checks on current state values
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    // 2. Only proceed if BOTH are valid
    if (isEmailValid && isPasswordValid) {
      // Your actual login logic
      login(email, password);
      addToast("Login successful!", "success");
      navigate("/dashboard");
    } else {
      // Validation failed, errors are displayed below inputs.
      addToast("Please correct the form errors before logging in.", "error");
    }
    
    // *** REMOVED CONFLICTING AND REDUNDANT CODE FROM ORIGINAL SUBMISSION:
    // if (email && password) { ... } else { ... }
    // The logic above handles everything correctly.
  };

  return (
    <div className="auth-page">
      <Header />
      <div className="auth-container">
        <Card className="auth-card">
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">
            Login to access your dental analysis dashboard
          </p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                // Trigger validation when the user leaves the input field
                onBlur={() => validateEmail(email)} 
                required
              />
              {/* DISPLAY EMAIL ERROR */}
              {emailError && <p className="error-message">{emailError}</p>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Trigger validation when the user leaves the input field
                onBlur={() => validatePassword(password)} 
                required
              />
              {/* DISPLAY PASSWORD ERROR */}
              {passwordError && <p className="error-message">{passwordError}</p>}
            </div>

            <a href="#" className="forgot-password">
              Forgot Password?
            </a>
            <Button 
                type="submit" 
                className="auth-button"
                // Optional: Disable button if there are active errors 
                // disabled={!!emailError || !!passwordError} 
            >
              Login
            </Button>
          </form>
          <p className="auth-footer">
            Don't have an account?{" "}
            <a
              onClick={() => navigate("/signup")}
              style={{ color: "Black", cursor: "pointer" }}
            >
              Sign Up
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
};
export default LoginPage;