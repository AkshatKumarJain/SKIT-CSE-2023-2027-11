import { useEffect, useState } from 'react'
import {
  getSelectionPhases,
  createSelectionPhase,
  updateSelectionPhase
} from '../../services/adminPhaseService'
import './Adminallocationcontrol.css'

const TICK_MS = 30000

const QUICK_DURATIONS = [
  { label: '3 days', days: 3 },
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 }
]

export const PHASES = [
  {
    phase: 'OWN_IDEA',
    step: 1,
    title: 'Student Ideas',
    description: 'Students can submit their own project ideas.',
    icon: 'bulb'
  },
  {
    phase: 'FACULTY_PROJECT',
    step: 2,
    title: 'Faculty Projects',
    description: 'Students can view and apply for faculty proposed projects.',
    icon: 'home'
  },
  {
    phase: 'PROJECT_BANK',
    step: 3,
    title: 'Project Bank',
    description: 'Students can view project bank problem statements and apply.',
    icon: 'layers'
  }
]

export function getWindowState(window, now) {
  if (!window) return { status: 'LOCKED', reason: 'NOT_SCHEDULED' }
  if (!window.isActive) return { status: 'LOCKED', reason: 'CANCELLED' }

  const start = new Date(window.startDate)
  const end = new Date(window.endDate)

  if (now < start) return { status: 'LOCKED', reason: 'SCHEDULED' }
  if (now > end) return { status: 'CLOSED', reason: 'ENDED' }

  return { status: 'OPEN', reason: 'OPEN' }
}

export function findOverlap(windows, phase, start, end) {
  return (
    windows.find(
      (item) =>
        item.isActive &&
        item.phase !== phase &&
        new Date(item.startDate) < end &&
        new Date(item.endDate) > start
    ) || null
  )
}

export function formatRemaining(end, now) {
  const diff = new Date(end).getTime() - now.getTime()

  if (diff <= 60000) return 'less than a minute'

  const totalMinutes = Math.floor(diff / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`

  return `${minutes}m`
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export function toLocalInput(value) {
  const date = new Date(value)

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function addDays(value, days) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function Icon({ children }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function PhaseIcon({ name }) {
  if (name === 'bulb') {
    return (
      <Icon>
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
      </Icon>
    )
  }

  if (name === 'home') {
    return (
      <Icon>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M10 20v-6h4v6" />
      </Icon>
    )
  }

  return (
    <Icon>
      <path d="M12 2l10 5-10 5L2 7z" />
      <path d="M2 12l10 5 10-5" />
      <path d="M2 17l10 5 10-5" />
    </Icon>
  )
}

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function StatusPill({ status }) {
  const className =
    status === 'OPEN' ? 'open' : status === 'CLOSED' ? 'closed' : 'upcoming'

  return (
    <span className={`status-pill ${className}`}>
      {status === 'OPEN' ? <span className="alloc-dot" /> : null}
      {status === 'LOCKED' ? <LockIcon /> : null}
      {status}
    </span>
  )
}

function getMetaRows(window, state) {
  if (state.reason === 'NOT_SCHEDULED') {
    return [
      ['Opens On', 'Not scheduled'],
      ['Closes On', '-']
    ]
  }

  if (state.reason === 'CANCELLED') {
    return [
      ['Opens On', 'Schedule cancelled'],
      ['Closes On', '-']
    ]
  }

  if (state.reason === 'SCHEDULED') {
    return [
      ['Opens On', formatDateTime(window.startDate)],
      ['Closes On', formatDateTime(window.endDate)]
    ]
  }

  if (state.reason === 'ENDED') {
    return [
      ['Opened On', formatDateTime(window.startDate)],
      ['Closed On', formatDateTime(window.endDate)]
    ]
  }

  return [
    ['Opened On', formatDateTime(window.startDate)],
    ['Closes On', formatDateTime(window.endDate)]
  ]
}

function AdminAllocationControl() {
  const [windows, setWindows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [dialog, setDialog] = useState(null)
  const [dialogError, setDialogError] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [confirmError, setConfirmError] = useState('')
  const [busy, setBusy] = useState(false)

  function fetchWindows() {
    return getSelectionPhases().then((list) => setWindows(list))
  }

  function loadWindows() {
    setLoading(true)
    setLoadError('')
    fetchWindows()
      .catch((error) => {
        setLoadError(error.message || 'Could not load the stage schedule')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadWindows()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS)
    return () => clearInterval(timer)
  }, [])

  const cards = PHASES.map((meta) => {
    const window = windows.find((item) => item.phase === meta.phase) || null
    return { meta, window, state: getWindowState(window, now) }
  })

  const openCard = cards.find((card) => card.state.status === 'OPEN') || null

  function openDialog(card, mode) {
    const keepDates = mode === 'edit' || card.state.reason === 'SCHEDULED'
    const start = keepDates ? new Date(card.window.startDate) : new Date()
    const end = keepDates ? new Date(card.window.endDate) : addDays(start, 7)

    setDialogError('')
    setDialog({
      mode,
      phase: card.meta.phase,
      title: card.meta.title,
      windowId: card.window ? card.window.id : null,
      start: toLocalInput(start),
      end: toLocalInput(end)
    })
  }

  function setQuickDuration(days) {
    const start = new Date(dialog.start)
    const base = Number.isNaN(start.getTime()) ? new Date() : start
    setDialog({ ...dialog, end: toLocalInput(addDays(base, days)) })
  }

  async function submitDialog(event) {
    event.preventDefault()
    setDialogError('')

    const start = new Date(dialog.start)
    const end = new Date(dialog.end)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setDialogError('Choose both a start and an end date and time.')
      return
    }

    if (end <= start) {
      setDialogError('The end must be after the start.')
      return
    }

    if (end <= new Date()) {
      setDialogError('The end must be in the future.')
      return
    }

    const clash = findOverlap(windows, dialog.phase, start, end)

    if (clash) {
      const clashMeta = PHASES.find((item) => item.phase === clash.phase)
      setDialogError(
        `${clashMeta.title} is already set from ${formatDateTime(
          clash.startDate
        )} to ${formatDateTime(
          clash.endDate
        )}. Stages cannot overlap - close it first or choose different dates.`
      )
      return
    }

    setBusy(true)

    try {
      const dates = {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }

      if (dialog.windowId) {
        await updateSelectionPhase(dialog.windowId, {
          ...dates,
          isActive: true
        })
      } else {
        await createSelectionPhase({
          phase: dialog.phase,
          ...dates,
          isActive: true
        })
      }

      await fetchWindows()
      setDialog(null)
    } catch (error) {
      setDialogError(error.message || 'Could not save this period')
    } finally {
      setBusy(false)
    }
  }

  async function runConfirm() {
    setBusy(true)
    setConfirmError('')

    try {
      if (confirm.action === 'close') {
        await updateSelectionPhase(confirm.windowId, {
          endDate: new Date().toISOString()
        })
      } else {
        await updateSelectionPhase(confirm.windowId, { isActive: false })
      }

      await fetchWindows()
      setConfirm(null)
    } catch (error) {
      setConfirmError(error.message || 'Could not update this stage')
    } finally {
      setBusy(false)
    }
  }

  function closeDialog() {
    if (!busy) setDialog(null)
  }

  function closeConfirm() {
    if (busy) return
    setConfirm(null)
    setConfirmError('')
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Allocation Control</h1>
        </div>

        <div className="loading-state">Loading stage schedule...</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Allocation Control</h1>
        </div>

        <div className="locked-state">
          <div className="locked-state-title">
            Could not load the stage schedule
          </div>

          <p className="locked-state-text">{loadError}</p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadWindows}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-heading">Allocation Control</h1>

        <p className="page-subtext">
          Control the availability of project categories for students. Open one
          stage at a time for a set period, and it closes automatically when
          the period ends.
        </p>
      </div>

      <div className={openCard ? 'alloc-summary open' : 'alloc-summary'}>
        <span className="alloc-summary-dot" />

        {openCard ? (
          <span>
            <strong>{openCard.meta.title}</strong> is open for students. It
            closes automatically on {formatDateTime(openCard.window.endDate)}{' '}
            (in {formatRemaining(openCard.window.endDate, now)}).
          </span>
        ) : (
          <span>No stage is open for students right now.</span>
        )}
      </div>

      <h2 className="alloc-section-title">
        Project Categories &amp; Access Control
      </h2>

      <div className="alloc-grid">
        {cards.map((card) => {
          const { meta, window, state } = card
          const isOpen = state.status === 'OPEN'
          const rows = getMetaRows(window, state)

          return (
            <div
              key={meta.phase}
              className={isOpen ? 'alloc-card open' : 'alloc-card'}
            >
              <span className="alloc-step">STEP {meta.step}</span>

              <div className="alloc-head">
                <div className="alloc-icon">
                  <PhaseIcon name={meta.icon} />
                </div>

                <div>
                  <div className="alloc-title">{meta.title}</div>

                  <div className="alloc-desc">{meta.description}</div>
                </div>
              </div>

              <div className="alloc-status-row">
                <StatusPill status={state.status} />
              </div>

              {rows.map(([label, value]) => (
                <div className="alloc-meta" key={label}>
                  <div className="alloc-meta-label">{label}</div>

                  <div className="alloc-meta-value">{value}</div>
                </div>
              ))}

              {isOpen ? (
                <div className="alloc-remaining">
                  Closes automatically in{' '}
                  {formatRemaining(window.endDate, now)}
                </div>
              ) : null}

              {state.reason === 'SCHEDULED' ? (
                <div className="alloc-remaining">
                  Opens automatically in{' '}
                  {formatRemaining(window.startDate, now)}
                </div>
              ) : null}

              <div className="alloc-actions">
                {isOpen ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-block"
                      onClick={() => {
                        setConfirmError('')
                        setConfirm({
                          action: 'close',
                          title: meta.title,
                          windowId: window.id
                        })
                      }}
                    >
                      Close
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-block"
                      onClick={() => openDialog(card, 'edit')}
                    >
                      Change Period
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      onClick={() => openDialog(card, 'open')}
                    >
                      {state.status === 'CLOSED' ? 'Reopen' : 'Open'}
                    </button>

                    {state.reason === 'SCHEDULED' ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-block"
                        onClick={() => {
                          setConfirmError('')
                          setConfirm({
                            action: 'cancel',
                            title: meta.title,
                            windowId: window.id
                          })
                        }}
                      >
                        Cancel Schedule
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {dialog ? (
        <div className="modal-overlay" onClick={closeDialog}>
          <form
            className="modal"
            onClick={(event) => event.stopPropagation()}
            onSubmit={submitDialog}
          >
            <h2 className="modal-title">
              {dialog.mode === 'edit'
                ? `Change period for ${dialog.title}`
                : `Open ${dialog.title}`}
            </h2>

            <p className="modal-text">
              Choose when this stage opens and closes. It opens and closes
              automatically at these times, and only one stage can be open at a
              time.
            </p>

            <div className="alloc-dialog-grid">
              <div className="field-group">
                <label className="field-label" htmlFor="alloc-start">
                  Opens On
                </label>

                <input
                  id="alloc-start"
                  type="datetime-local"
                  className="field-input"
                  value={dialog.start}
                  onChange={(event) =>
                    setDialog({ ...dialog, start: event.target.value })
                  }
                  required
                />
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="alloc-end">
                  Closes On
                </label>

                <input
                  id="alloc-end"
                  type="datetime-local"
                  className="field-input"
                  value={dialog.end}
                  onChange={(event) =>
                    setDialog({ ...dialog, end: event.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="alloc-quick">
              <span className="alloc-quick-label">Open for</span>

              {QUICK_DURATIONS.map((item) => (
                <button
                  type="button"
                  key={item.days}
                  className="alloc-quick-btn"
                  onClick={() => setQuickDuration(item.days)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {dialogError ? <div className="form-error">{dialogError}</div> : null}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={closeDialog}
              >
                Cancel
              </button>

              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy
                  ? 'Saving...'
                  : dialog.mode === 'edit'
                    ? 'Save Period'
                    : 'Save and Open'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {confirm ? (
        <div className="modal-overlay" onClick={closeConfirm}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="modal-title">
              {confirm.action === 'close'
                ? `Close ${confirm.title} now?`
                : `Cancel the ${confirm.title} schedule?`}
            </h2>

            <p className="modal-text">
              {confirm.action === 'close'
                ? 'Students will no longer be able to use this stage. You can reopen it later with a new period.'
                : 'The stage will stay locked and will not open on its scheduled date.'}
            </p>

            {confirmError ? <div className="form-error">{confirmError}</div> : null}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={busy}
                onClick={closeConfirm}
              >
                Keep as is
              </button>

              <button
                type="button"
                className="btn btn-danger"
                disabled={busy}
                onClick={runConfirm}
              >
                {busy
                  ? 'Updating...'
                  : confirm.action === 'close'
                    ? 'Close Stage'
                    : 'Cancel Schedule'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminAllocationControl
