import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getProjectBankProjects,
  hideProjectBankProject
} from '../../services/adminProjectService'
import './Adminprojectbank.css'

const PAGE_SIZE = 10

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  RESERVED: 'Reserved',
  ALLOCATED: 'Allocated',
  HIDDEN: 'Hidden'
}

function Icon({ size = 15, children }) {
  return (
    <svg
      width={size}
      height={size}
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

function PlusIcon() {
  return (
    <Icon>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  )
}

function SearchIcon() {
  return (
    <Icon>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </Icon>
  )
}

function EyeIcon() {
  return (
    <Icon>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  )
}

function TrashIcon() {
  return (
    <Icon>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Icon>
  )
}

function UploadIcon() {
  return (
    <Icon size={22}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16V8" />
      <path d="M8.5 11.5L12 8l3.5 3.5" />
    </Icon>
  )
}

function StatusPill({ status }) {
  return (
    <span className={`status-pill ${status.toLowerCase()}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function shortId(id) {
  return `PB-${String(id).slice(-6).toUpperCase()}`
}

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const pages = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pages.push('start-gap')

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (end < total - 1) pages.push('end-gap')

  pages.push(total)

  return pages
}

function AdminProjectBank() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [activeProject, setActiveProject] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [fileError, setFileError] = useState('')

  function fetchProjects() {
    return getProjectBankProjects().then((list) => setProjects(list))
  }

  function loadProjects() {
    setLoading(true)
    setLoadError('')
    fetchProjects()
      .catch((error) => {
        setLoadError(error.message || 'Could not load project bank projects')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const domains = useMemo(() => {
    return [
      ...new Set(projects.map((project) => project.domain).filter(Boolean))
    ].sort()
  }, [projects])

  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim()

    return projects.filter((project) => {
      const matchesQuery =
        !term ||
        project.title?.toLowerCase().includes(term) ||
        project.domain?.toLowerCase().includes(term) ||
        shortId(project.id).toLowerCase().includes(term) ||
        project.technologies.some((tech) => tech.toLowerCase().includes(term))

      const matchesDomain = domain ? project.domain === domain : true
      const matchesStatus = status ? project.visibilityStatus === status : true

      return matchesQuery && matchesDomain && matchesStatus
    })
  }, [projects, query, domain, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )
  const showingFrom = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0
  const showingTo = Math.min(currentPage * PAGE_SIZE, filtered.length)
  const filtersActive = Boolean(query || domain || status)

  function updateFilter(setter, value) {
    setter(value)
    setPage(1)
  }

  function clearFilters() {
    setQuery('')
    setDomain('')
    setStatus('')
    setPage(1)
  }

  function handleFile(file) {
    if (!file) return

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setFileError('Please choose an Excel file (.xlsx or .xls)')
      return
    }

    setFileError('')
    navigate('/admin/project-bank/upload', { state: { file } })
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  function closeDelete() {
    if (deleting) return
    setPendingDelete(null)
    setDeleteError('')
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError('')

    try {
      await hideProjectBankProject(pendingDelete.id)
      await fetchProjects()

      if (activeProject?.id === pendingDelete.id) {
        setActiveProject(null)
      }

      setPendingDelete(null)
    } catch (error) {
      setDeleteError(error.message || 'Could not remove this project')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Project Bank Details</h1>
        </div>

        <div className="loading-state">Loading project bank...</div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-heading">Project Bank Details</h1>
        </div>

        <div className="locked-state">
          <div className="locked-state-title">
            Could not load the project bank
          </div>

          <p className="locked-state-text">{loadError}</p>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={loadProjects}
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
        <h1 className="page-heading">Project Bank Details</h1>

        <p className="page-subtext">
          You can upload projects manually or with an Excel file. Added
          projects appear in the student Project Bank.
        </p>
      </div>

      <div className="admin-add-grid">
        <div className="admin-card">
          <h2 className="admin-card-title">Add Project Manually</h2>

          <p className="admin-card-subtitle">Add a single project manually.</p>

          <button
            type="button"
            className="btn btn-primary admin-card-button"
            onClick={() => navigate('/admin/project-bank/add')}
          >
            <PlusIcon />
            Add Project
          </button>
        </div>

        <div className="admin-or">OR</div>

        <div className="admin-card">
          <h2 className="admin-card-title">Upload Projects (Excel)</h2>

          <p className="admin-card-subtitle">
            Upload an Excel sheet containing multiple projects.
          </p>

          <div
            className={
              dragging ? 'admin-dropzone dragging' : 'admin-dropzone'
            }
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="admin-dropzone-icon">
              <UploadIcon />
            </div>

            <div className="admin-dropzone-text">
              Drag and drop your Excel file here
            </div>

            <div className="admin-dropzone-or">or</div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Excel File
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="admin-file-input"
              onChange={(event) => {
                handleFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />

            <div className="admin-dropzone-hint">
              Supported format: .xlsx, .xls
            </div>
          </div>

          {fileError ? <div className="form-error">{fileError}</div> : null}
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-control">
          <SearchIcon />

          <input
            type="text"
            value={query}
            placeholder="Search by project ID, title, domain or technology"
            onChange={(event) => updateFilter(setQuery, event.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={domain}
          onChange={(event) => updateFilter(setDomain, event.target.value)}
        >
          <option value="">All Domains</option>

          {domains.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={status}
          onChange={(event) => updateFilter(setStatus, event.target.value)}
        >
          <option value="">All Status</option>

          {Object.keys(STATUS_LABELS).map((item) => (
            <option key={item} value={item}>
              {STATUS_LABELS[item]}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn btn-secondary"
          disabled={!filtersActive}
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      {filtered.length ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Project ID</th>
                  <th>Project Title</th>
                  <th>Domain</th>
                  <th>Technologies</th>
                  <th>SDG Goal</th>
                  <th>Status</th>
                  <th>Uploaded On</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {pageItems.map((project, index) => {
                  const removable = project.visibilityStatus === 'AVAILABLE'

                  return (
                    <tr key={project.id}>
                      <td className="admin-table-index">
                        {(currentPage - 1) * PAGE_SIZE + index + 1}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="admin-id-link"
                          onClick={() => setActiveProject(project)}
                        >
                          {shortId(project.id)}
                        </button>
                      </td>

                      <td className="admin-table-title">{project.title}</td>

                      <td>
                        <span className="admin-chip">{project.domain}</span>
                      </td>

                      <td>
                        <div className="admin-tag-row">
                          {project.technologies.slice(0, 2).map((tech) => (
                            <span key={tech} className="tech-tag">
                              {tech}
                            </span>
                          ))}

                          {project.technologies.length > 2 ? (
                            <span className="admin-more">
                              +{project.technologies.length - 2}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="admin-table-sdg">
                        {project.sdgGoals[0] || '-'}

                        {project.sdgGoals.length > 1 ? (
                          <span className="admin-more">
                            {' '}
                            +{project.sdgGoals.length - 1}
                          </span>
                        ) : null}
                      </td>

                      <td>
                        <StatusPill status={project.visibilityStatus} />
                      </td>

                      <td>
                        <div className="admin-date">
                          {formatDate(project.createdAt)}
                        </div>

                        <div className="admin-time">
                          {formatTime(project.createdAt)}
                        </div>
                      </td>

                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label="View project"
                            title="View project"
                            onClick={() => setActiveProject(project)}
                          >
                            <EyeIcon />
                          </button>

                          <button
                            type="button"
                            className="icon-btn danger"
                            aria-label="Remove project"
                            title={
                              removable
                                ? 'Remove from project bank'
                                : 'Only available projects can be removed'
                            }
                            disabled={!removable}
                            onClick={() => {
                              setDeleteError('')
                              setPendingDelete(project)
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-table-footer">
            <div className="admin-showing">
              Showing {showingFrom} to {showingTo} of {filtered.length}{' '}
              project{filtered.length === 1 ? '' : 's'}
            </div>

            <div className="pagination">
              <button
                type="button"
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Previous page"
              >
                ‹
              </button>

              {buildPageList(currentPage, totalPages).map((item) =>
                typeof item === 'number' ? (
                  <button
                    type="button"
                    key={item}
                    className={
                      item === currentPage ? 'page-btn active' : 'page-btn'
                    }
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={item} className="page-ellipsis">
                    ...
                  </span>
                )
              )}

              <button
                type="button"
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-title">
            {projects.length
              ? 'No projects match your filters'
              : 'No projects in the project bank yet'}
          </div>

          <p className="empty-state-text">
            {projects.length
              ? 'Try a different search term or clear the filters.'
              : 'Add a project manually or upload an Excel sheet to get started.'}
          </p>
        </div>
      )}

      {activeProject ? (
        <div
          className="project-drawer-overlay"
          onClick={() => setActiveProject(null)}
        >
          <div
            className="project-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="project-drawer-header">
              <div>
                <h2 className="project-drawer-title">{activeProject.title}</h2>

                <p className="project-drawer-subtitle">
                  {shortId(activeProject.id)} · {activeProject.domain}
                </p>
              </div>

              <button
                type="button"
                className="project-drawer-close"
                onClick={() => setActiveProject(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="project-drawer-body">
              <div className="detail-block">
                <div className="detail-block-label">Status</div>

                <StatusPill status={activeProject.visibilityStatus} />
              </div>

              <div className="detail-block">
                <div className="detail-block-label">Description</div>

                <p className="detail-block-text">{activeProject.description}</p>
              </div>

              {activeProject.specificFunctionalities.length ? (
                <div className="detail-block">
                  <div className="detail-block-label">
                    Specific Functionalities
                  </div>

                  <ul className="detail-list">
                    {activeProject.specificFunctionalities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="detail-block">
                <div className="detail-block-label">Technologies</div>

                <div className="tech-tag-list">
                  {activeProject.technologies.map((tech) => (
                    <span key={tech} className="tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="detail-block">
                <div className="detail-block-label">Aligned SDG Goal</div>

                <div className="tech-tag-list">
                  {activeProject.sdgGoals.length ? (
                    activeProject.sdgGoals.map((goal) => (
                      <span key={goal} className="tech-tag">
                        {goal}
                      </span>
                    ))
                  ) : (
                    <span className="detail-block-text">Not specified</span>
                  )}
                </div>
              </div>

              <div className="detail-block">
                <div className="detail-block-label">Faculty Approver</div>

                <p className="detail-block-text">
                  {activeProject.facultyName || 'Not available'}
                  {activeProject.facultyEmail
                    ? ` · ${activeProject.facultyEmail}`
                    : ''}
                </p>
              </div>

              <div className="detail-block">
                <div className="detail-block-label">Uploaded</div>

                <p className="detail-block-text">
                  {formatDate(activeProject.createdAt)}{' '}
                  {formatTime(activeProject.createdAt)}
                  {activeProject.createdByName
                    ? ` by ${activeProject.createdByName}`
                    : ''}
                </p>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveProject(null)}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={activeProject.visibilityStatus !== 'AVAILABLE'}
                  onClick={() => {
                    setDeleteError('')
                    setPendingDelete(activeProject)
                  }}
                >
                  Remove from Project Bank
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <div className="modal-overlay" onClick={closeDelete}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2 className="modal-title">Remove this project?</h2>

            <p className="modal-text">
              "{pendingDelete.title}" will be hidden from the student Project
              Bank. Reserved or allocated projects cannot be removed.
            </p>

            {deleteError ? <div className="form-error">{deleteError}</div> : null}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deleting}
                onClick={closeDelete}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? 'Removing...' : 'Remove Project'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AdminProjectBank
