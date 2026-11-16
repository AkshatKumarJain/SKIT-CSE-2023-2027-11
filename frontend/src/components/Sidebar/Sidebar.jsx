
import { useLocation, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ role }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = {
    student: [
      "Dashboard",
      "Project Selection",
      "My Team",
    ],

    teacher: [
      "Dashboard",
      "Submit new Proposal",
      "My Proposed Projects",
      "Mentoring Requests",
      "Project Mentoring by Me",
    ],

    admin: [
      "Dashboard",
      "Project Allocation",
      "Project Bank",
      "Analytics",
    ],
  };

  const routes = {
    student: {
      Dashboard: "/student/dashboard",
      "Project Selection": "/project-selection",
      "My Team": "/project-selection/team",
    },

    teacher: {
      Dashboard: "/teacher/dashboard",
      "Submit new Proposal": "/teacher/dashboard/project-proposals",
      "My Proposed Projects": "/teacher/dashboard/my-proposed-projects",
      "Mentoring Requests": "/teacher/dashboard/mentoring-requests",
      "Project Mentoring by Me": "/teacher/dashboard/my-mentoring-projects",
    },

    admin: {
      Dashboard: "/admin/dashboard",
    },
  };

  const items = menuItems[role] || [];

  const handleNavigation = (item) => {
    const path = routes[role]?.[item];

    if (path) {
      navigate(path);
    }
  };

  const isActive = (item) => {
    const path = routes[role]?.[item];

    if (!path) {
      return false;
    }

    if (item === "Dashboard") {
      return location.pathname === path;
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
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
              className={`sidebar-item ${isActive(item) ? "active" : ""}`}
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
