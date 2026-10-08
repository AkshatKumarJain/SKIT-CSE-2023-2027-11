import { useEffect, useState } from "react";
import "./StudentDashboard.css";
import { getMyApplications } from "../../services/applicationService";

function StudentDashboard() {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadApplication = async () => {
      try {
        setLoading(true);
        setError("");

        const applications = await getMyApplications();

        if (applications && applications.length > 0) {
          setApplication(applications[0]);
        } else {
          setApplication(null);
        }
      } catch (error) {
        console.error("Failed to load student application:", error);
        setError(
          error.message || "Failed to load project and team information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, []);

  if (loading) {
    return (
      <section className="student-dashboard">
        <h1>Student Dashboard</h1>
        <p>Loading your project and team information...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="student-dashboard">
        <h1>Student Dashboard</h1>
        <p className="dashboard-error">{error}</p>
      </section>
    );
  }

  if (!application) {
    return (
      <section className="student-dashboard">
        <h1>Student Dashboard</h1>

        <div className="dashboard-card">
          <h2>Selected Project</h2>
          <p>No project has been selected yet.</p>
        </div>

        <div className="dashboard-card">
          <h2>My Team</h2>
          <p>You are not part of a team yet.</p>
        </div>
      </section>
    );
  }

  /*
   * For OWN_IDEA applications, projectId can be null.
   * In that case, projectDetails contains the project information.
   */
  const project = application.projectId || application.projectDetails;
  const team = application.teamId;

  const teamMembers = team?.memberIds || [];

  return (
    <section className="student-dashboard">
      <h1>Student Dashboard</h1>

      {/* Selected Project */}
      <div className="dashboard-card">
        <h2>Selected Project</h2>

        {project ? (
          <div className="project-details">
            <div className="detail-row">
              <strong>Title:</strong>
              <span>
                {project.title || "—"}
              </span>
            </div>

            <div className="detail-row">
              <strong>Domain:</strong>
              <span>
                {project.domain || "—"}
              </span>
            </div>

            <div className="detail-row">
              <strong>Description:</strong>
              <span>
                {project.description || "—"}
              </span>
            </div>

            <div className="detail-row">
              <strong>Technologies:</strong>
              <span>
                {project.technologies?.length
                  ? project.technologies.join(", ")
                  : "—"}
              </span>
            </div>

            <div className="detail-row">
              <strong>SDG Goals:</strong>
              <span>
                {project.sdgGoals?.length
                  ? project.sdgGoals.join(", ")
                  : "—"}
              </span>
            </div>

            <div className="detail-row">
              <strong>Mentor:</strong>
              <span>
                {application.mentorId?.name || "—"}
              </span>
            </div>

            <div className="detail-row">
              <strong>Status:</strong>
              <span className="status-badge">
                {application.status || "—"}
              </span>
            </div>
          </div>
        ) : (
          <p>No project information available.</p>
        )}
      </div>

      {/* My Team */}
      <div className="dashboard-card">
        <h2>My Team</h2>

        {team ? (
          <div className="team-details">
            <div className="detail-row">
              <strong>Team Leader:</strong>
              <span>
                {team.leaderId?.name || "—"}
              </span>
            </div>

            <div className="detail-row">
              <strong>Team Status:</strong>
              <span className="status-badge">
                {team.status || "—"}
              </span>
            </div>

            <div className="team-members">
              <h3>Team Members</h3>

              {teamMembers.length > 0 ? (
                <div className="team-member-list">
                  {teamMembers.map((member) => (
                    <div
                      className="team-member"
                      key={member._id}
                    >
                      <div>
                        <strong>{member.name}</strong>
                        <span>{member.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No other team members.</p>
              )}
            </div>
          </div>
        ) : (
          <p>You are not part of a team yet.</p>
        )}
      </div>
    </section>
  );
}

export default StudentDashboard;