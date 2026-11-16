import { useEffect, useState } from "react";
import { getMyMentoredProjects } from "../../services/facultyService";
import "./TeacherMentoringProjects.css";

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

function formatStatus(status) {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getTeamMembers(project) {
  const team = project.teamId;

  if (!team) return [];

  const leader = team.leaderId;
  const members = Array.isArray(team.memberIds) ? team.memberIds : [];

  const allMembers = [
    ...(leader ? [{ ...leader, isLeader: true }] : []),
    ...members
      .filter((member) => member?._id !== leader?._id)
      .map((member) => ({ ...member, isLeader: false })),
  ];

  return allMembers;
}

function TeacherMentoringProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyMentoredProjects();
      setProjects(data);
    } catch (err) {
      setError(
        err.message || "Unable to load your mentoring projects."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const search = searchTerm.trim().toLowerCase();

    const title = project.projectId?.title || "";
    const domain = project.projectId?.domain || "";
    const studentName = project.studentId?.name || "";
    const studentEmail = project.studentId?.email || "";
    const teamStatus = project.teamId?.status || "";
    const mentoringStatus = project.status || "";

    const members = getTeamMembers(project);
    const memberNames = members
      .map((member) => member.name || member.email || "")
      .join(" ");

    const matchesSearch =
      title.toLowerCase().includes(search) ||
      domain.toLowerCase().includes(search) ||
      studentName.toLowerCase().includes(search) ||
      studentEmail.toLowerCase().includes(search) ||
      teamStatus.toLowerCase().includes(search) ||
      memberNames.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const approvedProjects = projects.filter(
    (project) => project.status === "APPROVED"
  ).length;

  const underReviewProjects = projects.filter(
    (project) => project.status === "FACULTY_REVIEW"
  ).length;

  return (
    <section className="teacher-mentoring-projects">
      <div className="mentoring-projects-header">
        <div>
          <h1>Project Mentoring by Me</h1>
          <p>
            View projects assigned to you for mentoring, including their
            students, teams, and current status.
          </p>
        </div>
      </div>

      <div className="mentoring-summary">
        <div className="mentoring-summary-card">
          <span>Total Projects</span>
          <strong>{projects.length}</strong>
        </div>

        <div className="mentoring-summary-card">
          <span>Approved</span>
          <strong>{approvedProjects}</strong>
        </div>

        <div className="mentoring-summary-card">
          <span>Faculty Review</span>
          <strong>{underReviewProjects}</strong>
        </div>
      </div>

      <div className="mentoring-projects-toolbar">
        <input
          type="text"
          placeholder="Search by project, domain, student, or team..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search mentoring projects"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter mentoring projects by status"
        >
          <option value="All">All Statuses</option>
          <option value="FACULTY_REVIEW">Faculty Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="mentoring-projects-message" role="status">
          Loading your mentoring projects...
        </div>
      ) : error ? (
        <div className="mentoring-projects-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadProjects}>
            Retry
          </button>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="mentoring-projects-grid">
          {filteredProjects.map((project) => {
            const projectDetails = project.projectId || {};
            const team = project.teamId || {};
            const members = getTeamMembers(project);

            return (
              <article
                className="mentoring-project-card"
                key={project._id}
              >
                <div className="mentoring-project-card-header">
                  <span className="mentoring-project-domain">
                    {projectDetails.domain || "General"}
                  </span>

                  <span
                    className={`mentoring-project-status status-${(
                      project.status || "unknown"
                    ).toLowerCase().replace(/_/g, "-")}`}
                  >
                    {formatStatus(project.status)}
                  </span>
                </div>

                <h2>{projectDetails.title || "Untitled Project"}</h2>

                <p className="mentoring-project-description">
                  {projectDetails.description || "No description available."}
                </p>

                <div className="mentoring-team-details">
                  <div>
                    <span>Student / Team Leader</span>
                    <strong>
                      {project.studentId?.name ||
                        team.leaderId?.name ||
                        "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span>Student Email</span>
                    <strong>
                      {project.studentId?.email || "Not available"}
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
                      {formatStatus(
                        project.source || projectDetails.source
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Visibility</span>
                    <strong>
                      {formatStatus(projectDetails.visibilityStatus)}
                    </strong>
                  </div>

                  <div>
                    <span>Submitted On</span>
                    <strong>{formatDate(project.submittedAt)}</strong>
                  </div>
                </div>

                {members.length > 0 && (
                  <div className="mentoring-team-members">
                    <h3>Team Members</h3>

                    <ul>
                      {members.map((member, index) => (
                        <li
                          key={
                            member._id ||
                            `${member.email || member.name}-${index}`
                          }
                        >
                          <span>
                            {member.name || "Unnamed student"}
                            {member.isLeader ? " (Leader)" : ""}
                          </span>

                          {member.email && (
                            <small>{member.email}</small>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {project.approvalHistory?.length > 0 && (
                  <div className="mentoring-project-history">
                    <h3>Status History</h3>

                    {project.approvalHistory.map((history, index) => (
                      <div
                        className="mentoring-history-item"
                        key={`${history.stage}-${index}`}
                      >
                        <strong>
                          {formatStatus(history.stage)}:{" "}
                          {formatStatus(history.action)}
                        </strong>

                        {history.comment && <p>{history.comment}</p>}

                        <small>{formatDate(history.actedAt)}</small>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mentoring-projects-empty">
          <h2>
            {projects.length === 0
              ? "No mentoring projects yet"
              : "No mentoring projects found"}
          </h2>

          <p>
            {projects.length === 0
              ? "Projects assigned to you for mentoring will appear here."
              : "Try changing your search or selecting a different status."}
          </p>
        </div>
      )}
    </section>
  );
}

export default TeacherMentoringProjects;