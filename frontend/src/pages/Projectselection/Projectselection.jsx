import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { getProjectSelectionStages } from '../../services/projectSelectionService'
import './Projectselection.css'

function StatusPill({ status, label }) {
  return <span className={`status-pill ${status.toLowerCase()}`}>{label || status}</span>
}

function StageCard({ stage }) {
  const navigate = useNavigate()
  const isOpen = stage.status === 'OPEN'

  return (
    <div className="stage-card">
      <div className="stage-card-top">
        <div className="stage-number">{String(stage.number).padStart(2, '0')}</div>
        <StatusPill status={stage.status} />
      </div>
      <h3 className="stage-title">{stage.title}</h3>
      <p className="stage-description">{stage.description}</p>
      <div className="stage-window">{stage.windowLabel}</div>
      <ul className="stage-checklist">
        {stage.whatHappens.map((point) => (
          <li key={point}>
            <Check size={13} strokeWidth={2.5} />
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={isOpen ? 'btn btn-primary btn-block' : 'btn btn-secondary btn-block'}
        disabled={!isOpen}
        onClick={() => navigate(stage.route)}
      >
        {isOpen ? stage.actionLabel : stage.status === 'UPCOMING' ? 'Opens Soon' : 'Not Available'}
      </button>
    </div>
  )
}

function ProjectSelection() {
  const [stages, setStages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    getProjectSelectionStages().then((data) => {
      if (isMounted) {
        setStages(data)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Project Selection</h1>
        </div>
        <div className="loading-state">Loading project selection stages...</div>
      </div>
    )
  }

  const openCount = stages.filter((stage) => stage.status === 'OPEN').length

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-heading">Project Selection</h1>
            <p className="page-subtext">
              Complete your final year project selection through the three stages below. You can
              proceed with any stage that is currently open.
            </p>
          </div>
        </div>
      </div>

      <div className="status-banner">
        <div className="status-banner-text">
          <strong>Current status:</strong> You have not selected a project yet. Proposal, faculty
          application and project bank selection open in sequence for your batch.
        </div>
        <div className="status-banner-stats">
          <div className="status-banner-stat">
            <div className="status-banner-stat-value">{openCount}</div>
            <div className="status-banner-stat-label">Stages Open</div>
          </div>
          <div className="status-banner-stat">
            <div className="status-banner-stat-value">26 Sep</div>
            <div className="status-banner-stat-label">Final Deadline</div>
          </div>
        </div>
      </div>

      <div className="selection-stages">
        {stages.map((stage) => (
          <StageCard stage={stage} key={stage.id} />
        ))}
      </div>
    </div>
  )
}

export default ProjectSelection
