
import { useRef, useState } from "react";
import "./StudentForm1Submission.css";

// TEMPORARY MOCK DATA - Replace with backend API responses later.
const MOCK_FORM_CONFIG = {
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

function StudentForm1Submission() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [submittedFile, setSubmittedFile] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef(null);

  const canAccessForm =
    MOCK_FORM_CONFIG.isSubmissionEnabled &&
    MOCK_STUDENT_DATA.isProjectAllocated;

  if (!canAccessForm) return null;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const validateFile = (file) => {
    if (!file) return false;

    const isPdf =
      file.name.toLowerCase().endsWith(".pdf") &&
      (file.type === "application/pdf" || file.type === "");

    if (!isPdf) {
      setError("Please select a valid PDF file (.pdf).");
      return false;
    }

    setError("");
    setSuccessMessage("");
    setSelectedFile(file);
    return true;
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) validateFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select your completed Form 1 PDF first.");
      return;
    }

    if (!MOCK_STUDENT_DATA.isTeamLeader) {
      setError("Only the team leader can submit Form 1.");
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
    <section className="student-form1-page">

      {/* Page Header */}
      <div className="form1-page-header">
        <div>
          <h1>Form 1 Submission</h1>
          <p>
            Download the prescribed Form 1 document, complete it
            and submit the PDF on behalf of your team.
          </p>
        </div>

        <span
          className={`form1-status-badge ${
            submittedFile ? "form1-submitted" : "form1-pending"
          }`}
        >
          {submittedFile ? "Submitted" : "Not Submitted"}
        </span>
      </div>

      {/* Project Information */}
      <div className="form1-card">
        <div className="form1-card-heading">
          <div className="form1-heading-icon">01</div>
          <div>
            <h2>Project Information</h2>
            <p>Your allocated project and team details</p>
          </div>
        </div>

        <div className="form1-project-details">
          <div className="form1-detail-item">
            <span>Project Title</span>
            <strong>{MOCK_STUDENT_DATA.projectTitle}</strong>
          </div>

          <div className="form1-detail-item">
            <span>Team ID</span>
            <strong>{MOCK_STUDENT_DATA.teamId}</strong>
          </div>

          <div className="form1-detail-item">
            <span>Team Leader</span>
            <strong>{MOCK_STUDENT_DATA.leaderName}</strong>
          </div>
        </div>
      </div>

      {/* Form 1 Template */}
      <div className="form1-card">
        <div className="form1-card-heading">
          <div className="form1-heading-icon">02</div>
          <div>
            <h2>Form 1 Format</h2>
            <p>Download the official Form 1 provided by the administrator</p>
          </div>
        </div>

        <div className="form1-template-content">
          <div className="form1-file-icon">
            <span>PDF</span>
          </div>

          <div className="form1-file-info">
            <strong>
              {MOCK_FORM_CONFIG.templateName || "Official Form 1 Template"}
            </strong>

            <span>
              {MOCK_FORM_CONFIG.templateUrl
                ? "Admin-provided Form 1 document"
                : "Template will be available after admin uploads it"}
            </span>
          </div>

          {MOCK_FORM_CONFIG.templateUrl ? (
            <a
              href={MOCK_FORM_CONFIG.templateUrl}
              className="form1-download-button"
              download
            >
              ↓ Download
            </a>
          ) : (
            <button
              type="button"
              className="form1-download-button form1-button-disabled"
              disabled
              title="Admin has not uploaded the template yet"
            >
              ↓ Download
            </button>
          )}
        </div>

        <div className="form1-info-message">
          <span className="form1-info-icon">i</span>
          <p>
            Download the official Form 1, fill in all required details,
            obtain the necessary signatures and save the completed
            document as a PDF before uploading.
          </p>
        </div>
      </div>

      {/* Form 1 Submission */}
      <div className="form1-card">
        <div className="form1-card-heading">
          <div className="form1-heading-icon">03</div>
          <div>
            <h2>Submit Form 1</h2>
            <p>Upload the completed Form 1 on behalf of your team</p>
          </div>
        </div>

        <div className="form1-deadline">
          <div className="form1-deadline-icon">◷</div>
          <div>
            <strong>Submission Deadline</strong>
            <span>
              {MOCK_FORM_CONFIG.deadline || "To be announced by admin"}
            </span>
          </div>
        </div>

        {submittedFile ? (
          <div className="form1-submission-result">
            <div className="form1-result-header">
              <div className="form1-success-icon">✓</div>
              <div>
                <h3>Form 1 Submitted</h3>
                <p>
                  Your team's Form 1 has been recorded in this demo.
                </p>
              </div>
            </div>

            <div className="form1-uploaded-file">
              <div className="form1-file-icon">
                <span>PDF</span>
              </div>

              <div className="form1-file-info">
                <strong>{submittedFile.name}</strong>
                <span>{formatFileSize(submittedFile.size)}</span>
              </div>

              <button
                type="button"
                className="form1-download-button"
                onClick={handleDownloadSubmittedFile}
              >
                ↓ Download
              </button>
            </div>

            <div className="form1-submission-date">
              <strong>Submission Date:</strong>
              <span>{submittedFile.submittedAt}</span>
            </div>

            <div className="form1-success-message">
              {successMessage}
            </div>
          </div>
        ) : MOCK_STUDENT_DATA.isTeamLeader ? (
          <form onSubmit={handleSubmit}>
            <div className="form1-upload-permission">
              <span>✓</span>
              You are the team leader. You can submit Form 1 on behalf
              of your team.
            </div>

            <div
              className="form1-upload-area"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) validateFile(file);
              }}
            >
              <div className="form1-upload-icon">↑</div>
              <h3>Upload Your Completed Form 1</h3>
              <p>
                Drag and drop your PDF here or <strong>browse files</strong>
              </p>
              <span className="form1-file-restriction">
                Accepted format: PDF only (.pdf)
              </span>

              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                hidden
              />
            </div>

            {selectedFile && (
              <div className="form1-selected-file">
                <div className="form1-file-icon">
                  <span>PDF</span>
                </div>

                <div className="form1-file-info">
                  <strong>{selectedFile.name}</strong>
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>

                <button
                  type="button"
                  className="form1-remove-button"
                  onClick={handleRemoveFile}
                  aria-label="Remove selected file"
                >
                  ×
                </button>
              </div>
            )}

            {error && <div className="form1-error-message">{error}</div>}

            <div className="form1-submit-actions">
              <button
                type="submit"
                className="form1-submit-button"
                disabled={!selectedFile}
              >
                Submit Form 1
              </button>
            </div>

            <p className="form1-demo-note">
              Demo mode: Submission is stored only in the current browser
              session. Actual server upload will be implemented later.
            </p>
          </form>
        ) : (
          <div className="form1-member-notice">
            <div className="form1-info-icon">i</div>
            <div>
              <strong>Waiting for Team Leader</strong>
              <p>
                Only your team leader can upload Form 1. You can view
                the submission status here.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default StudentForm1Submission;
