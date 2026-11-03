
import { useEffect, useState } from "react";
import "./TeacherMentoringRequests.css";

import {
  getProposedProjectMentoringRequests,
  getAssignedMentoringRequests,
  updateProposedProjectMentoringDecision,
  updateAssignedMentoringDecision,
} from "../../services/teacherMentoringRequestsService";

// Convert backend status values into readable UI labels.
const formatStatus = (status) => {
  const statusLabels = {
    FACULTY_REVIEW: "Pending",
    MENTOR_REVIEW: "Pending",
    ADMIN_FINAL_REVIEW: "Under Admin Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  return (
    statusLabels[status] ||
    (status || "Unknown").replaceAll("_", " ")
  );
};

// Format backend date into the existing UI date format.
const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Get the latest comment from approval history.
const getLatestSuggestion = (request) => {
  const history = request.approvalHistory || [];

  if (history.length > 0) {
    return history[history.length - 1].comment || "";
  }

  return request.rejectionReason || "";
};

// Convert backend application into the format used by the existing UI.
const mapApplication = (application, category) => {
  const project = application.projectId || {};
  const student = application.studentId || {};
  const team = application.teamId || {};

  const leader = team.leaderId || {};

  const members = Array.isArray(team.memberIds)
    ? team.memberIds.length
    : 0;

  const isFacultyProject = category === "proposedProjects";

  return {
    id: application._id,
    projectTitle: project.title || "Untitled Project",

    projectType: isFacultyProject
      ? "Faculty Proposed Project"
      : project.source === "PROJECT_BANK"
        ? "Project Bank"
        : "Student Idea",

    studentName: student.name || leader.name || "—",

    teamName: team.name || "—",

    members: (team.leaderId ? 1 : 0) + members,

    submittedOn: formatDate(application.submittedAt),

    description: project.description || "No description available.",

    status: formatStatus(application.status),

    backendStatus: application.status,

    suggestion: getLatestSuggestion(application),

    category,
  };
};

function TeacherMentoringRequests() {
  const [requests, setRequests] = useState({
    proposedProjects: [],
    studentIdeas: [],
  });

  const [activeCategory, setActiveCategory] = useState("proposedProjects");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch both categories when the page loads.
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [facultyApplications, mentoringApplications] =
          await Promise.all([
            getProposedProjectMentoringRequests(),
            getAssignedMentoringRequests(),
          ]);

        setRequests({
          proposedProjects: facultyApplications.map((application) =>
            mapApplication(application, "proposedProjects")
          ),

          studentIdeas: mentoringApplications.map((application) =>
            mapApplication(application, "studentIdeas")
          ),
        });
      } catch (err) {
        setLoadError(
          err.message || "Unable to load mentoring requests."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const allRequests = Object.values(requests).flat();

  const pendingCount = allRequests.filter(
    (request) => request.status === "Pending"
  ).length;

  const updateDecision = (requestId, category, newStatus) => {
    setSelectedRequest({ id: requestId, category });
    setDecision(newStatus);
    setSuggestion("");
    setError("");
  };

  // Submit the decision to the appropriate backend API.
  const handleDecisionSubmit = async (event) => {
    event.preventDefault();

    if (!suggestion.trim()) {
      setError("Please enter a suggestion before submitting your decision.");
      return;
    }

    if (!selectedRequest || submitting) return;

    try {
      setSubmitting(true);
      setError("");

      const approved = decision === "Accepted";

      const updateFunction =
        selectedRequest.category === "proposedProjects"
          ? updateProposedProjectMentoringDecision
          : updateAssignedMentoringDecision;

      const response = await updateFunction(
        selectedRequest.id,
        approved,
        suggestion.trim()
      );

      const returnedStatus =
        response?.status ||
        response?.data?.status ||
        response?.application?.status;

      const updatedStatus = returnedStatus
        ? formatStatus(returnedStatus)
        : approved
          ? "Under Admin Review"
          : "Rejected";

      // Update the UI only after successful backend response.
      setRequests((previousRequests) => ({
        ...previousRequests,

        [selectedRequest.category]: previousRequests[
          selectedRequest.category
        ].map((request) =>
          request.id === selectedRequest.id
            ? {
                ...request,
                status: updatedStatus,
                backendStatus: returnedStatus || request.backendStatus,
                suggestion: suggestion.trim(),
              }
            : request
        ),
      }));

      closeDialog();
    } catch (err) {
      setError(
        err.message || "Unable to submit your decision. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeDialog = () => {
    if (submitting) return;

    setSelectedRequest(null);
    setDecision("");
    setSuggestion("");
    setError("");
  };

  const currentRequests = requests[activeCategory];

  return (
    <main className="mentoring-requests-page">
      <header className="mentoring-requests-header">
        <div>
          <h1>Mentoring Requests</h1>
          <p>
            Review project mentoring requests and provide your decision
            with suggestions for the students.
          </p>
        </div>

        <div className="mentoring-pending-summary">
          <span className="pending-summary-number">{pendingCount}</span>
          <span>Pending Requests</span>
        </div>
      </header>

      <section className="mentoring-category-tabs">
        <button
          type="button"
          className={
            activeCategory === "proposedProjects" ? "active" : ""
          }
          onClick={() => setActiveCategory("proposedProjects")}
        >
          <span>My Proposed Projects</span>
          <span className="category-count">
            {requests.proposedProjects.length}
          </span>
        </button>

        <button
          type="button"
          className={
            activeCategory === "studentIdeas" ? "active" : ""
          }
          onClick={() => setActiveCategory("studentIdeas")}
        >
          <span>Student Ideas / Project Bank</span>
          <span className="category-count">
            {requests.studentIdeas.length}
          </span>
        </button>
      </section>

      <section className="mentoring-requests-list">
        <div className="requests-section-header">
          <div>
            <h2>
              {activeCategory === "proposedProjects"
                ? "Requests for My Proposed Projects"
                : "Requests for Student Ideas / Project Bank"}
            </h2>

            <p>
              {currentRequests.length} request
              {currentRequests.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mentoring-empty-state">
            <p>Loading mentoring requests...</p>
          </div>
        ) : loadError ? (
          <div className="mentoring-empty-state">
            <h3>Unable to load requests</h3>
            <p>{loadError}</p>
          </div>
        ) : currentRequests.length === 0 ? (
          <div className="mentoring-empty-state">
            <h3>No mentoring requests</h3>
            <p>
              There are currently no requests in this category.
            </p>
          </div>
        ) : (
          <div className="mentoring-request-cards">
            {currentRequests.map((request) => (
              <article className="mentoring-request-card" key={request.id}>
                <div className="request-card-top">
                  <span className="request-project-type">
                    {request.projectType}
                  </span>

                  <span
                    className={`request-status status-${request.status
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {request.status}
                  </span>
                </div>

                <h3>{request.projectTitle}</h3>

                <p className="request-description">
                  {request.description}
                </p>

                <div className="request-details-grid">
                  <div>
                    <span className="detail-label">Student / Team Lead</span>
                    <span className="detail-value">
                      {request.studentName}
                    </span>
                  </div>

                  <div>
                    <span className="detail-label">Team Name</span>
                    <span className="detail-value">
                      {request.teamName}
                    </span>
                  </div>

                  <div>
                    <span className="detail-label">Team Members</span>
                    <span className="detail-value">
                      {request.members || "—"}
                    </span>
                  </div>

                  <div>
                    <span className="detail-label">Submitted On</span>
                    <span className="detail-value">
                      {request.submittedOn}
                    </span>
                  </div>
                </div>

                {request.suggestion && (
                  <div className="request-suggestion-display">
                    <strong>Your suggestion</strong>
                    <p>{request.suggestion}</p>
                  </div>
                )}

                {request.status === "Pending" ? (
                  <div className="request-actions">
                    <button
                      type="button"
                      className="request-accept-button"
                      onClick={() =>
                        updateDecision(
                          request.id,
                          activeCategory,
                          "Accepted"
                        )
                      }
                    >
                      Accept Request
                    </button>

                    <button
                      type="button"
                      className="request-reject-button"
                      onClick={() =>
                        updateDecision(
                          request.id,
                          activeCategory,
                          "Rejected"
                        )
                      }
                    >
                      Reject Request
                    </button>
                  </div>
                ) : (
                  <div className="request-decision-message">
                    Decision recorded: {request.status}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedRequest && (
        <div
          className="decision-dialog-overlay"
          onClick={closeDialog}
        >
          <section
            className="decision-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="decision-dialog-close"
              aria-label="Close dialog"
              onClick={closeDialog}
              disabled={submitting}
            >
              &times;
            </button>

            <h2 id="decision-dialog-title">
              {decision} Mentoring Request
            </h2>

            <p>
              Add your suggestion or feedback for the student/team
              before confirming your decision.
            </p>

            <form onSubmit={handleDecisionSubmit}>
              <label htmlFor="teacher-suggestion">
                Teacher Suggestion <span>*</span>
              </label>

              <textarea
                id="teacher-suggestion"
                value={suggestion}
                onChange={(event) => {
                  setSuggestion(event.target.value);
                  setError("");
                }}
                placeholder="Enter your suggestion or feedback..."
                rows={5}
                maxLength={1000}
                required
                disabled={submitting}
              />

              <div className="suggestion-character-count">
                {suggestion.length}/1000 characters
              </div>

              {error && (
                <p className="decision-form-error">{error}</p>
              )}

              <div className="decision-dialog-actions">
                <button
                  type="button"
                  className="decision-cancel-button"
                  onClick={closeDialog}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    decision === "Accepted"
                      ? "request-accept-button"
                      : "request-reject-button"
                  }
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : `Confirm ${decision}`}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default TeacherMentoringRequests;
