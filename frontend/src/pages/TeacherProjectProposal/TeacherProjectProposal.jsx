import { useState } from "react";
import "./TeacherProjectProposal.css";

const sdgOptions = [
  { value: "1", label: "SDG 1 - No Poverty" },
  { value: "2", label: "SDG 2 - Zero Hunger" },
  { value: "3", label: "SDG 3 - Good Health and Well-being" },
  { value: "4", label: "SDG 4 - Quality Education" },
  { value: "5", label: "SDG 5 - Gender Equality" },
  { value: "6", label: "SDG 6 - Clean Water and Sanitation" },
  { value: "7", label: "SDG 7 - Affordable and Clean Energy" },
  { value: "8", label: "SDG 8 - Decent Work and Economic Growth" },
  { value: "9", label: "SDG 9 - Industry, Innovation and Infrastructure" },
  { value: "10", label: "SDG 10 - Reduced Inequalities" },
  { value: "11", label: "SDG 11 - Sustainable Cities and Communities" },
  { value: "12", label: "SDG 12 - Responsible Consumption and Production" },
  { value: "13", label: "SDG 13 - Climate Action" },
  { value: "14", label: "SDG 14 - Life Below Water" },
  { value: "15", label: "SDG 15 - Life on Land" },
  {
    value: "16",
    label: "SDG 16 - Peace, Justice and Strong Institutions",
  },
  { value: "17", label: "SDG 17 - Partnerships for the Goals" },
];

function TeacherProjectProposal() {
  const [formData, setFormData] = useState({
    projectTitle: "",
    projectDescription: "",
    specificFunctionality: "",
    technology: "",
    sdg: [],
  });

  const [message, setMessage] = useState("");
  const [isSdgDropdownOpen, setIsSdgDropdownOpen] = useState(false);

  const handleChange = (event) => {
    const { id, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [id]: value,
    }));
  };

  const addSdg = (value) => {
    setFormData((previousData) => ({
      ...previousData,
      sdg: [...previousData.sdg, value],
    }));

    setIsSdgDropdownOpen(false);
    setMessage("");
  };

  const removeSdg = (value) => {
    setFormData((previousData) => ({
      ...previousData,
      sdg: previousData.sdg.filter((goal) => goal !== value),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !formData.projectTitle ||
      !formData.projectDescription ||
      !formData.specificFunctionality ||
      !formData.technology ||
      formData.sdg.length === 0
    ) {
      setMessage("Please fill in all the fields.");
      return;
    }

    console.log("Project Proposal:", formData);

    setMessage("Project proposal submitted successfully.");
  };

  return (
    <div className="teacher-proposal-page">
      <div className="teacher-proposal-header">
        <h1>Build Project Proposal</h1>

        <p>
          Create a project proposal for students to work on during their
          final year project.
        </p>
      </div>

      <div className="teacher-proposal-card">
        <form onSubmit={handleSubmit}>
          {/* Project Title */}
          <div className="form-group">
            <label htmlFor="projectTitle">Project Title</label>

            <input
              type="text"
              id="projectTitle"
              value={formData.projectTitle}
              onChange={handleChange}
              placeholder="Enter project title"
            />
          </div>

          {/* Project Description */}
          <div className="form-group">
            <label htmlFor="projectDescription">
              Project Description
            </label>

            <textarea
              id="projectDescription"
              rows="5"
              value={formData.projectDescription}
              onChange={handleChange}
              placeholder="Describe the project and its objective"
            />
          </div>

          {/* Specific Functionality */}
          <div className="form-group">
            <label htmlFor="specificFunctionality">
              Specific Functionality
            </label>

            <textarea
              id="specificFunctionality"
              rows="5"
              value={formData.specificFunctionality}
              onChange={handleChange}
              placeholder="Describe the specific functionality expected in the project"
            />
          </div>

          {/* Technology */}
          <div className="form-group">
            <label htmlFor="technology">
              Technology to be Used
            </label>

            <input
              type="text"
              id="technology"
              value={formData.technology}
              onChange={handleChange}
              placeholder="e.g. React, Node.js, MongoDB"
            />
          </div>

          {/* SDG */}
          <div className="form-group">
            <label>UN Sustainable Development Goals</label>

            <div className="sdg-selector">
              <button
                type="button"
                className="sdg-selector-header"
                onClick={() =>
                  setIsSdgDropdownOpen(!isSdgDropdownOpen)
                }
              >
                <span>
                  {formData.sdg.length === 0
                    ? "Add SDG Goal"
                    : `${formData.sdg.length} SDG${
                        formData.sdg.length > 1 ? "s" : ""
                      } added`}
                </span>

                <span className="sdg-dropdown-icon">
                  +
                </span>
              </button>

              {isSdgDropdownOpen && (
                <div className="sdg-dropdown">
                  {sdgOptions
                    .filter(
                      (option) =>
                        !formData.sdg.includes(option.value)
                    )
                    .map((option) => (
                      <button
                        type="button"
                        className="sdg-dropdown-option"
                        key={option.value}
                        onClick={() => addSdg(option.value)}
                      >
                        {option.label}
                      </button>
                    ))}

                  {formData.sdg.length === sdgOptions.length && (
                    <p className="sdg-all-selected">
                      All SDG goals have been added.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Selected SDG Tags */}
            {formData.sdg.length > 0 && (
              <div className="sdg-selected-list">
                {formData.sdg.map((value) => {
                  const selectedGoal = sdgOptions.find(
                    (option) => option.value === value
                  );

                  return (
                    <div className="sdg-tag" key={value}>
                      <span>{selectedGoal.label}</span>

                      <button
                        type="button"
                        onClick={() => removeSdg(value)}
                        aria-label={`Remove ${selectedGoal.label}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <p className="proposal-message">
              {message}
            </p>
          )}

          {/* Submit */}
          <div className="proposal-actions">
            <button
              type="submit"
              className="submit-proposal-btn"
            >
              Submit Proposal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeacherProjectProposal;