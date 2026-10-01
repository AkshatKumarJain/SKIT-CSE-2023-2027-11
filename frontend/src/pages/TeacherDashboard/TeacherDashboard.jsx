import "./TeacherDashboard.css";

function TeacherDashboard() {
  return (
    <section className="teacher-dashboard">
      <h1>Teacher Dashboard</h1>

      <div className="dashboard-card">
        <h2>My Projects</h2>
        <p>Your mentor projects will appear here.</p>
      </div>

      <div className="dashboard-card">
        <h2>Project Limit</h2>
        <p>You can mentor a maximum of 3 projects.</p>
      </div>
    </section>
  );
}

export default TeacherDashboard;