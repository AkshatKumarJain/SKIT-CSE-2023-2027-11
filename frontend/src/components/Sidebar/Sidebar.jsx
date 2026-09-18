import "./Sidebar.css";

function Sidebar({ role }) {
  const menuItems = {
    student: [
      "Dashboard",
      "Project Selection",
      "My Team",
    ],

    teacher: [
      "Dashboard",
      "My Projects",
      "Project Requests",
    ],

    admin: [
      "Dashboard",
      "Project Allocation",
      "Project Bank",
      "Analytics",
    ],
  };

  const items = menuItems[role] || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <h2>{role?.charAt(0).toUpperCase() + role?.slice(1)}</h2>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <button
              type="button"
              className="sidebar-item"
              key={item}
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