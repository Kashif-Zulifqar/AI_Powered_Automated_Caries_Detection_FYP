import { useState } from "react";
import { LogOut } from "lucide-react";
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

  const handleLogoClick = () => {
    navigate("/");
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

          <nav className="nav">
            {minimal ? null : isLanding ? (
              <>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#testimonials">Testimonials</a>
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/signup")}>Get Started</Button>
              </>
            ) : isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="nav-link"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate("/upload")}
                  className="nav-link"
                >
                  Upload
                </button>
                <button
                  onClick={() => navigate("/history")}
                  className="nav-link"
                >
                  Reports
                </button>
                <button
                  onClick={() => navigate("/profile")}
                  className="nav-link"
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
                <Button variant="outline" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/signup")}>Sign Up</Button>
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
