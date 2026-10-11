import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ role }) {
  const navigate = useNavigate();

  const menuItems = {
    student: [
      "Dashboard",
      "Project Selection",
      "My Team",
    ],

    teacher: [
      "Dashboard",
      "Project Proposals",
    ],

    admin: [
      "Dashboard",
      "Project Allocation",
      "Project Bank",
      "Analytics",
    ],
  };

  const items = menuItems[role] || [];

  const handleNavigation = (item) => {
  if (role === "student") {
    if (item === "Dashboard") {
      navigate("/student/dashboard");
    }

    if (item === "Project Selection") {
      navigate("/project-selection");
    }

    if (item === "My Team") {
      navigate("/project-selection/team");
    }
  }

  if (role === "teacher") {
    if (item === "Dashboard") {
      navigate("/teacher/dashboard");
    }

    if (item === "Project Proposals") {
      navigate("/teacher/dashboard/project-proposals");
    }
  }
};

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <h2>
          {role?.charAt(0).toUpperCase() + role?.slice(1)}
        </h2>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <button
              type="button"
              className="sidebar-item"
              key={item}
              onClick={() => handleNavigation(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;