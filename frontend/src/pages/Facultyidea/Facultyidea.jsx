import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SearchX, Users, Lock, X } from 'lucide-react'
import { getFacultyProjects } from '../../services/facultyService'
import { getProjectSelectionStage } from '../../services/projectSelectionService'
import { domains } from '../../data/mockData'
import '../Projectselection/Projectselection.css'
import './Facultyidea.css'

function StatusPill({ status, label }) {
  return <span className={`status-pill ${status.toLowerCase()}`}>{label || status}</span>
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

function ProjectDrawer({ open, onClose, title, subtitle, children }) {
  if (!open) return null

  return (
    <div className="project-drawer-overlay" onClick={onClose}>
      <div className="project-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="project-drawer-header">
          <div>
            <h2 className="project-drawer-title">{title}</h2>
            {subtitle ? <p className="project-drawer-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="project-drawer-close" onClick={onClose} aria-label="Close">
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="project-drawer-body">{children}</div>
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
    Promise.all([getProjectSelectionStage('faculty-project'), getFacultyProjects()]).then(
      ([stageData, projectData]) => {
        if (!isMounted) return
        setStage(stageData)
        setProjects(projectData)
        setLoading(false)
      }
    )
    return () => {
      isMounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const matchesQuery =
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        project.faculty.toLowerCase().includes(query.toLowerCase())
      const matchesDomain = domain ? project.domain === domain : true
      return matchesQuery && matchesDomain
    })
  }, [projects, query, domain])

  function handleSelectProject(project) {
    navigate('/project-selection/student-idea', { state: { source: 'faculty', project } })
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Faculty Proposed Projects</h1>
        </div>
        <div className="loading-state">Loading faculty projects...</div>
      </div>
    )
  }

  if (stage && stage.status !== 'OPEN') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Faculty Proposed Projects</h1>
        </div>
        <StageLocked title={stage.title} status={stage.status} windowLabel={stage.windowLabel} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-heading">Faculty Proposed Projects</h1>
            <p className="page-subtext">
              Browse project topics floated by faculty members. Click a project to view full
              details and apply.
            </p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-control">
          <Search size={15} strokeWidth={2} />
          <input
            type="text"
            value={query}
            placeholder="Search by title or faculty"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
        >
          <option value="">All Domains</option>
          {domains.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="results-count">
        <strong>{filtered.length}</strong> project{filtered.length === 1 ? '' : 's'} found
      </div>

      {filtered.length ? (
        <div className="faculty-idea-grid">
          {filtered.map((project) => (
            <button
              type="button"
              key={project.id}
              className="faculty-idea-card"
              onClick={() => setActiveProject(project)}
            >
              <div className="faculty-idea-card-top">
                <span className="faculty-idea-card-domain">{project.domain}</span>
                <StatusPill status={project.status} label={project.status === 'FULL' ? 'Full' : 'Open'} />
              </div>
              <div className="faculty-idea-card-title">{project.title}</div>
              <div className="faculty-idea-card-faculty">{project.faculty}</div>
              <div className="faculty-idea-card-seats">
                <Users size={13} strokeWidth={2} />
                {project.seatsAvailable} of {project.seatsTotal} seats open
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <SearchX size={20} strokeWidth={2} />
          </div>
          <div className="empty-state-title">No projects found</div>
          <p className="empty-state-text">Try a different search term or clear the domain filter.</p>
        </div>
      )}

      <ProjectDrawer
        open={Boolean(activeProject)}
        onClose={() => setActiveProject(null)}
        title={activeProject?.title}
        subtitle={activeProject ? `${activeProject.faculty} · ${activeProject.domain}` : ''}
      >
        {activeProject ? (
          <>
            <div className="detail-block">
              <div className="detail-block-label">Seats</div>
              <div className="faculty-idea-seats">
                <Users size={14} strokeWidth={2} />
                {activeProject.seatsAvailable} of {activeProject.seatsTotal} seats open
              </div>
            </div>

            <div className="detail-block">
              <div className="detail-block-label">Problem Statement</div>
              <p className="detail-block-text">{activeProject.problemStatement}</p>
            </div>

            <div className="detail-block">
              <div className="detail-block-label">Objectives</div>
              <ul className="detail-list">
                {activeProject.objectives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="detail-block">
              <div className="detail-block-label">Expected Outcome</div>
              <p className="detail-block-text">{activeProject.expectedOutcome}</p>
            </div>

            <div className="detail-block">
              <div className="detail-block-label">Technologies</div>
              <div className="tech-tag-list">
                {activeProject.technologies.map((tech) => (
                  <span key={tech} className="tech-tag">{tech}</span>
                ))}
              </div>
            </div>

            <div className="drawer-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setActiveProject(null)}>
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={activeProject.status === 'FULL'}
                onClick={() => handleSelectProject(activeProject)}
              >
                {activeProject.status === 'FULL' ? 'Seats Full' : 'Select This Project'}
              </button>
            </div>
          </>
        ) : null}
      </ProjectDrawer>
    </div>
  )
}

export default FacultyIdea
