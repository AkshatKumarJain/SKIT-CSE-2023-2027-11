import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Save, Send, Search, Check, Lock } from 'lucide-react'
import { getProjectSelectionStage } from '../../services/projectSelectionService'
import { getFacultyMembers } from '../../services/facultyService'
import { submitOwnIdea, applyFacultyProject, applyProjectBank } from '../../services/applicationService'
import { getMyTeam } from '../../services/teamService'
import { domains, sdgGoalOptions } from '../../data/mockData'
import '../Projectselection/Projectselection.css'

function initials(name) {
  return name.replace('Dr. ', '').replace('Prof. ', '').split(' ').map((part) => part[0]).join('')
}

function StageLocked({ title, status, windowLabel }) {
  const navigate = useNavigate()
  const message =
    status === 'UPCOMING'
      ? 'This stage has not opened yet. Check back once it becomes active.'
      : 'This stage is now closed and is no longer accepting submissions.'

  return (
    <div className="locked-state">
      <div className="locked-state-icon">
        <Lock size={22} strokeWidth={2} />
      </div>
      <div className="locked-state-title">{title} is {status === 'UPCOMING' ? 'not open yet' : 'closed'}</div>
      <p className="locked-state-text">{message}</p>
      {windowLabel ? <div className="stage-window">{windowLabel}</div> : null}
      <button type="button" className="btn btn-secondary" onClick={() => navigate('/project-selection')}>
        Back to Project Selection
      </button>
    </div>
  )
}

function MentorPicker({ selectedId, onSelect }) {
  const [facultyMembers, setFacultyMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let isMounted = true
    getFacultyMembers()
      .then((data) => {
        if (isMounted) setFacultyMembers(data)
      })
      .catch((err) => {
        if (isMounted) setError(err.message)
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return <div className="loading-state">Loading faculty mentors...</div>
  }

  if (error) {
    return <div className="form-error">Could not load mentors: {error}</div>
  }

  const filtered = facultyMembers.filter((faculty) => {
    const term = query.toLowerCase()
    return [faculty.name, faculty.email, faculty.specialization, faculty.department].some((value) =>
      (value || '').toLowerCase().includes(term)
    )
  })

  return (
    <div>
      <div className="search-control">
        <Search size={15} strokeWidth={2} />
        <input
          type="text"
          value={query}
          placeholder="Search mentors by name, email or department"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="mentor-list">
        {filtered.length ? (
          filtered.map((faculty) => {
            const isSelected = faculty.id === selectedId
            return (
              <button
                type="button"
                key={faculty.id}
                className={isSelected ? 'mentor-list-item selected' : 'mentor-list-item'}
                onClick={() => onSelect(faculty.id)}
              >
                <div className="mentor-list-avatar">{initials(faculty.name)}</div>
                <div className="mentor-list-info">
                  <div className="mentor-list-name">{faculty.name}</div>
                  <div className="mentor-list-dept">{faculty.department || faculty.email}</div>
                  {faculty.specialization ? (
                    <div className="mentor-list-spec">{faculty.specialization}</div>
                  ) : null}
                </div>
                {isSelected ? (
                  <div className="mentor-list-check">
                    <Check size={14} strokeWidth={2.5} />
                  </div>
                ) : null}
              </button>
            )
          })
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">No mentors found</div>
            <p className="empty-state-text">Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function buildInitialForm(project) {
  return {
    title: project?.title || '',
    domain: project?.domain || '',
    problemStatement: project?.problemStatement || '',
    description: project?.description || '',
    expectedOutcome: project?.expectedOutcome || '',
    technologies: Array.isArray(project?.technologies) ? project.technologies.join(', ') : ''
  }
}

function parseList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

// The window that must be open depends on where the student came from.
function stageIdFor(source) {
  if (source === 'faculty') return 'faculty-project'
  if (source === 'bank') return 'project-bank'
  return 'student-idea'
}

function StudentIdea() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillProject = location.state?.project || null
  const source = location.state?.source || null

  const [stage, setStage] = useState(null)
  const [stageLoading, setStageLoading] = useState(true)
  const [stageError, setStageError] = useState('')
  const [form, setForm] = useState(() => buildInitialForm(prefillProject))
  const [sdgGoals, setSdgGoals] = useState(prefillProject?.sdgGoals || [])
  // Faculty projects: the project's faculty is the mentor (already populated by the backend).
  const fixedMentor = source === 'faculty' ? prefillProject?.mentor || null : null
  const [mentorId, setMentorId] = useState(source === 'faculty' ? prefillProject?.facultyId || '' : '')
  const [draftSaved, setDraftSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let isMounted = true
    getProjectSelectionStage(stageIdFor(source))
      .then((data) => {
        if (isMounted) setStage(data)
      })
      .catch((err) => {
        if (isMounted) setStageError(err.message)
      })
      .finally(() => {
        if (isMounted) setStageLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [source])

  // When a project is pre-selected, everything it supplies is locked. Optional
  // fields the project left empty are hidden, since only its id is sent on apply.
  const locked = Boolean(prefillProject)
  const showProblemStatement = !locked || Boolean(prefillProject.problemStatement)
  const showExpectedOutcome = !locked || Boolean(prefillProject.expectedOutcome)
  const showTechnologies = !locked || Boolean(prefillProject.technologies?.length)
  const showSdgGoals = !locked || Boolean(prefillProject.sdgGoals?.length)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDraftSaved(false)
  }

  function toggleSdgGoal(goal) {
    setSdgGoals((prev) => (prev.includes(goal) ? prev.filter((item) => item !== goal) : [...prev, goal]))
    setDraftSaved(false)
  }

  function handleSaveDraft() {
    setDraftSaved(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!mentorId) {
      setSubmitError('Please select a mentor before submitting.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const team = await getMyTeam()

      if (source === 'faculty') {
        await applyFacultyProject({ teamId: team.id, projectId: prefillProject.id, mentorId })
      } else if (source === 'bank') {
        await applyProjectBank({ teamId: team.id, projectId: prefillProject.id, mentorId })
      } else {
        await submitOwnIdea({
          teamId: team.id,
          mentorId,
          projectDetails: {
            title: form.title.trim(),
            domain: form.domain,
            problemStatement: form.problemStatement.trim(),
            description: form.description.trim(),
            expectedOutcome: form.expectedOutcome.trim(),
            sdgGoals,
            technologyStack: parseList(form.technologies)
          }
        })
      }
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (stageLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Student Proposed Idea</h1>
        </div>
        <div className="loading-state">Checking stage availability...</div>
      </div>
    )
  }

  if (stageError) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Student Proposed Idea</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-title">Could not check stage availability</div>
          <p className="empty-state-text">{stageError}</p>
        </div>
      </div>
    )
  }

  if (stage && stage.status !== 'OPEN') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Student Proposed Idea</h1>
        </div>
        <StageLocked title={stage.title} status={stage.status} windowLabel={stage.windowLabel} />
      </div>
    )
  }

  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Student Proposed Idea</h1>
        </div>
        <div className="submission-result">
          <div className="submission-result-icon">
            <CheckCircle2 size={26} strokeWidth={2} />
          </div>
          <div className="submission-result-title">Proposal submitted for review</div>
          <p className="submission-result-text">
            Your project proposal has been sent to the coordinator
            {fixedMentor ? ` and to ${fixedMentor.name}` : mentorId ? ' and to your selected mentor' : ''} for
            approval. You will be notified once it is reviewed.
          </p>
          <div className="form-footer-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/project-selection')}>
              Back to Project Selection
            </button>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/project-selection/team')}>
              Select Your Team
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
            <h1 className="page-heading">Student Proposed Idea</h1>
            <p className="page-subtext">
              {source
                ? 'Review the pre-filled project details below, complete the remaining fields and submit your application.'
                : 'Propose your own project topic and request a faculty mentor for approval.'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">1</div>
            <div className="form-section-titles">
              <span className="form-section-title">Project Information</span>
              <span className="form-section-subtitle">
                {source
                  ? 'Fields already provided by the project are locked for editing'
                  : 'Describe what your project is about'}
              </span>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="title">Project Title</label>
            {locked ? (
              <div className="field-readonly">{form.title}</div>
            ) : (
              <input
                id="title"
                className="field-input"
                placeholder="e.g. AI Based Attendance System"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                required
              />
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="domain">Domain</label>
            {locked ? (
              <div className="field-readonly">{form.domain}</div>
            ) : (
              <select
                id="domain"
                className="field-select"
                value={form.domain}
                onChange={(event) => updateField('domain', event.target.value)}
                required
              >
                <option value="">Select a domain</option>
                {domains.map((domain) => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            )}
          </div>

          {showProblemStatement ? (
            <div className="field-group">
              <label className="field-label" htmlFor="problemStatement">Problem Statement</label>
              {locked ? (
                <div className="field-readonly">{form.problemStatement}</div>
              ) : (
                <textarea
                  id="problemStatement"
                  className="field-textarea"
                  placeholder="What problem does this project solve?"
                  value={form.problemStatement}
                  onChange={(event) => updateField('problemStatement', event.target.value)}
                  required
                />
              )}
            </div>
          ) : null}

          <div className="field-group">
            <label className="field-label" htmlFor="description">Description (Scope &amp; Objective)</label>
            {locked ? (
              <div className="field-readonly">{form.description}</div>
            ) : (
              <textarea
                id="description"
                className="field-textarea"
                placeholder="Describe the project, including its scope and objectives"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                required
              />
            )}
          </div>

          {showExpectedOutcome ? (
            <div className="field-group">
              <label className="field-label" htmlFor="expectedOutcome">
                Expected Outcome
                {locked ? null : <span className="optional">(optional)</span>}
              </label>
              {locked ? (
                <div className="field-readonly">{form.expectedOutcome}</div>
              ) : (
                <textarea
                  id="expectedOutcome"
                  className="field-textarea"
                  placeholder="What will the project deliver when it is complete?"
                  value={form.expectedOutcome}
                  onChange={(event) => updateField('expectedOutcome', event.target.value)}
                />
              )}
            </div>
          ) : null}

          {showTechnologies ? (
            <div className="field-group">
              <label className="field-label" htmlFor="technologies">Technologies to be Used</label>
              {locked ? (
                <div className="tech-tag-list">
                  {prefillProject.technologies.map((tech) => (
                    <span key={tech} className="tech-tag">{tech}</span>
                  ))}
                </div>
              ) : (
                <>
                  <textarea
                    id="technologies"
                    className="field-textarea"
                    placeholder="e.g. React, Node.js, MongoDB"
                    value={form.technologies}
                    onChange={(event) => updateField('technologies', event.target.value)}
                    required
                  />
                  <p className="field-hint">Separate each technology with a comma</p>
                </>
              )}
            </div>
          ) : null}

          {showSdgGoals ? (
            <div className="field-group">
              <label className="field-label">Aligned SDG Goal</label>
              {locked ? (
                <div className="tech-tag-list">
                  {prefillProject.sdgGoals.map((goal) => (
                    <span key={goal} className="tech-tag">{goal}</span>
                  ))}
                </div>
              ) : (
                <>
                  <div className="tech-tag-list">
                    {sdgGoalOptions.map((goal) => {
                      const isSelected = sdgGoals.includes(goal)
                      return (
                        <button
                          type="button"
                          key={goal}
                          className={isSelected ? 'sdg-option selected' : 'sdg-option'}
                          onClick={() => toggleSdgGoal(goal)}
                        >
                          {goal}
                        </button>
                      )
                    })}
                  </div>
                  <p className="field-hint">Select one or more UN Sustainable Development Goals this project supports</p>
                </>
              )}
            </div>
          ) : null}
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">2</div>
            <div className="form-section-titles">
              <span className="form-section-title">Mentor Information</span>
              <span className="form-section-subtitle">
                {source === 'faculty'
                  ? 'Assigned automatically based on the project you selected'
                  : 'Search and select a preferred faculty mentor'}
              </span>
            </div>
          </div>
          {source === 'faculty' ? (
            fixedMentor ? (
              <div className="mentor-fixed">
                <div className="mentor-list-avatar">{initials(fixedMentor.name)}</div>
                <div className="mentor-list-info">
                  <div className="mentor-list-name">{fixedMentor.name}</div>
                  <div className="mentor-list-dept">{fixedMentor.department || fixedMentor.email}</div>
                  {fixedMentor.specialization ? (
                    <div className="mentor-list-spec">{fixedMentor.specialization}</div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="form-error">This project does not have an assigned faculty member.</div>
            )
          ) : (
            <MentorPicker selectedId={mentorId} onSelect={setMentorId} />
          )}
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">3</div>
            <div className="form-section-titles">
              <span className="form-section-title">Submission</span>
              <span className="form-section-subtitle">Save your work or submit it for coordinator review</span>
            </div>
          </div>

          {submitError ? <div className="form-error">{submitError}</div> : null}
          <div className="form-footer">
            {draftSaved ? (
              <div className="form-feedback">
                <CheckCircle2 size={15} strokeWidth={2} />
                Draft saved successfully
              </div>
            ) : (
              <p className="section-subtext">Your draft is saved on this device until you submit it.</p>
            )}
            <div className="form-footer-actions">
              <button type="button" className="btn btn-secondary" onClick={handleSaveDraft}>
                <Save size={14} strokeWidth={2} />
                Save Draft
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={14} strokeWidth={2} />
                {submitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default StudentIdea
