
import { useState } from "react";
import "./TeacherMentoringRequests.css";

const initialRequests = {
  proposedProjects: [
    {
      id: 1,
      projectTitle: "AI-Based Student Performance Prediction",
      projectType: "Faculty Proposed Project",
      studentName: "Rahul Sharma",
      teamName: "Team Innovators",
      members: 3,
      submittedOn: "24 Oct 2026",
      description:
        "A machine learning system to analyze student performance and identify students who may need academic support.",
      status: "Pending",
      suggestion: "",
    },
    {
      id: 2,
      projectTitle: "Smart Campus Navigation",
      projectType: "Faculty Proposed Project",
      studentName: "Priya Singh",
      teamName: "Tech Explorers",
      members: 4,
      submittedOn: "25 Oct 2026",
      description:
        "A web application that helps students navigate campus buildings and locate important facilities.",
      status: "Pending",
      suggestion: "",
    },
  ],

  studentIdeas: [
    {
      id: 3,
      projectTitle: "AI-Powered Career Guidance",
      projectType: "Student Idea",
      studentName: "Aman Verma",
      teamName: "Future Builders",
      members: 3,
      submittedOn: "26 Oct 2026",
      description:
        "A platform that recommends career paths based on a student's skills, interests, and academic background.",
      status: "Pending",
      suggestion: "",
    },
    {
      id: 4,
      projectTitle: "College Event Management Portal",
      projectType: "Project Bank",
      studentName: "Neha Agarwal",
      teamName: "Code Crafters",
      members: 4,
      submittedOn: "27 Oct 2026",
      description:
        "A centralized platform for managing college events, registrations, and event-related announcements.",
      status: "Pending",
      suggestion: "",
    },
  ],
};

function TeacherMentoringRequests() {
  const [requests, setRequests] = useState(initialRequests);
  const [activeCategory, setActiveCategory] = useState("proposedProjects");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decision, setDecision] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

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

  const handleDecisionSubmit = (event) => {
    event.preventDefault();

    if (!suggestion.trim()) {
      setError("Please enter a suggestion before submitting your decision.");
      return;
    }

    setRequests((previousRequests) => ({
      ...previousRequests,
      [selectedRequest.category]: previousRequests[
        selectedRequest.category
      ].map((request) =>
        request.id === selectedRequest.id
          ? {
              ...request,
              status: decision,
              suggestion: suggestion.trim(),
            }
          : request
      ),
    }));

    setSelectedRequest(null);
    setDecision("");
    setSuggestion("");
    setError("");
  };

  const closeDialog = () => {
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

        {currentRequests.length === 0 ? (
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
                    className={`request-status status-${request.status.toLowerCase()}`}
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
                      {request.members}
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
                >
                  Confirm {decision}
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
