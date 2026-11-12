import { useRef, useState } from "react";
import "./StudentPPTSubmission.css";

/*
 * TEMPORARY MOCK DATA
 * Replace these values with backend API responses later.
 */

const MOCK_PPT_CONFIG = {
  isSubmissionEnabled: true,
  templateName: null,
  templateUrl: null,
  deadline: null,
};

const MOCK_STUDENT_DATA = {
  isProjectAllocated: true,
  isTeamLeader: true,

  projectTitle: "Smart Campus Management System",
  teamId: "TEAM-001",
  leaderName: "Aditya Virmani",
};

function StudentPPTSubmission() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [submittedFile, setSubmittedFile] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef(null);

  // Show the page only when both conditions are satisfied.
  const canAccessPPT =
    MOCK_PPT_CONFIG.isSubmissionEnabled &&
    MOCK_STUDENT_DATA.isProjectAllocated;

  if (!canAccessPPT) {
    return null;
  }

  // Validate selected PPT file.
  const validateFile = (file) => {
    if (!file) return false;

    const fileExtension = file.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!["ppt", "pptx"].includes(fileExtension)) {
      setError("Please select a valid PowerPoint file (.ppt or .pptx).");
      return false;
    }

    setError("");
    setSuccessMessage("");
    setSelectedFile(file);

    return true;
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      validateFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /*
   * DEMO ONLY
   * This stores the selected file in React state.
   * No actual server upload takes place.
   */

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select your presentation first.");
      return;
    }

    if (!MOCK_STUDENT_DATA.isTeamLeader) {
      setError("Only the team leader can submit the presentation.");
      return;
    }

    setSubmittedFile({
      name: selectedFile.name,
      size: selectedFile.size,
      file: selectedFile,
      submittedAt: new Date().toLocaleString(),
    });

    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setSuccessMessage(
      "Demo submission completed locally. The file has not been uploaded to the server."
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownloadSubmittedFile = () => {
    if (!submittedFile?.file) return;

    const fileUrl = URL.createObjectURL(submittedFile.file);

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = submittedFile.name;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(fileUrl);
  };

  return (
    <section className="student-ppt-page">

      {/* Page Header */}
      <div className="ppt-page-header">
        <div>
          <h1>Project PPT Submission</h1>
          <p>
            Download the prescribed presentation format and submit
            your team's final project presentation.
          </p>
        </div>

        <span
          className={`ppt-status-badge ${
            submittedFile ? "ppt-submitted" : "ppt-pending"
          }`}
        >
          {submittedFile ? "Submitted" : "Not Submitted"}
        </span>
      </div>

      {/* Project Information */}
      <div className="ppt-card">
        <div className="ppt-card-heading">
          <div className="ppt-heading-icon">
            <span>01</span>
          </div>

          <div>
            <h2>Project Information</h2>
            <p>Your allocated project and team details</p>
          </div>
        </div>

        <div className="ppt-project-details">
          <div className="ppt-detail-item">
            <span>Project Title</span>
            <strong>{MOCK_STUDENT_DATA.projectTitle}</strong>
          </div>

          <div className="ppt-detail-item">
            <span>Team ID</span>
            <strong>{MOCK_STUDENT_DATA.teamId}</strong>
          </div>

          <div className="ppt-detail-item">
            <span>Team Leader</span>
            <strong>{MOCK_STUDENT_DATA.leaderName}</strong>
          </div>
        </div>
      </div>

      {/* Admin Provided Template */}
      <div className="ppt-card">
        <div className="ppt-card-heading">
          <div className="ppt-heading-icon">
            <span>02</span>
          </div>

          <div>
            <h2>Presentation Format</h2>
            <p>
              Download the PPT format provided by the administrator
            </p>
          </div>
        </div>

        <div className="ppt-template-content">
          <div className="ppt-file-icon">
            <span>PPT</span>
          </div>

          <div className="ppt-file-info">
            <strong>
              {MOCK_PPT_CONFIG.templateName || "Official PPT Template"}
            </strong>

            <span>
              {MOCK_PPT_CONFIG.templateUrl
                ? "Admin-provided presentation format"
                : "Template will be available after admin uploads it"}
            </span>
          </div>

          {MOCK_PPT_CONFIG.templateUrl ? (
            <a
              href={MOCK_PPT_CONFIG.templateUrl}
              className="ppt-download-button"
              download
            >
              ↓ Download
            </a>
          ) : (
            <button
              className="ppt-download-button ppt-button-disabled"
              disabled
              title="Admin has not uploaded the template yet"
            >
              ↓ Download
            </button>
          )}
        </div>

        <div className="ppt-info-message">
          <span className="ppt-info-icon">i</span>

          <p>
            All team members can view and download the presentation
            format. Please follow the prescribed format while preparing
            your project presentation.
          </p>
        </div>
      </div>

      {/* PPT Submission */}
      <div className="ppt-card">
        <div className="ppt-card-heading">
          <div className="ppt-heading-icon">
            <span>03</span>
          </div>

          <div>
            <h2>Submit Your Presentation</h2>
            <p>
              Upload the final presentation on behalf of your team
            </p>
          </div>
        </div>

        {/* Submission Deadline */}
        <div className="ppt-deadline">
          <div className="ppt-deadline-icon">◷</div>

          <div>
            <strong>Submission Deadline</strong>

            <span>
              {MOCK_PPT_CONFIG.deadline || "To be announced by admin"}
            </span>
          </div>
        </div>

        {/* Submitted State */}
        {submittedFile ? (
          <div className="ppt-submission-result">
            <div className="ppt-result-header">
              <div className="ppt-success-icon">✓</div>

              <div>
                <h3>Presentation Submitted</h3>
                <p>
                  Your team's presentation has been recorded in this demo.
                </p>
              </div>
            </div>

            <div className="ppt-uploaded-file">
              <div className="ppt-file-icon">
                <span>PPT</span>
              </div>

              <div className="ppt-file-info">
                <strong>{submittedFile.name}</strong>

                <span>
                  {formatFileSize(submittedFile.size)}
                </span>
              </div>

              <button
                className="ppt-download-button"
                onClick={handleDownloadSubmittedFile}
                type="button"
              >
                ↓ Download
              </button>
            </div>

            <div className="ppt-submission-date">
              <strong>Submission Date:</strong>
              <span>{submittedFile.submittedAt}</span>
            </div>

            <div className="ppt-info-message">
              <span className="ppt-info-icon">i</span>

              <p>
                All team members can view and download the submitted
                presentation and check its submission status.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Team Leader Upload Section */}
            {MOCK_STUDENT_DATA.isTeamLeader ? (
              <form onSubmit={handleSubmit}>

                <div className="ppt-upload-permission">
                  <span>✓</span>

                  You are the team leader. You can submit the
                  presentation on behalf of your team.
                </div>

                <div
                  className="ppt-upload-area"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();

                    const file = event.dataTransfer.files?.[0];

                    if (file) {
                      validateFile(file);
                    }
                  }}
                >
                  <div className="ppt-upload-icon">
                    <span>↑</span>
                  </div>

                  <h3>Upload Your Project Presentation</h3>

                  <p>
                    Drag and drop your PPT file here or{" "}
                    <strong>browse files</strong>
                  </p>

                  <span className="ppt-file-restriction">
                    Accepted formats: .ppt, .pptx
                  </span>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".ppt,.pptx"
                    onChange={handleFileChange}
                    hidden
                  />
                </div>

                {/* Selected File */}
                {selectedFile && (
                  <div className="ppt-selected-file">
                    <div className="ppt-file-icon">
                      <span>PPT</span>
                    </div>

                    <div className="ppt-file-info">
                      <strong>{selectedFile.name}</strong>

                      <span>
                        {formatFileSize(selectedFile.size)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="ppt-remove-button"
                      onClick={handleRemoveFile}
                      aria-label="Remove selected file"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="ppt-error-message">
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="ppt-success-message">
                    {successMessage}
                  </div>
                )}

                <div className="ppt-submit-actions">
                  <button
                    type="submit"
                    className="ppt-submit-button"
                    disabled={!selectedFile}
                  >
                    Submit Presentation
                  </button>
                </div>

                <p className="ppt-demo-note">
                  Demo mode: Submission is stored only in the current
                  browser session. Server upload will be implemented
                  after backend integration.
                </p>

              </form>
            ) : (
              /* Other Team Members */
              <div className="ppt-member-notice">
                <div className="ppt-info-icon">i</div>

                <div>
                  <strong>Waiting for Team Leader</strong>

                  <p>
                    Only your team leader can upload the presentation.
                    You can view the submission status here.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </section>
  );
}

export default StudentPPTSubmission;