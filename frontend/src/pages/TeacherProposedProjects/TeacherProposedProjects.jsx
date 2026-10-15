import { useEffect, useState } from "react";
import { getMyUploadedProjects } from "../../services/facultyService";
import "./TeacherProposedProjects.css";

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

function TeacherProposedProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const data = await getMyUploadedProjects();
      setProjects(data);
    } catch (err) {
      setError(
        err.message || "Unable to load your proposed projects."
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

    const matchesSearch =
      (project.title || "").toLowerCase().includes(search) ||
      (project.domain || "").toLowerCase().includes(search) ||
      (project.description || "").toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      project.visibilityStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <section className="teacher-proposed-projects">
      <div className="proposed-projects-header">
        <div>
          <h1>My Proposed Projects</h1>
          <p>
            View the projects you have uploaded and their current visibility.
          </p>
        </div>

        <div className="proposed-projects-count">
          <span>Total Projects</span>
          <strong>{projects.length}</strong>
        </div>
      </div>

      <div className="proposed-projects-toolbar">
        <input
          type="text"
          placeholder="Search by project title or domain..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search proposed projects"
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter projects by visibility status"
        >
          <option value="All">All Visibility Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="ALLOCATED">Allocated</option>
        </select>
      </div>

      {loading ? (
        <div className="proposed-projects-message" role="status">
          Loading your proposed projects...
        </div>
      ) : error ? (
        <div className="proposed-projects-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={loadProjects}>
            Retry
          </button>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="proposed-projects-grid">
          {filteredProjects.map((project) => (
            <article
              className="proposed-project-card"
              key={project._id}
            >
              <div className="proposed-project-card-header">
                <span className="proposed-project-domain">
                  {project.domain || "General"}
                </span>

                <span
                  className={`proposed-project-status status-${(
                    project.visibilityStatus || "unknown"
                  ).toLowerCase()}`}
                >
                  {formatStatus(project.visibilityStatus)}
                </span>
              </div>

              <h2>{project.title || "Untitled Project"}</h2>

              <p className="proposed-project-description">
                {project.description || "No description provided."}
              </p>

              {Array.isArray(project.technologies) &&
                project.technologies.length > 0 && (
                  <div className="proposed-project-technologies">
                    {project.technologies.map((technology, index) => (
                      <span key={`${technology}-${index}`}>
                        {technology}
                      </span>
                    ))}
                  </div>
                )}

              {Array.isArray(project.specificFunctionalities) &&
                project.specificFunctionalities.length > 0 && (
                  <div className="proposed-project-details">
                    <h3>Key Functionalities</h3>
                    <ul>
                      {project.specificFunctionalities.map(
                        (functionality, index) => (
                          <li key={`${functionality}-${index}`}>
                            {functionality}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {Array.isArray(project.sdgGoals) &&
                project.sdgGoals.length > 0 && (
                  <div className="proposed-project-details">
                    <h3>SDG Goals</h3>
                    <p>{project.sdgGoals.join(", ")}</p>
                  </div>
                )}

              <div className="proposed-project-meta">
                <div>
                  <span>Maximum Team Size</span>
                  <strong>
                    {project.maxTeamSize ?? "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>Created On</span>
                  <strong>{formatDate(project.createdAt)}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="proposed-projects-empty">
          <h2>
            {projects.length === 0
              ? "No proposed projects yet"
              : "No projects found"}
          </h2>
          <p>
            {projects.length === 0
              ? "Projects you upload will appear here."
              : "Try changing your search or visibility filter."}
          </p>
        </div>
      )}
    </section>
  );
}

export default TeacherProposedProjects;