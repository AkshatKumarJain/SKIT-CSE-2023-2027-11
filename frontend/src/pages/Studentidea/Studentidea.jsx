import { useEffect, useMemo, useState } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'

import { apiFetch } from '../../services/api'

import { getProjectSelectionStage } from '../../services/projectSelectionService'

import { getFacultyMembers } from '../../services/facultyService'

import { getMyTeam } from '../../services/teamService'

import {
  submitOwnIdea,
  applyFacultyProject,
  applyProjectBank
} from '../../services/applicationService'

import './Studentidea.css'

function initials(name) {
  return name
    .replace('Dr. ', '')
    .replace('Prof. ', '')
    .split(' ')
    .map((part) => part[0])
    .join('')
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
        <span aria-hidden="true">🔒</span>
      </div>

      <div className="locked-state-title">
        {title} is {status === 'UPCOMING' ? 'not open yet' : 'closed'}
      </div>

      <p className="locked-state-text">{message}</p>

      {windowLabel ? (
        <div className="stage-window">{windowLabel}</div>
      ) : null}

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => navigate('/project-selection')}
      >
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

    getFacultyMembers()
      .then((data) => {
        if (isMounted) {
          setFacultyMembers(data || [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setFacultyMembers([])
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="loading-state">
        Loading faculty mentors...
      </div>
    )
  }

  const filtered = facultyMembers.filter((faculty) => {
    const term = query.toLowerCase()

    return (
      faculty.name?.toLowerCase().includes(term) ||
      faculty.specialization?.toLowerCase().includes(term) ||
      faculty.department?.toLowerCase().includes(term)
    )
  })

  return (
    <div>
      <div className="search-control">
        <span aria-hidden="true">⌕</span>

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
                className={
                  isSelected
                    ? 'mentor-list-item selected'
                    : 'mentor-list-item'
                }
                onClick={() => onSelect(faculty.id)}
              >
                <div className="mentor-list-avatar">
                  {initials(faculty.name)}
                </div>

                <div className="mentor-list-info">
                  <div className="mentor-list-name">
                    {faculty.name}
                  </div>

                  <div className="mentor-list-dept">
                    {faculty.department}
                  </div>

                  <div className="mentor-list-spec">
                    {faculty.specialization}
                  </div>
                </div>

                {isSelected ? (
                  <div className="mentor-list-check">
                    <span aria-hidden="true">✓</span>
                  </div>
                ) : null}
              </button>
            )
          })
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">
              No mentors found
            </div>

            <p className="empty-state-text">
              Try a different search term.
            </p>
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
    description: project?.description || '',
    specificFunctionalities: Array.isArray(
      project?.specificFunctionalities
    )
      ? project.specificFunctionalities.join('\n')
      : '',
    technologies: Array.isArray(project?.technologies)
      ? project.technologies.join(', ')
      : ''
  }
}

function StudentIdea() {
  const navigate = useNavigate()
  const location = useLocation()

  const prefillProject = location.state?.project || null
  const source = location.state?.source || null

const pageTitle =
  source === 'faculty'
    ? 'Faculty Proposed Project'
    : source === 'bank'
      ? 'Project Bank'
      : 'Student Proposed Idea'

  const [stage, setStage] = useState(null)
  const [stageLoading, setStageLoading] = useState(true)

  const [team, setTeam] = useState(null)
  const [teamLoading, setTeamLoading] = useState(true)
  const [teamError, setTeamError] = useState('')

  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState('')

  const [form, setForm] = useState(() =>
    buildInitialForm(prefillProject)
  )

  const [sdgGoals, setSdgGoals] = useState(
    Array.isArray(prefillProject?.sdgGoals)
      ? prefillProject.sdgGoals
      : []
  )

  const [mentorId, setMentorId] = useState(
    source === 'faculty'
      ? prefillProject?.facultyId || ''
      : ''
  )

  const [fixedMentor, setFixedMentor] = useState(null)
  const [mentorLoading, setMentorLoading] = useState(
    source === 'faculty'
  )

  const [draftSaved, setDraftSaved] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

 useEffect(() => {
  let isMounted = true

  const stageId =
    source === 'faculty'
      ? 'faculty-project'
      : source === 'bank'
        ? 'project-bank'
        : 'student-idea'

  getProjectSelectionStage(stageId)
    .then((data) => {
      if (isMounted) {
        setStage(data)
        setStageLoading(false)
      }
    })
    .catch((error) => {
      if (isMounted) {
        setStage(null)
        setStageLoading(false)
      }
    })

  return () => {
    isMounted = false
  }
}, [source])

  useEffect(() => {
    let isMounted = true

    getMyTeam()
      .then((data) => {
        if (isMounted) {
          setTeam(data)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setTeamError(
            error.message || 'Could not check your team status'
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setTeamLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    apiFetch('/api/projects')
      .then((data) => {
        if (isMounted) {
          setProjects(Array.isArray(data) ? data : [])
          setProjectsError('')
        }
      })
      .catch((error) => {
        if (isMounted) {
          setProjects([])
          setProjectsError(
            error.message || 'Could not load project options'
          )
        }
      })
      .finally(() => {
        if (isMounted) {
          setProjectsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (
      source !== 'faculty' ||
      !prefillProject?.facultyId
    ) {
      return undefined
    }

    let isMounted = true

    getFacultyMembers()
      .then((data) => {
        if (isMounted) {
          setFixedMentor(
            (data || []).find(
              (faculty) =>
                faculty.id === prefillProject.facultyId
            ) || null
          )

          setMentorLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setFixedMentor(null)
          setMentorLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [source, prefillProject])

  const domains = useMemo(() => {
    return [
      ...new Set(
        projects
          .map((project) => project?.domain)
          .filter(Boolean)
      )
    ].sort()
  }, [projects])

  const sdgGoalOptions = useMemo(() => {
    return [
      ...new Set(
        projects
          .flatMap((project) =>
            Array.isArray(project?.sdgGoals)
              ? project.sdgGoals
              : []
          )
          .filter(Boolean)
      )
    ].sort()
  }, [projects])

  const readOnly = {
    title: Boolean(prefillProject?.title),

    domain: Boolean(prefillProject?.domain),

    description: Boolean(prefillProject?.description),

    specificFunctionalities: Boolean(
      prefillProject?.specificFunctionalities?.length
    ),

    technologies: Boolean(
      prefillProject?.technologies?.length
    ),

    sdgGoals: Boolean(prefillProject?.sdgGoals?.length)
  }

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }))

    setDraftSaved(false)
  }

  function toggleSdgGoal(goal) {
    setSdgGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((item) => item !== goal)
        : [...prev, goal]
    )

    setDraftSaved(false)
  }

  function handleSaveDraft() {
    setDraftSaved(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!team) return

    setSubmitError('')
    setSubmitting(true)

    try {
      if (source === 'faculty') {
        await applyFacultyProject({
          teamId: team.id,
          projectId: prefillProject._id,
          mentorId
        })
      } else if (source === 'bank') {
        await applyProjectBank({
          teamId: team.id,
          projectId: prefillProject._id,
          mentorId
        })
      } else {
        await submitOwnIdea({
          teamId: team.id,
          mentorId,
          projectDetails: {
            title: form.title,
            domain: form.domain,
            description: form.description,

            specificFunctionalities:
              form.specificFunctionalities
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean),

            sdgGoals,

            technologies: form.technologies
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          }
        })
      }

      setSubmitted(true)
    } catch (error) {
      setSubmitError(
        error.message || 'Could not submit your proposal'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (stageLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">
  {pageTitle}
</h1>
        </div>

        <div className="loading-state">
          Checking stage availability...
        </div>
      </div>
    )
  }

  if (stage && stage.status !== 'OPEN') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">
  {pageTitle}
</h1>
        </div>

        <StageLocked
          title={stage.title}
          status={stage.status}
          windowLabel={stage.windowLabel}
        />
      </div>
    )
  }

  if (teamLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">
  {pageTitle}
</h1>
        </div>

        <div className="loading-state">
          Checking your team status...
        </div>
      </div>
    )
  }

  if (
    teamError ||
    !team ||
    team.status !== 'COMPLETED'
  ) {
    return (
      <div>
        <div className="page-header">
         <h1 className="page-heading">
  {pageTitle}
</h1> 
        </div>

        <div className="locked-state">
          <div className="locked-state-title">
            {teamError
              ? 'Could not check your team status'
              : !team
                ? 'You need a team before you can propose a project'
                : 'Your team is not marked complete yet'}
          </div>

          <p className="locked-state-text">
            {teamError ||
              (!team
                ? 'Create a team and invite your teammates on the Team Selection page first.'
                : 'Finish inviting your teammates and mark the team as complete before submitting a proposal.')}
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              navigate('/project-selection/team')
            }
          >
            Go to Team Selection
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">
  {pageTitle}
</h1>
        </div>

        <div className="submission-result">
          <div className="submission-result-icon">
            <span aria-hidden="true">✓</span>
          </div>

          <div className="submission-result-title">
            Proposal submitted for review
          </div>

          <p className="submission-result-text">
            Your project proposal has been sent to the
            coordinator
            {fixedMentor
              ? ` and to ${fixedMentor.name}`
              : mentorId
                ? ' and to your selected mentor'
                : ''}{' '}
            for approval. You will be notified once it is
            reviewed.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              navigate('/project-selection')
            }
          >
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
            <h1 className="page-heading">
  {pageTitle}
</h1>

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
              <span className="form-section-title">
                Project Information
              </span>

              <span className="form-section-subtitle">
                {source
                  ? 'Fields already provided by the project are locked for editing'
                  : 'Describe what your project is about'}
              </span>
            </div>
          </div>

          <div className="field-group">
            <label
              className="field-label"
              htmlFor="title"
            >
              Project Title
            </label>

            {readOnly.title ? (
              <div className="field-readonly">
                {form.title}
              </div>
            ) : (
              <input
                id="title"
                className="field-input"
                placeholder="e.g. AI Based Attendance System"
                value={form.title}
                onChange={(event) =>
                  updateField(
                    'title',
                    event.target.value
                  )
                }
                required
              />
            )}
          </div>

          <div className="field-group">
            <label
              className="field-label"
              htmlFor="domain"
            >
              Domain
            </label>

            {readOnly.domain ? (
              <div className="field-readonly">
                {form.domain}
              </div>
            ) : (
              <select
                id="domain"
                className="field-select"
                value={form.domain}
                onChange={(event) =>
                  updateField(
                    'domain',
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select a domain
                </option>

                {domains.map((domain) => (
                  <option
                    key={domain}
                    value={domain}
                  >
                    {domain}
                  </option>
                ))}
              </select>
            )}

            {projectsError ? (
              <p className="field-hint">
                {projectsError}
              </p>
            ) : projectsLoading ? (
              <p className="field-hint">
                Loading domains from backend...
              </p>
            ) : null}
          </div>

          <div className="field-group">
            <label
              className="field-label"
              htmlFor="description"
            >
              Description (Scope &amp; Objective)
            </label>

            {readOnly.description ? (
              <div className="field-readonly">
                {form.description}
              </div>
            ) : (
              <textarea
                id="description"
                className="field-textarea"
                placeholder="Describe the project, including its scope and objectives"
                value={form.description}
                onChange={(event) =>
                  updateField(
                    'description',
                    event.target.value
                  )
                }
                required
              />
            )}
          </div>

          <div className="field-group">
            <label
              className="field-label"
              htmlFor="specificFunctionalities"
            >
              Specific Functionalities
            </label>

            {readOnly.specificFunctionalities ? (
              <ul className="detail-list">
                {prefillProject.specificFunctionalities.map(
                  (item) => (
                    <li key={item}>{item}</li>
                  )
                )}
              </ul>
            ) : (
              <>
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
                  Separate each functionality with a new
                  line
                </p>
              </>
            )}
          </div>

          <div className="field-group">
            <label
              className="field-label"
              htmlFor="technologies"
            >
              Technologies to be Used
            </label>

            {readOnly.technologies ? (
              <div className="tech-tag-list">
                {prefillProject.technologies.map(
                  (tech) => (
                    <span
                      key={tech}
                      className="tech-tag"
                    >
                      {tech}
                    </span>
                  )
                )}
              </div>
            ) : (
              <textarea
                id="technologies"
                className="field-textarea"
                placeholder="e.g. React, Node.js, MongoDB"
                value={form.technologies}
                onChange={(event) =>
                  updateField(
                    'technologies',
                    event.target.value
                  )
                }
                required
              />
            )}

            <p className="field-hint">
              Separate each technology with a comma
            </p>
          </div>

          <div className="field-group">
            <label className="field-label">
              Aligned SDG Goal
            </label>

            {readOnly.sdgGoals ? (
              <div className="tech-tag-list">
                {prefillProject.sdgGoals.map(
                  (goal) => (
                    <span
                      key={goal}
                      className="tech-tag"
                    >
                      {goal}
                    </span>
                  )
                )}
              </div>
            ) : (
              <>
                <div className="tech-tag-list">
                  {sdgGoalOptions.map((goal) => {
                    const isSelected =
                      sdgGoals.includes(goal)

                    return (
                      <button
                        type="button"
                        key={goal}
                        className={
                          isSelected
                            ? 'sdg-option selected'
                            : 'sdg-option'
                        }
                        onClick={() =>
                          toggleSdgGoal(goal)
                        }
                      >
                        {goal}
                      </button>
                    )
                  })}
                </div>

                {!projectsLoading &&
                !sdgGoalOptions.length ? (
                  <p className="field-hint">
                    No SDG goals are currently available
                    from the backend project data.
                  </p>
                ) : null}

                <p className="field-hint">
                  Select one or more UN Sustainable
                  Development Goals this project supports
                </p>
              </>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">2</div>

            <div className="form-section-titles">
              <span className="form-section-title">
                Mentor Information
              </span>

              <span className="form-section-subtitle">
                {source === 'faculty'
                  ? 'Assigned automatically based on the project you selected'
                  : 'Search and select a preferred faculty mentor'}
              </span>
            </div>
          </div>

          {source === 'faculty' ? (
            mentorLoading ? (
              <div className="loading-state">
                Loading mentor details...
              </div>
            ) : fixedMentor ? (
              <div className="mentor-fixed">
                <div className="mentor-list-avatar">
                  {initials(fixedMentor.name)}
                </div>

                <div className="mentor-list-info">
                  <div className="mentor-list-name">
                    {fixedMentor.name}
                  </div>

                  <div className="mentor-list-dept">
                    {fixedMentor.department}
                  </div>

                  <div className="mentor-list-spec">
                    {fixedMentor.specialization}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-title">
                  Mentor details unavailable
                </div>

                <p className="empty-state-text">
                  The selected faculty mentor could not be
                  loaded.
                </p>
              </div>
            )
          ) : (
            <MentorPicker
              selectedId={mentorId}
              onSelect={setMentorId}
            />
          )}
        </div>

        <div className="form-section">
          <div className="form-section-header">
            <div className="form-section-number">3</div>

            <div className="form-section-titles">
              <span className="form-section-title">
                Submission
              </span>

              <span className="form-section-subtitle">
                Save your work or submit it for coordinator
                review
              </span>
            </div>
          </div>

          {submitError ? (
            <div className="team-action-error">
              {submitError}
            </div>
          ) : null}

          <div className="form-footer">
            {draftSaved ? (
              <div className="form-feedback">
                <span aria-hidden="true">✓</span>
                Draft saved successfully
              </div>
            ) : (
              <p className="section-subtext">
                Your draft is saved on this device until you
                submit it.
              </p>
            )}

            <div className="form-footer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleSaveDraft}
                disabled={submitting}
              >
                <span aria-hidden="true">💾</span>
                Save Draft
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                <span aria-hidden="true">➤</span>
                {submitting
                  ? 'Submitting...'
                  : 'Submit Proposal'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default StudentIdea