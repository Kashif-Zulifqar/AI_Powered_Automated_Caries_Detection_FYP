import React, { useState } from "react";
import { useNavigate } from "../App";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import "./Pages.css";

const SignupPage = () => {
  // --- Input States ---
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // --- Validation Error States ---
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // --- Hooks ---
  const { signup } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // --- Change Handler ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear errors when user starts typing again
    if (e.target.name === 'email') setEmailError('');
    if (e.target.name === 'password') setPasswordError('');
    if (e.target.name === 'confirmPassword') setConfirmPasswordError('');
    if (e.target.name === 'name') setNameError('');
  };

  // --- Validation Functions ---

  const validateName = (nameValue) => {
      if (!nameValue || nameValue.trim().length < 2) {
          setNameError("Full Name is required and must be at least 2 characters.");
          return false;
      }
      setNameError("");
      return true;
  };

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
        "Password must be 8+ chars, with 1 uppercase, 1 lowercase, 1 number, and 1 special char."
      );
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirmPasswordValue, passwordValue) => {
    // 1. Check if the main password is valid first (for the complexity error)
    const isPasswordComplex = validatePassword(passwordValue); 

    // 2. Check for match error
    if (confirmPasswordValue !== passwordValue) {
      setConfirmPasswordError("Passwords do not match.");
      return false;
    }
    // Only clear the error if the main password is also complex and they match
    if (isPasswordComplex) {
      setConfirmPasswordError("");
      return true;
    }
    // If the main password isn't complex, the error remains on the password field, 
    // but the confirm field is cleared if they match.
    return isPasswordComplex;
  };


  // --- Form Submission Handler ---

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Run final checks on all fields
    const isNameValid = validateName(formData.name);
    const isEmailValid = validateEmail(formData.email);
    const isPasswordValid = validatePassword(formData.password);
    const isConfirmPasswordValid = validateConfirmPassword(
      formData.confirmPassword,
      formData.password
    );

    // 2. Only proceed if ALL fields are valid
    if (isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid) {
      // Your actual signup logic
      signup(formData.name, formData.email, formData.password);
      addToast("Account created successfully!", "success");
      navigate("/dashboard");
    } else {
      // If validation fails, show a general error toast and let the field-specific messages guide the user.
      addToast("Please correct the form errors before signing up.", "error");
    }
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
          {/*  */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                onBlur={() => validateName(formData.name)}
                required
              />
              {nameError && <p className="error-message">{nameError}</p>}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                onBlur={() => validateEmail(formData.email)}
                required
              />
              {emailError && <p className="error-message">{emailError}</p>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                onBlur={() => validatePassword(formData.password)}
                required
              />
              {passwordError && <p className="error-message">{passwordError}</p>}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={() => validateConfirmPassword(formData.confirmPassword, formData.password)}
                required
              />
              {confirmPasswordError && <p className="error-message">{confirmPasswordError}</p>}
            </div>

            <Button type="submit" className="auth-button">
              Sign Up
            </Button>
          </form>
          <p className="auth-footer">
            Already have an account?{" "}
            <a
              onClick={() => navigate("/login")}
              style={{ color: "#007bff", cursor: "pointer" }}
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