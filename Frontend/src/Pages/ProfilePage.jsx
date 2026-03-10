import React, { useState, useEffect } from "react";
import { useNavigate } from "../App.jsx";
import { User, AlertCircle } from "lucide-react";
import Header from "../Components/Header.jsx";
import Card from "../Components/Card.jsx";
import { Button } from "../Components/Button.jsx";
import Modal from "../Components/Modal.jsx";
import Spinner from "../Components/Spinner.jsx";
import { useAuth } from "../Contexts/AuthContext.jsx";
import { useToast } from "../Contexts/ToastContext";
import "./Pages.css";

const ProfilePage = () => {
  const {
    user,
    authFetch,
    updateProfile,
    changePassword,
    deleteAccount,
    logout,
  } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    gender: "",
  });
  const [pwData, setPwData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch full profile on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/auth/me");
        if (!cancelled && res.ok) {
          const data = await res.json();
          setProfileData(data);
          setFormData({
            name: data.name || "",
            email: data.email || "",
            age: data.age || "",
            gender: data.gender || "",
          });
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateProfile({
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
    });
    setSaving(false);
    if (res.ok) {
      setIsEditing(false);
      addToast("Profile updated successfully", "success");
    } else {
      addToast(res.error || "Update failed", "error");
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profileData?.name || user?.name || "",
      email: profileData?.email || user?.email || "",
      age: profileData?.age || "",
      gender: profileData?.gender || "",
    });
    setIsEditing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwData.currentPassword || !pwData.newPassword) {
      addToast("Please fill all password fields", "error");
      return;
    }
    if (pwData.newPassword !== pwData.confirmPassword) {
      addToast("New passwords do not match", "error");
      return;
    }
    setChangingPw(true);
    const res = await changePassword(
      pwData.currentPassword,
      pwData.newPassword,
      pwData.confirmPassword,
    );
    setChangingPw(false);
    if (res.ok) {
      addToast("Password changed successfully", "success");
      setShowPasswordModal(false);
      setPwData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      addToast(res.error || "Password change failed", "error");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const res = await deleteAccount();
    setDeleting(false);
    if (res.ok) {
      addToast("Account deleted", "success");
      navigate("/");
    } else {
      addToast(res.error || "Delete failed", "error");
    }
  };

  const displayUser = profileData || user;

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-container">
        <h1>My Profile</h1>

        {loading ? (
          <div className="section-loader">
            <Spinner size={36} />
            <p>Loading profile…</p>
          </div>
        ) : (
          <div className="profile-content">
            <Card className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  <User size={64} />
                </div>
                <div className="profile-info">
                  <h2>{displayUser?.name}</h2>
                  <p>{displayUser?.email}</p>
                </div>
              </div>

              <div className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="Enter your age"
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={!isEditing}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="profile-actions">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} loading={saving}>
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <div className="profile-sidebar">
              <Card className="security-card">
                <h3>Security</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </Button>
              </Card>

              <Card className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Once you delete your account, there is no going back.</p>
                <Button
                  variant="outline"
                  className="delete-button"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete Account
                </Button>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <form className="password-form" onSubmit={handleChangePassword}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={pwData.currentPassword}
              onChange={(e) =>
                setPwData({ ...pwData, currentPassword: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={pwData.newPassword}
              onChange={(e) =>
                setPwData({ ...pwData, newPassword: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={pwData.confirmPassword}
              onChange={(e) =>
                setPwData({ ...pwData, confirmPassword: e.target.value })
              }
            />
          </div>
          <div className="modal-actions">
            <Button type="submit" loading={changingPw}>
              Update Password
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="delete-confirmation">
          <AlertCircle size={48} color="#ef4444" />
          <h3>Are you sure?</h3>
          <p>
            This action cannot be undone. All your data will be permanently
            deleted.
          </p>
          <div className="modal-actions">
            <Button
              className="delete-button"
              onClick={handleDeleteAccount}
              loading={deleting}
            >
              Yes, Delete My Account
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
export default ProfilePage;
