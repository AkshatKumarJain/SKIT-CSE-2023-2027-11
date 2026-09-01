import "./Navbar.css";
import skitLogo from "../../assets/skit-logo.jpg";

function Navbar() {
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
    </nav>
  );
}

export default Navbar;