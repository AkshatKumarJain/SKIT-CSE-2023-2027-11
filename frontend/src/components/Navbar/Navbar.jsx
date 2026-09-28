import { useEffect, useState } from "react";
import "./Navbar.css";
import skitLogo from "../../assets/skit-logo.jpg";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/authService";

function Navbar({ isLoggedIn = false, name = "", profileImage = "" }) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const navigate = useNavigate();

  const firstLetter = name ? name.charAt(0).toUpperCase() : "U";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".navbar-profile")) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img
          src={skitLogo}
          alt="SKIT Jaipur Logo"
          className="navbar-logo"
        />

        <span className="navbar-title">
          Project Allocation & Tracking Portal
        </span>
      </div>

      {isLoggedIn && (
        <div className="navbar-profile">
          <button
            type="button"
            className="profile-button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="profile-image"
              />
            ) : (
              firstLetter
            )}
          </button>

          {isProfileMenuOpen && (
            <div className="profile-menu">
              <button
                type="button"
                className="profile-menu-item"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigate("/profile");
                }}
              >
                Profile
              </button>

              <button
                type="button"
                className="profile-menu-item"
                onClick={async () => {
                  try {
                    await logoutUser();
                    setIsProfileMenuOpen(false);
                    navigate("/login");
                  } catch (error) {
                    console.error("Logout failed:", error);
                  }
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;