import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Save, Send, Search, Check, Lock } from 'lucide-react'
import { getProjectSelectionStage } from '../../services/projectSelectionService'
import { getFacultyMembers } from '../../services/facultyService'
import { domains } from '../../data/mockData'
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
  const [query, setQuery] = useState('')

  useEffect(() => {
    let isMounted = true
    getFacultyMembers().then((data) => {
      if (isMounted) {
        setFacultyMembers(data)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return <div className="loading-state">Loading faculty mentors...</div>
  }

  const filtered = facultyMembers.filter((faculty) => {
    const term = query.toLowerCase()
    return (
      faculty.name.toLowerCase().includes(term) ||
      faculty.specialization.toLowerCase().includes(term) ||
      faculty.department.toLowerCase().includes(term)
    )
  })

  return (
    <div>
      <div className="search-control">
        <Search size={15} strokeWidth={2} />
        <input
          type="text"
          value={query}
          placeholder="Search mentors by name, department or specialization"
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
                  <div className="mentor-list-dept">{faculty.department}</div>
                  <div className="mentor-list-spec">{faculty.specialization}</div>
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
    objectives: Array.isArray(project?.objectives) ? project.objectives.join('\n') : '',
    expectedOutcome: project?.expectedOutcome || '',
    technologies: Array.isArray(project?.technologies) ? project.technologies.join(', ') : ''
  }
}

function StudentIdea() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefillProject = location.state?.project || null
  const source = location.state?.source || null

  const [stage, setStage] = useState(null)
  const [stageLoading, setStageLoading] = useState(true)
  const [form, setForm] = useState(() => buildInitialForm(prefillProject))
  const [mentorId, setMentorId] = useState(source === 'faculty' ? prefillProject?.facultyId || '' : '')
  const [fixedMentor, setFixedMentor] = useState(null)
  const [mentorLoading, setMentorLoading] = useState(source === 'faculty')
  const [draftSaved, setDraftSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    let isMounted = true
    getProjectSelectionStage('student-idea').then((data) => {
      if (isMounted) {
        setStage(data)
        setStageLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (source !== 'faculty' || !prefillProject?.facultyId) return undefined
    let isMounted = true
    getFacultyMembers().then((data) => {
      if (isMounted) {
        setFixedMentor(data.find((faculty) => faculty.id === prefillProject.facultyId) || null)
        setMentorLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [source, prefillProject])

  const readOnly = {
    title: Boolean(prefillProject?.title),
    domain: Boolean(prefillProject?.domain),
    problemStatement: Boolean(prefillProject?.problemStatement),
    description: Boolean(prefillProject?.description),
    objectives: Boolean(prefillProject?.objectives?.length),
    expectedOutcome: Boolean(prefillProject?.expectedOutcome),
    technologies: Boolean(prefillProject?.technologies?.length)
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setDraftSaved(false)
  }

  function handleSaveDraft() {
    setDraftSaved(true)
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
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
          <button type="button" className="btn btn-primary" onClick={() => navigate('/project-selection')}>
            Back to Project Selection
          </button>
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
            {readOnly.title ? (
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
            {readOnly.domain ? (
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

          <div className="field-group">
            <label className="field-label" htmlFor="problemStatement">Problem Statement</label>
            {readOnly.problemStatement ? (
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

          <div className="field-group">
            <label className="field-label" htmlFor="description">Project Description</label>
            {readOnly.description ? (
              <div className="field-readonly">{form.description}</div>
            ) : (
              <textarea
                id="description"
                className="field-textarea"
                placeholder="Give a brief overview of your proposed approach"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                required
              />
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="objectives">Objectives</label>
            {readOnly.objectives ? (
              <ul className="detail-list">
                {prefillProject.objectives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <>
                <textarea
                  id="objectives"
                  className="field-textarea"
                  placeholder="List the key objectives of the project"
                  value={form.objectives}
                  onChange={(event) => updateField('objectives', event.target.value)}
                  required
                />
                <p className="field-hint">Separate each objective with a new line</p>
              </>
            )}
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label" htmlFor="expectedOutcome">Expected Outcome</label>
              {readOnly.expectedOutcome ? (
                <div className="field-readonly">{form.expectedOutcome}</div>
              ) : (
                <textarea
                  id="expectedOutcome"
                  className="field-textarea"
                  placeholder="What will the final deliverable look like?"
                  value={form.expectedOutcome}
                  onChange={(event) => updateField('expectedOutcome', event.target.value)}
                  required
                />
              )}
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="technologies">
                Technologies
                <span className="optional">(comma separated)</span>
              </label>
              {readOnly.technologies ? (
                <div className="tech-tag-list">
                  {prefillProject.technologies.map((tech) => (
                    <span key={tech} className="tech-tag">{tech}</span>
                  ))}
                </div>
              ) : (
                <textarea
                  id="technologies"
                  className="field-textarea"
                  placeholder="e.g. React, Node.js, MongoDB"
                  value={form.technologies}
                  onChange={(event) => updateField('technologies', event.target.value)}
                />
              )}
            </div>
          </div>
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
            mentorLoading ? (
              <div className="loading-state">Loading mentor details...</div>
            ) : fixedMentor ? (
              <div className="mentor-fixed">
                <div className="mentor-list-avatar">{initials(fixedMentor.name)}</div>
                <div className="mentor-list-info">
                  <div className="mentor-list-name">{fixedMentor.name}</div>
                  <div className="mentor-list-dept">{fixedMentor.department}</div>
                  <div className="mentor-list-spec">{fixedMentor.specialization}</div>
                </div>
              </div>
            ) : null
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
              <button type="submit" className="btn btn-primary">
                <Send size={14} strokeWidth={2} />
                Submit Proposal
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default StudentIdea
