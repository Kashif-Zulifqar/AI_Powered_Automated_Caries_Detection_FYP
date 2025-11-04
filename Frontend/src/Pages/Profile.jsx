const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    age: user?.age || "",
    gender: user?.gender || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
    addToast("Profile updated successfully", "success");
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      age: user?.age || "",
      gender: user?.gender || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-container">
        <h1>My Profile</h1>

        <div className="profile-content">
          <Card className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">
                <User size={64} />
              </div>
              <div className="profile-info">
                <h2>{user?.name}</h2>
                <p>{user?.email}</p>
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
                    onChange={handleChange}
                    disabled={!isEditing}
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
                    <Button onClick={handleSave}>Save Changes</Button>
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
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <form className="password-form">
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" placeholder="Enter current password" />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" placeholder="Enter new password" />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" placeholder="Confirm new password" />
          </div>
          <div className="modal-actions">
            <Button
              onClick={() => {
                addToast("Password changed successfully", "success");
                setShowPasswordModal(false);
              }}
            >
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
              onClick={() => {
                addToast("Account deleted", "success");
                setShowDeleteModal(false);
              }}
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
