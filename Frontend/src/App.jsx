import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./Contexts/AuthContext";
import { ToastProvider } from "./Contexts/ToastContext";
import Spinner from "./Components/Spinner";
import LandingPage from "./Pages/LandingPage";
import LoginPage from "./Pages/LoginPage";
import SignupPage from "./Pages/SignupPage";
import SignupConfirmPage from "./Pages/SignupConfirmPage";
import DashboardPage from "./Pages/Dashboard";
import UploadPage from "./Pages/UploadPage";
import ResultsPage from "./Pages/ResultsPage";
import HistoryPage from "./Pages/HistoryPage";
import ReportDetailsPage from "./Pages/ReportDetailsPage";
import ProfilePage from "./Pages/ProfilePage";
import ForgotPasswordPage from "./Pages/ForgotPasswordPage";
import ForgotOtpPage from "./Pages/ForgotOtpPage";
import ForgotResetPage from "./Pages/ForgotResetPage";

// Simple Hash Router Hook
export const useNavigate = () => {
  return (path) => {
    window.location.hash = path;
  };
};

export const useParams = () => {
  const hash = window.location.hash.slice(1);
  const parts = hash.split("/");
  return { id: parts[parts.length - 1] };
};

// Router Component
const Router = () => {
  const [currentPath, setCurrentPath] = useState(
    window.location.hash.slice(1) || "/",
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || "/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return currentPath;
};

// Route Matching Component
const Routes = () => {
  const currentPath = Router();
  const { isAuthenticated, initializing } = useAuth();

  // Show full-page loader while checking stored token
  if (initializing) {
    return (
      <div className="page-loader">
        <Spinner size={48} />
        <p>Loading…</p>
      </div>
    );
  }

  // Route matching logic
  if (currentPath === "/" || currentPath === "") {
    return <LandingPage />;
  } else if (currentPath === "/login") {
    return <LoginPage />;
  } else if (currentPath === "/signup") {
    return <SignupPage />;
  } else if (currentPath === "/signup/confirm") {
    return <SignupConfirmPage />;
  } else if (currentPath === "/forgot-password") {
    return <ForgotPasswordPage />;
  } else if (currentPath === "/forgot-otp") {
    return <ForgotOtpPage />;
  } else if (currentPath === "/forgot-reset") {
    return <ForgotResetPage />;
  } else if (currentPath === "/dashboard") {
    return isAuthenticated ? <DashboardPage /> : <LoginPage />;
  } else if (currentPath === "/upload") {
    return isAuthenticated ? <UploadPage /> : <LoginPage />;
  } else if (currentPath === "/results") {
    return isAuthenticated ? <ResultsPage /> : <LoginPage />;
  } else if (currentPath === "/history") {
    return isAuthenticated ? <HistoryPage /> : <LoginPage />;
  } else if (currentPath.startsWith("/report/")) {
    return isAuthenticated ? <ReportDetailsPage /> : <LoginPage />;
  } else if (currentPath === "/profile") {
    return isAuthenticated ? <ProfilePage /> : <LoginPage />;
  } else {
    return <LandingPage />;
  }
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="app">
          <Routes />
        </div>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
