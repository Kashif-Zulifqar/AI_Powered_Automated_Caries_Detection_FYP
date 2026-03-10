import React, { useState, createContext, useContext, useEffect } from "react";
import {
  Camera,
  Upload,
  FileText,
  User,
  LogOut,
  Bell,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";

// ============================================
// CONTEXT - Auth & User Management
// ============================================
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const storedUser = localStorage.getItem("dentalUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // On mount, try to fetch current user if token present
  useEffect(() => {
    const token = localStorage.getItem("dentalToken");
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) {
            setUser(data);
            setIsAuthenticated(true);
            localStorage.setItem("dentalUser", JSON.stringify(data));
          } else {
            localStorage.removeItem("dentalToken");
            localStorage.removeItem("dentalUser");
          }
        })
        .catch(() => {
          localStorage.removeItem("dentalToken");
          localStorage.removeItem("dentalUser");
        });
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("dentalToken", data.token);
        const userObj = { email, name: data.name };
        localStorage.setItem("dentalUser", JSON.stringify(userObj));
        setUser(userObj);
        setIsAuthenticated(true);
        return { ok: true };
      }
      return { ok: false, error: data.error || "Login failed" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Start signup: call register-start, then store pending data in sessionStorage
  const signup = async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        // store pending signup details for confirmation step
        sessionStorage.setItem(
          "signupPending",
          JSON.stringify({ name, email, password }),
        );
        return { ok: true, data };
      }
      return { ok: false, error: data.error || "Signup failed", data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Complete signup using OTP
  const completeSignup = async (otp) => {
    const pending = sessionStorage.getItem("signupPending");
    if (!pending) return { ok: false, error: "No pending signup found" };
    const { email, password } = JSON.parse(pending);
    try {
      const res = await fetch(`${API_BASE}/auth/register-complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          password,
          confirmPassword: password,
        }),
      });
      const data = await res.json();
      if (res.status === 201) {
        // auto-login after successful registration
        sessionStorage.removeItem("signupPending");
        const loginRes = await login(email, password);
        return loginRes.ok
          ? { ok: true }
          : { ok: false, error: "Registration succeeded but login failed" };
      }
      return { ok: false, error: data.error || "Registration failed" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Forgot password: Step 1 — send OTP to email
  const forgotStart = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem("forgotEmail", email);
        return { ok: true, data };
      }
      return { ok: false, error: data.error || "Failed to send OTP" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Forgot password: Step 2 — verify OTP
  const forgotVerifyOtp = async (otp) => {
    const email = sessionStorage.getItem("forgotEmail");
    if (!email) return { ok: false, error: "Session expired — start again" };
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem("forgotOtpVerified", "true");
        return { ok: true };
      }
      return { ok: false, error: data.error || "Invalid OTP" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Forgot password: Step 3 — set new password
  const forgotReset = async (password, confirmPassword) => {
    const email = sessionStorage.getItem("forgotEmail");
    if (!email) return { ok: false, error: "Session expired — start again" };
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.removeItem("forgotEmail");
        sessionStorage.removeItem("forgotDevOtp");
        sessionStorage.removeItem("forgotOtpVerified");
        return { ok: true };
      }
      return { ok: false, error: data.error || "Password reset failed" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Resend OTP for pending signup – re-calls register-start with stored details
  const resendSignupOtp = async () => {
    const pending = sessionStorage.getItem("signupPending");
    if (!pending) return { ok: false, error: "No pending signup session" };
    const { name, email } = JSON.parse(pending);
    try {
      const res = await fetch(`${API_BASE}/auth/register-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.dev && data.otp) sessionStorage.setItem("signupOtp", data.otp);
        return { ok: true, data };
      }
      return { ok: false, error: data.error || "Resend failed" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("dentalUser");
    localStorage.removeItem("dentalToken");
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    localStorage.setItem("dentalUser", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        completeSignup,
        resendSignupOtp,
        forgotStart,
        forgotVerifyOtp,
        forgotReset,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);
export { AuthProvider, useAuth };
