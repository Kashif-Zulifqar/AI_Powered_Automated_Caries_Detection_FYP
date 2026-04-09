import React, { useState, useEffect, useContext, createContext } from "react";
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

const RouteContext = createContext({
  currentPath: window.location.hash.slice(1) || "/",
  transitionStage: "idle",
  isTransitioning: false,
});

const useRoute = () => useContext(RouteContext);

export const useParams = () => {
  const { currentPath } = useRoute();
  const path = currentPath || window.location.hash.slice(1) || "/";
  const parts = path.split("/");
  return { id: parts[parts.length - 1] };
};

// Router Component
const ROUTE_EXIT_MS = 260;
const ROUTE_ENTER_MS = 520;

const Router = () => {
  const [currentPath, setCurrentPath] = useState(
    window.location.hash.slice(1) || "/",
  );
  const [pendingPath, setPendingPath] = useState(null);
  const [transitionStage, setTransitionStage] = useState("idle");

  useEffect(() => {
    const handleHashChange = () => {
      const nextPath = window.location.hash.slice(1) || "/";
      if (nextPath === currentPath && !pendingPath) return;

      setPendingPath(nextPath);
      setTransitionStage("exit");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [currentPath, pendingPath]);

  useEffect(() => {
    if (transitionStage !== "exit") return;

    const exitTimer = window.setTimeout(() => {
      setCurrentPath(pendingPath || currentPath);
      setTransitionStage("enter");
    }, ROUTE_EXIT_MS);

    return () => window.clearTimeout(exitTimer);
  }, [transitionStage, pendingPath, currentPath]);

  useEffect(() => {
    if (transitionStage !== "enter") return;

    const enterTimer = window.setTimeout(() => {
      setTransitionStage("idle");
      setPendingPath(null);
    }, ROUTE_ENTER_MS);

    return () => window.clearTimeout(enterTimer);
  }, [transitionStage]);

  return {
    currentPath,
    transitionStage,
    isTransitioning: transitionStage !== "idle",
  };
};

// Route Matching Component
const Routes = () => {
  const { currentPath, transitionStage } = useRoute();
  const { isAuthenticated, initializing } = useAuth();

  // Show full-page loader while checking stored token
  if (initializing) {
    return (
      <div className="page-loader">
        <Spinner size={48} />
        <p>Preparing your dashboard...</p>
      </div>
    );
  }

  let Component;

  if (currentPath === "/" || currentPath === "") {
    Component = LandingPage;
  } else if (currentPath === "/login") {
    Component = LoginPage;
  } else if (currentPath === "/signup") {
    Component = SignupPage;
  } else if (currentPath === "/signup/confirm") {
    Component = SignupConfirmPage;
  } else if (currentPath === "/forgot-password") {
    Component = ForgotPasswordPage;
  } else if (currentPath === "/forgot-otp") {
    Component = ForgotOtpPage;
  } else if (currentPath === "/forgot-reset") {
    Component = ForgotResetPage;
  } else if (currentPath === "/dashboard") {
    Component = isAuthenticated ? DashboardPage : LoginPage;
  } else if (currentPath === "/upload") {
    Component = isAuthenticated ? UploadPage : LoginPage;
  } else if (currentPath === "/results") {
    Component = isAuthenticated ? ResultsPage : LoginPage;
  } else if (currentPath === "/history") {
    Component = isAuthenticated ? HistoryPage : LoginPage;
  } else if (currentPath.startsWith("/report/")) {
    Component = isAuthenticated ? ReportDetailsPage : LoginPage;
  } else if (currentPath === "/profile") {
    Component = isAuthenticated ? ProfilePage : LoginPage;
  } else {
    Component = LandingPage;
  }

  return (
    <>
      <div className={`route-transition ${transitionStage}`} aria-hidden="true">
        <span className="route-transition__bar" />
        <span className="route-transition__sweep" />
      </div>

      <div className={`page-shell stage-${transitionStage}`}>
        <div className="page-shell__inner">
          <Component />
        </div>
      </div>
    </>
  );
};

// Main App Component
const App = () => {
  const routeState = Router();

  return (
    <AuthProvider>
      <ToastProvider>
        <div className="app">
          <RouteContext.Provider value={routeState}>
            <Routes />
          </RouteContext.Provider>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
