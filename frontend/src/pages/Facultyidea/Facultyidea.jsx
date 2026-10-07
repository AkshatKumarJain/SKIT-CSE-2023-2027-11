import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFacultyProjects } from '../../services/facultyService'
import { getProjectSelectionStage } from '../../services/projectSelectionService'
import './Facultyidea.css'

function StatusPill({ status, label }) {
  return (
    <span className={`status-pill ${status.toLowerCase()}`}>
      {label || status}
    </span>
  )
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

function ProjectDrawer({
  open,
  onClose,
  title,
  subtitle,
  children
}) {
  if (!open) return null

  return (
    <div
      className="project-drawer-overlay"
      onClick={onClose}
    >
      <div
        className="project-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="project-drawer-header">
          <div>
            <h2 className="project-drawer-title">
              {title}
            </h2>

            {subtitle ? (
              <p className="project-drawer-subtitle">
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="project-drawer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="project-drawer-body">
          {children}
        </div>
      </div>
    </div>
  )
}

function FacultyIdea() {
  const navigate = useNavigate()

  const [stage, setStage] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState('')
  const [activeProject, setActiveProject] = useState(null)

  useEffect(() => {
    let isMounted = true

    Promise.all([
      getProjectSelectionStage('faculty-project'),
      getFacultyProjects()
    ])
      .then(([stageData, projectData]) => {
        if (!isMounted) return

        setStage(stageData)
        setProjects(projectData || [])
        setLoading(false)
      })
      .catch(() => {
        if (!isMounted) return

        setStage(null)
        setProjects([])
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const domains = useMemo(() => {
    return [
      ...new Set(
        projects
          .map((project) => project.domain)
          .filter(Boolean)
      )
    ].sort()
  }, [projects])

  const filtered = useMemo(() => {
    const searchTerm = query.toLowerCase().trim()

    return projects.filter((project) => {
      const matchesQuery =
        !searchTerm ||
        project.title
          ?.toLowerCase()
          .includes(searchTerm) ||
        project.faculty
          ?.toLowerCase()
          .includes(searchTerm)

      const matchesDomain =
        domain ? project.domain === domain : true

      return matchesQuery && matchesDomain
    })
  }, [projects, query, domain])

  function handleSelectProject(project) {
    navigate('/project-selection/student-idea', {
      state: {
        source: 'faculty',
        project
      }
    })
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">
            Faculty Proposed Projects
          </h1>
        </div>

        <div className="loading-state">
          Loading faculty projects...
        </div>
      </div>
    )
  }

  if (stage && stage.status !== 'OPEN') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">
            Faculty Proposed Projects
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

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-heading">
              Faculty Proposed Projects
            </h1>

            <p className="page-subtext">
              Browse project topics floated by faculty members.
              Click a project to view full details and apply.
              Each project can be picked by one team only.
            </p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-control">
          <span aria-hidden="true">⌕</span>

          <input
            type="text"
            value={query}
            placeholder="Search by title or faculty"
            onChange={(event) =>
              setQuery(event.target.value)
            }
          />
        </div>

        <select
          className="filter-select"
          value={domain}
          onChange={(event) =>
            setDomain(event.target.value)
          }
        >
          <option value="">All Domains</option>

          {domains.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="results-count">
        <strong>{filtered.length}</strong>{' '}
        project{filtered.length === 1 ? '' : 's'} found
      </div>

      {filtered.length ? (
        <div className="faculty-idea-grid">
          {filtered.map((project) => {
            const isReserved =
              project.visibilityStatus === 'RESERVED'

            return (
              <button
                type="button"
                key={project._id}
                className="faculty-idea-card"
                onClick={() =>
                  setActiveProject(project)
                }
              >
                <div className="faculty-idea-card-top">
                  <span className="faculty-idea-card-domain">
                    {project.domain}
                  </span>

                  <StatusPill
                    status={project.visibilityStatus}
                    label={
                      isReserved
                        ? 'Reserved'
                        : 'Available'
                    }
                  />
                </div>

                <div className="faculty-idea-card-title">
                  {project.title}
                </div>

                <div className="faculty-idea-card-faculty">
                  {project.faculty}
                </div>

                {project.sdgGoals?.length ? (
                  <div className="faculty-idea-card-sdg">
                    {project.sdgGoals[0]}
                  </div>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <span aria-hidden="true">⌕</span>
          </div>

          <div className="empty-state-title">
            No projects found
          </div>

          <p className="empty-state-text">
            Try a different search term or clear the domain
            filter.
          </p>
        </div>
      )}

      <ProjectDrawer
        open={Boolean(activeProject)}
        onClose={() => setActiveProject(null)}
        title={activeProject?.title}
        subtitle={
          activeProject
            ? `${activeProject.faculty} · ${activeProject.domain}`
            : ''
        }
      >
        {activeProject ? (
          <>
            <div className="detail-block">
              <div className="detail-block-label">
                Description
              </div>

              <p className="detail-block-text">
                {activeProject.description}
              </p>
            </div>

            {activeProject.specificFunctionalities?.length ? (
              <div className="detail-block">
                <div className="detail-block-label">
                  Specific Functionalities
                </div>

                <ul className="detail-list">
                  {activeProject.specificFunctionalities.map(
                    (item) => (
                      <li key={item}>{item}</li>
                    )
                  )}
                </ul>
              </div>
            ) : null}

            <div className="detail-block">
              <div className="detail-block-label">
                Technologies
              </div>

              <div className="tech-tag-list">
                {(activeProject.technologies || []).map(
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
            </div>

            <div className="detail-block">
              <div className="detail-block-label">
                Aligned SDG Goal
              </div>

              <div className="tech-tag-list">
                {(activeProject.sdgGoals || []).map(
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
            </div>

            <div className="drawer-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() =>
                  setActiveProject(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  activeProject.visibilityStatus ===
                  'RESERVED'
                }
                onClick={() =>
                  handleSelectProject(activeProject)
                }
              >
                {activeProject.visibilityStatus ===
                'RESERVED'
                  ? 'Already Picked'
                  : 'Select This Project'}
              </button>
            </div>
          </>
        ) : null}
      </ProjectDrawer>
    </div>
  )
}

export default FacultyIdea