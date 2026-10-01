import "./AdminDashboard.css";

function AdminDashboard() {
  return (
    <section className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="dashboard-stats">
        <div className="dashboard-card">
          <h2>Total Students</h2>
          <p>Student count will appear here.</p>
        </div>

        <div className="dashboard-card">
          <h2>Projects Selected</h2>
          <p>Selected project count will appear here.</p>
        </div>

        <div className="dashboard-card">
          <h2>Projects Approved</h2>
          <p>Approved project count will appear here.</p>
        </div>

        <div className="dashboard-card">
          <h2>Projects Remaining</h2>
          <p>Remaining project count will appear here.</p>
        </div>
      </div>

      <div className="dashboard-card">
        <h2>Mentor Details</h2>
        <p>Mentor and project allocation details will appear here.</p>
      </div>
    </section>
  );
}

export default AdminDashboard;