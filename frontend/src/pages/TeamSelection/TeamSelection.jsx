import { useCallback, useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import {
  getMyTeam,
  createTeam,
  getAvailableTeamMembers,
  sendTeamRequest,
  getSentTeamRequests,
  completeTeam,
  getReceivedTeamRequests,
  acceptTeamRequest,
  rejectTeamRequest,
  cancelTeamRequest
} from '../../services/teamService'

import './Teamselection.css'

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
}

function TeamSelection() {
  const navigate = useNavigate()

  const [myTeam, setMyTeam] = useState(null)
  const [receivedRequests, setReceivedRequests] = useState([])
  const [availableMembers, setAvailableMembers] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const [team, received] = await Promise.all([
        getMyTeam(),
        getReceivedTeamRequests()
      ])

      setMyTeam(team)
      setReceivedRequests(received)

      if (team && team.status === 'FORMING') {
        const [members, sent] = await Promise.all([
          getAvailableTeamMembers(),
          getSentTeamRequests(team.id)
        ])

        setAvailableMembers(members)
        setSentRequests(sent)
      } else {
        setAvailableMembers([])
        setSentRequests([])
      }
    } catch (error) {
      setLoadError(
        error.message || 'Could not load your team'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  async function runAction(action) {
    setActionError('')

    try {
      await action()
      await loadAll()
    } catch (error) {
      setActionError(
        error.message || 'That action could not be completed'
      )
    }
  }

  async function handleCreateTeam() {
    setActionError('')
    setCreating(true)

    try {
      await createTeam()
      await loadAll()
    } catch (error) {
      setActionError(
        error.message || 'Could not create a team'
      )
    } finally {
      setCreating(false)
    }
  }

  const pendingStudentIds = sentRequests
    .filter((request) => request.status === 'PENDING')
    .map((request) => request.student?.id)

  const filteredMembers = availableMembers.filter((member) => {
    if (pendingStudentIds.includes(member.id)) return false

    const term = query.toLowerCase()

    return (
      member.name.toLowerCase().includes(term) ||
      member.department.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term)
    )
  })

  const totalSize = myTeam
    ? 1 + myTeam.members.length
    : 0

  const canComplete =
    totalSize >= 2 && totalSize <= 4

  const pendingReceived = receivedRequests.filter(
    (request) => request.status === 'PENDING'
  )

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-heading">
              Team Selection
            </h1>

            <p className="page-subtext">
              Form your project team here. Invited students must
              accept from their own account before they become
              permanent team members, and a completed team is
              required before you can submit a project proposal.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              navigate('/project-selection')
            }
          >
            Back to Project Selection
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          Loading your team...
        </div>
      ) : loadError ? (
        <div className="locked-state">
          <div className="locked-state-title">
            Could not load Team Selection
          </div>

          <p className="locked-state-text">
            {loadError}
          </p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadAll}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {actionError ? (
            <div className="team-action-error">
              {actionError}
            </div>
          ) : null}

          <div className="team-layout">
            <div className="team-panel">
              <div className="team-panel-header">
                <h2 className="section-heading-sm">
                  My Team
                </h2>

                {myTeam ? (
                  <span className="status-pill upcoming">
                    {myTeam.status}
                  </span>
                ) : null}
              </div>

              {!myTeam ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <span aria-hidden="true">👥</span>
                  </div>

                  <div className="empty-state-title">
                    You don't have a team yet
                  </div>

                  <p className="empty-state-text">
                    Create a team to become its leader and start
                    inviting classmates.
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: 14 }}
                    disabled={creating}
                    onClick={handleCreateTeam}
                  >
                    {creating
                      ? 'Creating...'
                      : 'Create Team'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="team-roster">
                    <div className="team-roster-item">
                      <div className="team-candidate-avatar lead">
                        {initials(myTeam.leader.name)}
                      </div>

                      <div className="team-candidate-info">
                        <div className="team-candidate-name">
                          {myTeam.leader.name}
                        </div>

                        <div className="team-candidate-meta">
                          {myTeam.leader.department} · Leader
                        </div>
                      </div>
                    </div>

                    {myTeam.members.map((member) => (
                      <div
                        className="team-roster-item"
                        key={member.id}
                      >
                        <div className="team-candidate-avatar">
                          {initials(member.name)}
                        </div>

                        <div className="team-candidate-info">
                          <div className="team-candidate-name">
                            {member.name}
                          </div>

                          <div className="team-candidate-meta">
                            {member.department}
                          </div>
                        </div>

                        <span className="status-pill open">
                          Member
                        </span>
                      </div>
                    ))}
                  </div>

                  {myTeam.status === 'FORMING' ? (
                    <>
                      <p
                        className="field-hint"
                        style={{ marginTop: 14 }}
                      >
                        {totalSize} of 4 students so far. A team
                        needs 2 to 4 students before it can be
                        marked complete.
                      </p>

                      <button
                        type="button"
                        className="btn btn-primary btn-block"
                        style={{ marginTop: 10 }}
                        disabled={!canComplete}
                        onClick={() =>
                          runAction(() =>
                            completeTeam(myTeam.id)
                          )
                        }
                      >
                        Mark Team Complete
                      </button>

                      <div
                        className="search-control"
                        style={{ marginTop: 20 }}
                      >
                        <span aria-hidden="true">⌕</span>

                        <input
                          type="text"
                          value={query}
                          placeholder="Search classmates by name or email"
                          onChange={(event) =>
                            setQuery(event.target.value)
                          }
                        />
                      </div>

                      <div className="team-candidate-list">
                        {filteredMembers.length ? (
                          filteredMembers.map((member) => (
                            <div
                              className="team-candidate-item"
                              key={member.id}
                            >
                              <div className="team-candidate-avatar">
                                {initials(member.name)}
                              </div>

                              <div className="team-candidate-info">
                                <div className="team-candidate-name">
                                  {member.name}
                                </div>

                                <div className="team-candidate-meta">
                                  {member.department}
                                </div>
                              </div>

                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                disabled={totalSize >= 4}
                                onClick={() =>
                                  runAction(() =>
                                    sendTeamRequest(
                                      myTeam.id,
                                      member.id
                                    )
                                  )
                                }
                              >
                                <span aria-hidden="true">
                                  ＋
                                </span>
                                Invite
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="empty-state">
                            <div className="empty-state-title">
                              No classmates found
                            </div>

                            <p className="empty-state-text">
                              Try a different search term.
                            </p>
                          </div>
                        )}
                      </div>

                      {sentRequests.length ? (
                        <div
                          className="team-roster"
                          style={{ marginTop: 14 }}
                        >
                          {sentRequests.map((request) => (
                            <div
                              className="team-roster-item"
                              key={request.id}
                            >
                              <div className="team-candidate-avatar">
                                {request.student
                                  ? initials(
                                      request.student.name
                                    )
                                  : '?'}
                              </div>

                              <div className="team-candidate-info">
                                <div className="team-candidate-name">
                                  {request.student?.name ||
                                    'Unknown student'}
                                </div>

                                <div className="team-candidate-meta">
                                  Invitation sent
                                </div>
                              </div>

                              {request.status === 'PENDING' ? (
                                <>
                                  <span className="status-pill upcoming">
                                    Pending
                                  </span>

                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() =>
                                      runAction(() =>
                                        cancelTeamRequest(
                                          request.id
                                        )
                                      )
                                    }
                                  >
                                    <span aria-hidden="true">
                                      ×
                                    </span>
                                    Cancel
                                  </button>
                                </>
                              ) : request.status === 'ACCEPTED' ? (
                                <span className="status-pill open">
                                  Accepted
                                </span>
                              ) : (
                                <span className="status-pill closed">
                                  {request.status}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary btn-block"
                      style={{ marginTop: 14 }}
                      onClick={() =>
                        navigate(
                          '/project-selection/student-idea'
                        )
                      }
                    >
                      Continue to Submit Your Proposal
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="team-panel">
              <div className="team-panel-header">
                <h2 className="section-heading-sm">
                  Invitations For You
                </h2>
              </div>

              {pendingReceived.length ? (
                <div className="team-roster">
                  {pendingReceived.map((request) => (
                    <div
                      className="team-roster-item"
                      key={request.id}
                    >
                      <div className="team-candidate-avatar">
                        {request.requester
                          ? initials(
                              request.requester.name
                            )
                          : '?'}
                      </div>

                      <div className="team-candidate-info">
                        <div className="team-candidate-name">
                          {request.requester?.name ||
                            'A classmate'}{' '}
                          invited you
                        </div>

                        <div className="team-candidate-meta">
                          {request.requester?.department}
                        </div>
                      </div>

                      <div className="team-roster-item-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            runAction(() =>
                              acceptTeamRequest(
                                request.id
                              )
                            )
                          }
                        >
                          <span aria-hidden="true">
                            ✓
                          </span>
                          Accept
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            runAction(() =>
                              rejectTeamRequest(
                                request.id
                              )
                            )
                          }
                        >
                          <span aria-hidden="true">
                            ↶
                          </span>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <span aria-hidden="true">👥</span>
                  </div>

                  <div className="empty-state-title">
                    No pending invitations
                  </div>

                  <p className="empty-state-text">
                    If a team leader invites you, their request
                    will show up here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default TeamSelection