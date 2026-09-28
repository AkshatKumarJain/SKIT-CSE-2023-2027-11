import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Check, X, Users, RotateCcw } from 'lucide-react'
import { getStudents } from '../../services/teamService'
import { currentStudent } from '../../data/mockData'
import '../Projectselection/Projectselection.css'

const maxTeamSize = 3

function initials(name) {
  return name.split(' ').map((part) => part[0]).join('')
}

function TeamSelection() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [invites, setInvites] = useState([])

  useEffect(() => {
    let isMounted = true
    getStudents().then((data) => {
      if (isMounted) {
        setStudents(data)
        setLoading(false)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const activeCount = invites.filter((invite) => invite.status !== 'REJECTED').length
  const invitedIds = invites.map((invite) => invite.studentId)
  const acceptedInvites = invites.filter((invite) => invite.status === 'ACCEPTED')

  const filtered = students.filter((student) => {
    if (invitedIds.includes(student.id)) return false
    const term = query.toLowerCase()
    return (
      student.name.toLowerCase().includes(term) ||
      student.rollNumber.toLowerCase().includes(term) ||
      student.branch.toLowerCase().includes(term)
    )
  })

  function sendInvite(student) {
    setInvites((prev) => [...prev, { studentId: student.id, status: 'PENDING' }])
  }

  function respondToInvite(studentId, status) {
    setInvites((prev) =>
      prev.map((invite) => (invite.studentId === studentId ? { ...invite, status } : invite))
    )
  }

  function removeInvite(studentId) {
    setInvites((prev) => prev.filter((invite) => invite.studentId !== studentId))
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Team Selection</h1>
        </div>
        <div className="loading-state">Loading students...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-heading">Team Selection</h1>
            <p className="page-subtext">
              Invite up to {maxTeamSize} teammates to join your project. Each invite is sent as a
              request that the student can accept or reject.
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/project-selection')}>
            Back to Project Selection
          </button>
        </div>
      </div>

      <div className="team-layout">
        <div className="team-panel">
          <div className="team-panel-header">
            <h2 className="section-heading-sm">Find Teammates</h2>
            <span className="results-count-inline">{activeCount} of {maxTeamSize} slots used</span>
          </div>

          <div className="search-control">
            <Search size={15} strokeWidth={2} />
            <input
              type="text"
              value={query}
              placeholder="Search by name, roll number or branch"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {activeCount >= maxTeamSize ? (
            <p className="field-hint" style={{ marginTop: 10 }}>
              You have reached the maximum of {maxTeamSize} teammates. Remove a rejected or
              pending invite to add someone else.
            </p>
          ) : null}

          <div className="team-candidate-list">
            {filtered.length ? (
              filtered.map((student) => (
                <div className="team-candidate-item" key={student.id}>
                  <div className="team-candidate-avatar">{initials(student.name)}</div>
                  <div className="team-candidate-info">
                    <div className="team-candidate-name">{student.name}</div>
                    <div className="team-candidate-meta">{student.rollNumber} · {student.branch}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={activeCount >= maxTeamSize}
                    onClick={() => sendInvite(student)}
                  >
                    <UserPlus size={13} strokeWidth={2} />
                    Invite
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-title">No students found</div>
                <p className="empty-state-text">Try a different search term.</p>
              </div>
            )}
          </div>
        </div>

        <div className="team-panel">
          <div className="team-panel-header">
            <h2 className="section-heading-sm">Your Team</h2>
          </div>

          <div className="team-roster">
            <div className="team-roster-item">
              <div className="team-candidate-avatar lead">{initials(currentStudent.name)}</div>
              <div className="team-candidate-info">
                <div className="team-candidate-name">{currentStudent.name}</div>
                <div className="team-candidate-meta">{currentStudent.rollNumber} · Team Lead</div>
              </div>
              <span className="status-pill open">You</span>
            </div>

            {invites.map((invite) => {
              const student = students.find((item) => item.id === invite.studentId)
              if (!student) return null
              return (
                <div className="team-roster-item" key={invite.studentId}>
                  <div className="team-candidate-avatar">{initials(student.name)}</div>
                  <div className="team-candidate-info">
                    <div className="team-candidate-name">{student.name}</div>
                    <div className="team-candidate-meta">{student.rollNumber} · {student.branch}</div>
                  </div>
                  {invite.status === 'PENDING' ? (
                    <span className="status-pill upcoming">Pending</span>
                  ) : invite.status === 'ACCEPTED' ? (
                    <span className="status-pill open">Accepted</span>
                  ) : (
                    <span className="status-pill closed">Rejected</span>
                  )}
                </div>
              )
            })}

            {invites.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Users size={20} strokeWidth={2} />
                </div>
                <div className="empty-state-title">No teammates invited yet</div>
                <p className="empty-state-text">Search and invite up to {maxTeamSize} students on the left.</p>
              </div>
            ) : null}
          </div>

          {invites.length ? (
            <div className="team-demo-block">
              <p className="field-hint">
                Demo controls - simulate how each invited student would respond to your request.
              </p>
              {invites.map((invite) => {
                const student = students.find((item) => item.id === invite.studentId)
                if (!student) return null
                return (
                  <div className="team-demo-row" key={invite.studentId}>
                    <span className="team-demo-name">{student.name}</span>
                    <div className="team-demo-actions">
                      {invite.status === 'PENDING' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => respondToInvite(invite.studentId, 'ACCEPTED')}
                          >
                            <Check size={13} strokeWidth={2} />
                            Accept
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => respondToInvite(invite.studentId, 'REJECTED')}
                          >
                            <X size={13} strokeWidth={2} />
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => removeInvite(invite.studentId)}
                        >
                          <RotateCcw size={13} strokeWidth={2} />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>

      {acceptedInvites.length ? (
        <div className="team-confirmed-banner">
          <Users size={16} strokeWidth={2} />
          <span>
            Your team is taking shape - {acceptedInvites.length} of {maxTeamSize} invited teammates
            have accepted and can now see this team.
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default TeamSelection
