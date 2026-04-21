import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import "./Components.css";
import { useAuth } from "../Contexts/AuthContext";
import { useToast } from "../Contexts/ToastContext";
import { useNavigate } from "../App.jsx";
import Button from "./Button.jsx";
import Modal from "./Modal.jsx";

const Header = ({ isLanding = false, minimal = false }) => {
  const { isAuthenticated, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(
    window.location.hash.slice(1) || "/",
  );

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.slice(1) || "/");
      setMobileOpen(false);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const normalizedPath = currentPath.split("?")[0];
  const activePath = normalizedPath.startsWith("/report/")
    ? "/history"
    : normalizedPath;
  const isActive = (path) => activePath === path;

  const handleLogoClick = () => {
    navigate(isAuthenticated ? "/dashboard" : "/");
    setMobileOpen(false);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await Promise.resolve(logout());
      await new Promise((resolve) => setTimeout(resolve, 300));
      addToast("Logged out", "info");
      navigate("/");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div
            className="logo"
            role="button"
            onClick={handleLogoClick}
            style={{ cursor: "pointer" }}
          >
            🦷 DentalAI
          </div>

          {!minimal && (
            <button
              type="button"
              className="menu-toggle"
              aria-label={
                mobileOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <nav className={`nav ${mobileOpen ? "nav-open" : ""}`}>
            {minimal ? null : isLanding ? (
              <>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <Button
                  variant="outline"
                  className={isActive("/login") ? "nav-btn-active" : ""}
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  className={isActive("/signup") ? "nav-btn-active" : ""}
                  onClick={() => navigate("/signup")}
                >
                  Get Started
                </Button>
              </>
            ) : isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate("/upload")}
                  className={`nav-link ${isActive("/upload") ? "active" : ""}`}
                >
                  Upload
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className={`nav-link ${isActive("/history") ? "active" : ""}`}
                >
                  Reports
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className={`nav-link ${isActive("/profile") ? "active" : ""}`}
                >
                  Profile
                </button>
                <Button
                  variant="outline"
                  onClick={() => setShowLogoutModal(true)}
                  disabled={isLoggingOut}
                >
                  <LogOut size={18} /> Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className={isActive("/login") ? "nav-btn-active" : ""}
                  onClick={() => navigate("/login")}
                >
                  Login
                </Button>
                <Button
                  className={isActive("/signup") ? "nav-btn-active" : ""}
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => {
          if (!isLoggingOut) setShowLogoutModal(false);
        }}
        title="Confirm Logout"
        size="sm"
        closeOnOverlay={!isLoggingOut}
        closeOnEsc={!isLoggingOut}
        hideCloseButton={isLoggingOut}
      >
        <div className="logout-confirmation">
          <p>Are you sure you want to log out?</p>
          <div className="modal-actions">
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLogout}
              loading={isLoggingOut}
              loadingText="Logging out..."
            >
              Yes, Logout
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Header;
