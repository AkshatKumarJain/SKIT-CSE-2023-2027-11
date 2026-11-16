
import { useEffect, useState } from "react";
import { getMyMentoredProjects } from "../../services/facultyService";
import { getMyProfile } from "../../services/profileService";
import "./TeacherDashboard.css";

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(dateString) {
  if (!dateString) return "Not available";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTeamMembers(project) {
  const team = project.teamId;

  if (!team) return [];

  const leader = team.leaderId;
  const members = Array.isArray(team.memberIds) ? team.memberIds : [];

  return [
    ...(leader ? [{ ...leader, isLeader: true }] : []),
    ...members
      .filter((member) => member?._id !== leader?._id)
      .map((member) => ({ ...member, isLeader: false })),
  ];
}

function TeacherDashboard() {
  const [teacher, setTeacher] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    const [profileResult, projectsResult] = await Promise.allSettled([
      getMyProfile(),
      getMyMentoredProjects(),
    ]);

    if (profileResult.status === "fulfilled") {
      setTeacher(profileResult.value);
    }

    if (projectsResult.status === "fulfilled") {
      setProjects(
        Array.isArray(projectsResult.value) ? projectsResult.value : []
      );
    } else {
      setError(
        projectsResult.reason?.message ||
          "Unable to load your mentoring projects."
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const teacherName =
    teacher?.name ||
    teacher?.fullName ||
    teacher?.user?.name ||
    "Teacher";

  const approvedProjects = projects.filter(
    (project) => project.status === "APPROVED"
  ).length;

  const underReviewProjects = projects.filter(
    (project) =>
      project.status === "FACULTY_REVIEW" ||
      project.status === "MENTOR_REVIEW"
  ).length;

  return (
    <section className="teacher-dashboard">
      {/* Welcome Section */}
      <div className="teacher-welcome">
        <div>
          <span className="teacher-welcome-label">TEACHER DASHBOARD</span>
          <h1>Welcome back, {teacherName}!</h1>
          <p>
            Here's an overview of the projects you are currently mentoring
            and their progress.
          </p>
        </div>
      </div>

      {/* Project Summary */}
      <div className="teacher-dashboard-summary">
        <div className="teacher-dashboard-summary-card">
          <span>Total Projects</span>
          <strong>{projects.length}</strong>
        </div>

        <div className="teacher-dashboard-summary-card">
          <span>Approved Projects</span>
          <strong>{approvedProjects}</strong>
        </div>

        <div className="teacher-dashboard-summary-card">
          <span>Under Review</span>
          <strong>{underReviewProjects}</strong>
        </div>
      </div>

      {/* Your Projects */}
      <div className="teacher-dashboard-projects-section">
        <div className="teacher-dashboard-section-header">
          <div>
            <h2>Your Projects</h2>
            <p>Projects assigned to you for mentoring and their current status.</p>
          </div>

          <span className="teacher-project-count">
            {projects.length} {projects.length === 1 ? "Project" : "Projects"}
          </span>
        </div>

        {loading ? (
          <div className="teacher-dashboard-message" role="status">
            Loading your dashboard...
          </div>
        ) : error ? (
          <div className="teacher-dashboard-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadDashboard}>
              Retry
            </button>
          </div>
        ) : projects.length > 0 ? (
          <div className="teacher-dashboard-project-grid">
            {projects.map((project) => {
              const details = project.projectId || {};
              const team = project.teamId || {};
              const members = getTeamMembers(project);

              const statusClass = (project.status || "unknown")
                .toLowerCase()
                .replace(/_/g, "-");

              return (
                <article
                  className="teacher-dashboard-project-card"
                  key={project._id}
                >
                  <div className="teacher-dashboard-project-top">
                    <span className="teacher-dashboard-domain">
                      {details.domain || "General"}
                    </span>

                    <span
                      className={`teacher-dashboard-status status-${statusClass}`}
                    >
                      {formatStatus(project.status)}
                    </span>
                  </div>

                  <h3>{details.title || "Untitled Project"}</h3>

                  <p className="teacher-dashboard-project-description">
                    {details.description || "No description available."}
                  </p>

                  <div className="teacher-dashboard-project-details">
                    <div>
                      <span>Team Leader</span>
                      <strong>
                        {project.studentId?.name ||
                          team.leaderId?.name ||
                          "Not available"}
                      </strong>
                    </div>

                    <div>
                      <span>Team Size</span>
                      <strong>{members.length || "Not available"}</strong>
                    </div>

                    <div>
                      <span>Team Status</span>
                      <strong>{formatStatus(team.status)}</strong>
                    </div>

                    <div>
                      <span>Project Source</span>
                      <strong>
                        {formatStatus(project.source || details.source)}
                      </strong>
                    </div>

                    <div>
                      <span>Submitted On</span>
                      <strong>{formatDate(project.submittedAt)}</strong>
                    </div>
                  </div>

                  {members.length > 0 && (
                    <div className="teacher-dashboard-team">
                      <h4>Team Members</h4>

                      <ul>
                        {members.map((member, index) => (
                          <li
                            key={
                              member._id ||
                              `${member.email || member.name}-${index}`
                            }
                          >
                            <span>
                              {member.name || "Unnamed Student"}
                              {member.isLeader ? " (Leader)" : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="teacher-dashboard-empty">
            <h3>No Projects Yet</h3>
            <p>
              Projects assigned to you for mentoring will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default TeacherDashboard;
