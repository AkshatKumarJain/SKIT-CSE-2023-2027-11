import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjectSelectionStages } from '../../services/projectSelectionService'
import './Projectselection.css'

function StatusPill({ status, label }) {
  return (
    <span className={`status-pill ${status.toLowerCase()}`}>
      {label || status}
    </span>
  )
}

function StageCard({ stage }) {
  const isOpen = stage.status === 'OPEN'

  return (
    <div className="stage-card">
      <div className="stage-card-top">
        <div className="stage-number">
          {String(stage.number).padStart(2, '0')}
        </div>

        <StatusPill status={stage.status} />
      </div>

      <h3 className="stage-title">{stage.title}</h3>

      <p className="stage-description">
        {stage.description}
      </p>

      <div className="stage-window">
        {stage.windowLabel}
      </div>

      <ul className="stage-checklist">
        {stage.whatHappens.map((point) => (
          <li key={point}>
            <span aria-hidden="true">✓</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      {isOpen ? (
        <Link
          to={stage.route}
          className="btn btn-primary btn-block"
        >
          {stage.actionLabel}
        </Link>
      ) : (
        <button
          type="button"
          className="btn btn-secondary btn-block"
          disabled
        >
          {stage.status === 'UPCOMING'
            ? 'Opens Soon'
            : 'Not Available'}
        </button>
      )}
    </div>
  )
}

function ProjectSelection() {
  const [stages, setStages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  function loadStages() {
    setLoading(true)
    setLoadError('')

    getProjectSelectionStages()
      .then((data) => {
        setStages(data)
      })
      .catch((error) => {
        setLoadError(
          error.message ||
            'Could not load project selection stages'
        )
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadStages()
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">
            Project Selection
          </h1>
        </div>

        <div className="loading-state">
          Loading project selection stages...
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">
            Project Selection
          </h1>
        </div>

        <div className="locked-state">
          <div className="locked-state-title">
            Could not load project selection stages
          </div>

          <p className="locked-state-text">
            {loadError}
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadStages}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const openCount = stages.filter(
    (stage) => stage.status === 'OPEN'
  ).length

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-heading">
              Project Selection
            </h1>

            <p className="page-subtext">
              Complete your final year project selection through
              the three stages below. You can proceed with any
              stage that is currently open.
            </p>
          </div>
        </div>
      </div>

      <div className="status-banner">
        <div className="status-banner-text">
          <strong>Current status:</strong> You have not
          selected a project yet. Proposal, faculty application
          and project bank selection open in sequence for your
          batch.
        </div>

        <div className="status-banner-stats">
          <div className="status-banner-stat">
            <div className="status-banner-stat-value">
              {openCount}
            </div>

            <div className="status-banner-stat-label">
              Stages Open
            </div>
          </div>

          <div className="status-banner-stat">
            <div className="status-banner-stat-value">
              26 Sep
            </div>

            <div className="status-banner-stat-label">
              Final Deadline
            </div>
          </div>
        </div>
      </div>

      <div className="selection-stages">
        {stages.map((stage) => (
          <StageCard
            stage={stage}
            key={stage.id}
          />
        ))}
      </div>
    </div>
  )
}

export default ProjectSelection