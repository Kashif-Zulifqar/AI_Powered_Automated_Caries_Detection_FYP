import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from "react";

// ============================================
// CONTEXT — Auth, Token Management & API Calls
// ============================================
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const API_BASE = import.meta.env.VITE_API_URL || "";

  // ─── Token helpers ──────────────────────────────────────────────────────
  const getToken = () => localStorage.getItem("dentalToken");

  const clearSession = useCallback(() => {
    localStorage.removeItem("dentalToken");
    localStorage.removeItem("dentalUser");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Authenticated fetch — attaches Bearer token, handles 401 auto-logout.
   * Use for all protected API calls.
   */
  const authFetch = useCallback(
    async (url, options = {}) => {
      const token = getToken();
      const headers = { ...(options.headers || {}) };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
      const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
      if (res.status === 401) clearSession();
      return res;
    },
    [API_BASE, clearSession],
  );

  // ─── On mount: validate stored token ────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setInitializing(false);
      return;
    }
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
          clearSession();
        }
      })
      .catch(() => clearSession())
      .finally(() => setInitializing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auth actions ───────────────────────────────────────────────────────

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
        const userObj = { email: data.email || email, name: data.name };
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

  const signup = async (name, email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register-start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (res.ok) {
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
      if (res.ok) return { ok: true, data };
      return { ok: false, error: data.error || "Resend failed" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // ─── Forgot password flow ──────────────────────────────────────────────

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
        sessionStorage.removeItem("forgotOtpVerified");
        return { ok: true };
      }
      return { ok: false, error: data.error || "Password reset failed" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // ─── Profile actions ───────────────────────────────────────────────────

  const updateProfile = async (updatedData) => {
    try {
      const res = await authFetch("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (res.ok) {
        const newUser = data.user || { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem("dentalUser", JSON.stringify(newUser));
        return { ok: true };
      }
      return { ok: false, error: data.error || "Update failed" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const changePassword = async (
    currentPassword,
    newPassword,
    confirmPassword,
  ) => {
    try {
      const res = await authFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) return { ok: true };
      return { ok: false, error: data.error || "Password change failed" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const deleteAccount = async () => {
    try {
      const res = await authFetch("/auth/delete-account", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        clearSession();
        return { ok: true };
      }
      return { ok: false, error: data.error || "Delete failed" };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  const logout = () => clearSession();

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        initializing,
        login,
        signup,
        completeSignup,
        resendSignupOtp,
        forgotStart,
        forgotVerifyOtp,
        forgotReset,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);
export { AuthProvider, useAuth };
