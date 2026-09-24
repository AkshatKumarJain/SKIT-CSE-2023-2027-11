import "./StudentDashboard.css";

function StudentDashboard() {
  return (
    <section className="student-dashboard">
      <h1>Student Dashboard</h1>

      <div className="dashboard-card">
        <h2>Selected Project</h2>
        <p>Your selected project details will appear here.</p>
      </div>

      <div className="dashboard-card">
        <h2>My Team</h2>
        <p>Your team members will appear here.</p>
      </div>
    </section>
  );
}

export default StudentDashboard;