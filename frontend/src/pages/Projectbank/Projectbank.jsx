import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SearchX, Lock, X } from 'lucide-react'
import { getProjectBankItems } from '../../services/projectBankService'
import { getProjectSelectionStage } from '../../services/projectSelectionService'
import { domains } from '../../data/mockData'
import '../Projectselection/Projectselection.css'
import './Projectbank.css'

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

function ProjectBank() {
  const navigate = useNavigate()
  const [stage, setStage] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState('')
  const [activeProject, setActiveProject] = useState(null)

  useEffect(() => {
    let isMounted = true
    Promise.all([getProjectSelectionStage('project-bank'), getProjectBankItems()]).then(
      ([stageData, itemData]) => {
        if (!isMounted) return
        setStage(stageData)
        setItems(itemData)
        setLoading(false)
      }
    )
    return () => {
      isMounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    return items.filter((project) => {
      const matchesQuery = project.title.toLowerCase().includes(query.toLowerCase())
      const matchesDomain = domain ? project.domain === domain : true
      return matchesQuery && matchesDomain
    })
  }, [items, query, domain])

  const availableCount = items.filter((item) => item.status === 'AVAILABLE').length

  function handleSelectProject(project) {
    navigate('/project-selection/student-idea', { state: { source: 'bank', project } })
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Project Bank</h1>
        </div>
        <div className="loading-state">Loading project bank...</div>
      </div>
    )
  }

  if (stage && stage.status !== 'OPEN') {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Project Bank</h1>
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
            <h1 className="page-heading">Project Bank</h1>
            <p className="page-subtext">
              Pre-approved project topics you can pick from if you have not been allotted a
              project yet.
            </p>
          </div>
        </div>
      </div>

      <div className="status-banner">
        <div className="status-banner-text">
          <strong>Availability:</strong> {availableCount} of {items.length} project bank topics
          are currently unallotted and ready to be selected.
        </div>
        <div className="status-banner-stats">
          <div className="status-banner-stat">
            <div className="status-banner-stat-value">{availableCount}</div>
            <div className="status-banner-stat-label">Available</div>
          </div>
          <div className="status-banner-stat">
            <div className="status-banner-stat-value">26 Sep</div>
            <div className="status-banner-stat-label">Closes On</div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-control">
          <Search size={15} strokeWidth={2} />
          <input
            type="text"
            value={query}
            placeholder="Search project bank"
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
        <strong>{filtered.length}</strong> project{filtered.length === 1 ? '' : 's'} in the project bank
      </div>

      {filtered.length ? (
        <div className="bank-idea-grid">
          {filtered.map((project) => (
            <button
              type="button"
              key={project.id}
              className="bank-idea-card"
              onClick={() => setActiveProject(project)}
            >
              <div className="bank-idea-card-top">
                <span className="bank-idea-card-domain">{project.domain}</span>
                <StatusPill status={project.status} label={project.status === 'ALLOTTED' ? 'Allotted' : 'Available'} />
              </div>
              <div className="bank-idea-card-title">{project.title}</div>
              <p className="bank-idea-card-description">{project.description}</p>
              <div className="bank-idea-card-footer">
                <span className="bank-idea-card-difficulty">{project.difficulty}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <SearchX size={20} strokeWidth={2} />
          </div>
          <div className="empty-state-title">No matching projects</div>
          <p className="empty-state-text">Try adjusting your search or choosing a different domain.</p>
        </div>
      )}

      <ProjectDrawer
        open={Boolean(activeProject)}
        onClose={() => setActiveProject(null)}
        title={activeProject?.title}
        subtitle={activeProject ? `${activeProject.domain} · ${activeProject.difficulty}` : ''}
      >
        {activeProject ? (
          <>
            <div className="detail-block">
              <div className="detail-block-label">Description</div>
              <p className="detail-block-text">{activeProject.description}</p>
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
                disabled={activeProject.status === 'ALLOTTED'}
                onClick={() => handleSelectProject(activeProject)}
              >
                {activeProject.status === 'ALLOTTED' ? 'Not Available' : 'Select This Project'}
              </button>
            </div>
          </>
        ) : null}
      </ProjectDrawer>
    </div>
  )
}

export default ProjectBank
