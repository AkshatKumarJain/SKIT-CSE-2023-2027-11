import "./ChangePassword.css";

function ChangePassword() {
  return (
    <div className="change-password-page">
      <div className="change-password-card">
        <h2>Change Password</h2>
        <p className="change-password-subtitle">
          Update your password to keep your account secure.
        </p>

        <form>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button type="submit" className="change-password-button">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;