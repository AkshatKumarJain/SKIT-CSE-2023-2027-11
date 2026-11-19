
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProjectBankProject } from '../../services/adminProjectService'
import './Adminaddproject.css'

const DOMAIN_SUGGESTIONS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Cloud Computing',
  'Cyber Security',
  'IoT',
  'Data Science',
  'Mobile Application Development'
]

const SDG_GOALS = [
  '1. No Poverty',
  '2. Zero Hunger',
  '3. Good Health and Well-being',
  '4. Quality Education',
  '5. Gender Equality',
  '6. Clean Water and Sanitation',
  '7. Affordable and Clean Energy',
  '8. Decent Work and Economic Growth',
  '9. Industry, Innovation and Infrastructure',
  '10. Reduced Inequalities',
  '11. Sustainable Cities and Communities',
  '12. Responsible Consumption and Production',
  '13. Climate Action',
  '14. Life Below Water',
  '15. Life on Land',
  '16. Peace, Justice and Strong Institutions',
  '17. Partnerships for the Goals'
]

const EMPTY_FORM = {
  title: '',
  domain: '',
  description: '',
  specificFunctionalities: '',
  technologies: ''
}

function splitLines(value) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitCommas(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function AdminAddProject() {
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [sdgGoals, setSdgGoals] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [createdTitle, setCreatedTitle] = useState('')

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleSdgGoal(goal) {
    setSdgGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((item) => item !== goal)
        : [...prev, goal]
    )
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setSdgGoals([])
    setSubmitError('')
    setCreatedTitle('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitError('')

    setSubmitting(true)

    try {
      await createProjectBankProject({
        title: form.title.trim(),
        domain: form.domain.trim(),
        description: form.description.trim(),
        specificFunctionalities: splitLines(
          form.specificFunctionalities
        ),
        technologies: splitCommas(form.technologies),
        sdgGoals
      })

      setCreatedTitle(form.title.trim())
    } catch (error) {
      setSubmitError(error.message || 'Could not add this project')
    } finally {
      setSubmitting(false)
    }
  }

  if (createdTitle) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Add Project</h1>
        </div>

        <div className="submission-result">
          <div className="submission-result-icon">✓</div>

          <div className="submission-result-title">
            Project added to the Project Bank
          </div>

          <p className="submission-result-text">
            "{createdTitle}" is now available for students to select in the
            Project Bank.
          </p>

          <div className="form-footer-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Add Another Project
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/admin/project-bank')}
            >
              Back to Project Bank
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-heading">Add Project</h1>

            <p className="page-subtext">
              Add a single project to the Project Bank. Students will see it
              in their Project Bank as soon as it is saved.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin/project-bank')}
          >
            Back to Project Bank
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Section 1: Project Information */}
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">1</div>

            <div className="form-section-titles">
              <span className="form-section-title">
                Project Information
              </span>

              <span className="form-section-subtitle">
                Describe the project students will be able to pick
              </span>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="title">
              Project Title
            </label>

            <input
              id="title"
              className="field-input"
              placeholder="e.g. AI Based Attendance System"
              value={form.title}
              onChange={(event) =>
                updateField('title', event.target.value)
              }
              required
            />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="domain">
              Domain
            </label>

            <input
              id="domain"
              className="field-input"
              list="domain-options"
              placeholder="Select or type a domain"
              value={form.domain}
              onChange={(event) =>
                updateField('domain', event.target.value)
              }
              required
            />

            <datalist id="domain-options">
              {DOMAIN_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="description">
              Description (Scope &amp; Objective)
            </label>

            <textarea
              id="description"
              className="field-textarea"
              placeholder="Describe the project, including its scope and objectives"
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
              required
            />
          </div>

          <div className="field-group">
            <label
              className="field-label"
              htmlFor="specificFunctionalities"
            >
              Specific Functionalities
            </label>

            <textarea
              id="specificFunctionalities"
              className="field-textarea"
              placeholder="List the specific features the project will have"
              value={form.specificFunctionalities}
              onChange={(event) =>
                updateField(
                  'specificFunctionalities',
                  event.target.value
                )
              }
              required
            />

            <p className="field-hint">
              Separate each functionality with a new line
            </p>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="technologies">
              Technologies to be Used
            </label>

            <textarea
              id="technologies"
              className="field-textarea"
              placeholder="e.g. React, Node.js, MongoDB"
              value={form.technologies}
              onChange={(event) =>
                updateField('technologies', event.target.value)
              }
              required
            />

            <p className="field-hint">
              Separate each technology with a comma
            </p>
          </div>

          <div className="field-group">
            <label className="field-label">
              Aligned SDG Goal
            </label>

            <div className="tech-tag-list">
              {SDG_GOALS.map((goal) => (
                <button
                  type="button"
                  key={goal}
                  className={
                    sdgGoals.includes(goal)
                      ? 'sdg-option selected'
                      : 'sdg-option'
                  }
                  onClick={() => toggleSdgGoal(goal)}
                >
                  {goal}
                </button>
              ))}
            </div>

            <p className="field-hint">
              Select one or more UN Sustainable Development Goals this
              project supports
            </p>
          </div>
        </div>

        {/* Section 2: Submission */}
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">2</div>

            <div className="form-section-titles">
              <span className="form-section-title">
                Submission
              </span>

              <span className="form-section-subtitle">
                Save the project to the Project Bank
              </span>
            </div>
          </div>

          {submitError ? (
            <div className="form-error">{submitError}</div>
          ) : null}

          <div className="form-footer">
            <p className="section-subtext">
              No faculty assignment is required when adding a project.
              The project is visible to students as soon as it is added.
            </p>

            <div className="form-footer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={() => navigate('/admin/project-bank')}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Adding...' : 'Add to Project Bank'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AdminAddProject
