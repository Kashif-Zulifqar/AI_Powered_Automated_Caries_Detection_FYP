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

  useEffect(() => {
    const storedUser = localStorage.getItem("dentalUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (email, password) => {
    const mockUser = {
      name: "Dr. Sarah Johnson",
      email: email,
      age: 35,
      gender: "Female",
    };
    localStorage.setItem("dentalUser", JSON.stringify(mockUser));
    setUser(mockUser);
    setIsAuthenticated(true);
    return true;
  };

  const signup = (name, email, password) => {
    const newUser = { name, email, age: null, gender: null };
    localStorage.setItem("dentalUser", JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    localStorage.removeItem("dentalUser");
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
      value={{ user, isAuthenticated, login, signup, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);
export { AuthProvider, useAuth };
