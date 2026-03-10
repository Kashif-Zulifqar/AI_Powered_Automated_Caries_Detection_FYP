import React, { useState } from "react";
import { useNavigate } from "../App.jsx";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import "./Pages.css";
import { Pointer } from "lucide-react";
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    (async () => {
      if (email && password) {
        setLoading(true);
        const res = await login(email, password);
        setLoading(false);
        if (res.ok) {
          addToast("Login successful!", "success");
          // small delay for UX transition
          setTimeout(() => navigate("/dashboard"), 180);
        } else {
          addToast(res.error || "Login failed", "error");
        }
      } else {
        addToast("Please fill in all fields", "error");
      }
    })();
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
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <a
              onClick={() => navigate("/forgot-password")}
              className="forgot-password"
              style={{ cursor: "pointer" }}
            >
              Forgot Password?
            </a>
            <Button type="submit" className="auth-button" loading={loading}>
              Login
            </Button>
          </form>
          <p className="auth-footer">
            Don't have an account?{" "}
            <a
              onClick={() => navigate("/signup")}
              style={{ color: "sky blue", cursor: "Pointer" }}
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
