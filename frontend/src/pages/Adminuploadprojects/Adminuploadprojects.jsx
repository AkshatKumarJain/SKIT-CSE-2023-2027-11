import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  createProjectBankProject,
  getFacultyApprovers
} from '../../services/adminProjectService'
import './Adminuploadprojects.css'

const MAX_ROWS = 200
const MAX_FILE_BYTES = 5 * 1024 * 1024

export const SDG_GOALS = [
  '1. No Poverty',
  '2. Zero Hunger',
  '3. Good Health and Well-being',
  '4. Quality Education',
  '5. Gender Equality',
  '6. Clean Water and Sanitation',
  '7. Affordable and Clean Energy',
  '8. Decent Work and Economic Growth',
  '9. Industry, Innovation and Infrastructure',
  '10. Reduced Inequalities',
  '11. Sustainable Cities and Communities',
  '12. Responsible Consumption and Production',
  '13. Climate Action',
  '14. Life Below Water',
  '15. Life on Land',
  '16. Peace, Justice and Strong Institutions',
  '17. Partnerships for the Goals'
]

const FIELD_ALIASES = {
  title: ['title', 'projecttitle', 'projectname', 'problemstatementtitle'],
  domain: ['domain', 'domaintheme', 'theme', 'category'],
  description: [
    'description',
    'projectdescription',
    'descriptionscopeobjective',
    'descriptionscopeandobjective',
    'scopeobjective',
    'scopeandobjective',
    'problemstatement'
  ],
  specificFunctionalities: [
    'specificfunctionalities',
    'specificfunctionality',
    'functionalities',
    'features',
    'keyfeatures'
  ],
  technologies: [
    'technologies',
    'technologiestobeused',
    'technologystack',
    'techstack',
    'tools'
  ],
  sdgGoals: ['sdggoals', 'sdggoal', 'alignedsdggoal', 'alignedsdggoals', 'sdg'],
  facultyKey: [
    'facultyemail',
    'facultyapproveremail',
    'approveremail',
    'facultyapprover',
    'faculty'
  ]
}

function normalizeKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '')
}

function mapRow(raw) {
  const lookup = {}

  Object.keys(raw).forEach((key) => {
    lookup[normalizeKey(key)] = raw[key]
  })

  const mapped = {}

  Object.keys(FIELD_ALIASES).forEach((field) => {
    const alias = FIELD_ALIASES[field].find(
      (name) => lookup[name] !== undefined && String(lookup[name]).trim() !== ''
    )
    mapped[field] = alias ? String(lookup[alias]) : ''
  })

  return mapped
}

function splitList(value, separator) {
  return String(value)
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseSdgGoals(value) {
  const text = String(value).trim()
  const goals = []
  const errors = []

  if (!text) return { goals, errors }

  const numbers = text.match(/\b\d{1,2}\b/g)

  if (numbers) {
    numbers.forEach((number) => {
      const goal = SDG_GOALS[Number(number) - 1]

      if (!goal) {
        errors.push(`Unknown SDG goal number "${number}"`)
      } else if (!goals.includes(goal)) {
        goals.push(goal)
      }
    })

    return { goals, errors }
  }

  const lowered = text.toLowerCase()

  SDG_GOALS.forEach((goal) => {
    const name = goal.replace(/^\d+\.\s*/, '').toLowerCase()
    if (lowered.includes(name)) goals.push(goal)
  })

  if (!goals.length) errors.push(`Could not recognise SDG goal "${text}"`)

  return { goals, errors }
}

export function parseSheetRows(rawRows) {
  const rows = []
  const seenTitles = new Map()

  rawRows.forEach((raw, index) => {
    const mapped = mapRow(raw)
    const isEmpty = Object.values(mapped).every((value) => !value.trim())

    if (isEmpty) return

    const rowNumber = index + 2
    const errors = []

    const title = mapped.title.trim()
    const domain = mapped.domain.trim()
    const description = mapped.description.trim()
    const specificFunctionalities = splitList(
      mapped.specificFunctionalities,
      /\r?\n|;/
    )
    const technologies = splitList(mapped.technologies, /[,;\n]/)
    const sdg = parseSdgGoals(mapped.sdgGoals)

    if (!title) errors.push('Title is required')
    if (!domain) errors.push('Domain is required')
    if (!description) errors.push('Description is required')
    if (!specificFunctionalities.length) {
      errors.push('Specific functionalities are required')
    }
    if (!technologies.length) errors.push('Technologies are required')

    errors.push(...sdg.errors)

    if (title) {
      const titleKey = title.toLowerCase()

      if (seenTitles.has(titleKey)) {
        errors.push(`Duplicate title (also in row ${seenTitles.get(titleKey)})`)
      } else {
        seenTitles.set(titleKey, rowNumber)
      }
    }

    rows.push({
      rowNumber,
      title,
      domain,
      description,
      specificFunctionalities,
      technologies,
      sdgGoals: sdg.goals,
      facultyKey: mapped.facultyKey.trim(),
      errors
    })
  })

  return rows
}

function resolveApprover(key, faculty, defaultId) {
  const term = key.trim().toLowerCase()

  if (term) {
    const match = faculty.find(
      (member) =>
        member.email.toLowerCase() === term ||
        member.name.toLowerCase() === term
    )

    return match
      ? { id: match.id, name: match.name }
      : { error: `Faculty "${key}" was not found` }
  }

  const fallback = faculty.find((member) => member.id === defaultId)

  if (fallback) return { id: fallback.id, name: fallback.name }

  return {
    error: 'No faculty approver - add a Faculty Email or choose a default approver'
  }
}

function UploadIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16V8" />
      <path d="M8.5 11.5L12 8l3.5 3.5" />
    </svg>
  )
}

function AdminUploadProjects() {
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef(null)
  const initialFile = location.state?.file || null

  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState([])
  const [parseError, setParseError] = useState('')
  const [parsing, setParsing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [faculty, setFaculty] = useState([])
  const [facultyLoading, setFacultyLoading] = useState(true)
  const [facultyError, setFacultyError] = useState('')
  const [defaultFacultyId, setDefaultFacultyId] = useState('')
  const [results, setResults] = useState({})
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    let isMounted = true

    getFacultyApprovers()
      .then((list) => {
        if (isMounted) setFaculty(list)
      })
      .catch((error) => {
        if (isMounted) {
          setFacultyError(error.message || 'Could not load faculty list')
        }
      })
      .finally(() => {
        if (isMounted) setFacultyLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (initialFile) loadFile(initialFile)
  }, [])

  async function loadFile(file) {
    if (!file) return

    setParseError('')

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setParseError('Please choose an Excel file (.xlsx or .xls)')
      return
    }

    if (file.size > MAX_FILE_BYTES) {
      setParseError('This file is larger than 5 MB. Split it into smaller sheets.')
      return
    }

    setParsing(true)

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })
      const rows = parseSheetRows(rawRows)

      if (!rows.length) {
        setParseError(
          'No project rows were found. Check that the first sheet has the template headers and at least one row.'
        )
        return
      }

      if (rows.length > MAX_ROWS) {
        setParseError(
          `This sheet has ${rows.length} rows. Upload at most ${MAX_ROWS} projects at a time.`
        )
        return
      }

      setParsedRows(rows)
      setFileName(file.name)
      setResults({})
    } catch (error) {
      setParseError(
        'Could not read this file. Make sure it is a valid Excel sheet.'
      )
    } finally {
      setParsing(false)
    }
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragging(false)
    loadFile(event.dataTransfer.files?.[0])
  }

  function resetFile() {
    setParsedRows([])
    setFileName('')
    setResults({})
    setParseError('')
  }

  const resolvedRows = useMemo(() => {
    return parsedRows.map((row) => {
      const errors = [...row.errors]
      const approver = resolveApprover(row.facultyKey, faculty, defaultFacultyId)

      if (approver.error) errors.push(approver.error)

      return {
        ...row,
        errors,
        facultyId: approver.id || '',
        facultyName: approver.name || '',
        valid: errors.length === 0
      }
    })
  }, [parsedRows, faculty, defaultFacultyId])

  const validRows = resolvedRows.filter((row) => row.valid)
  const invalidCount = resolvedRows.length - validRows.length
  const resultValues = Object.values(results)
  const doneCount = resultValues.filter((item) => item.status === 'done').length
  const failedCount = resultValues.filter((item) => item.status === 'failed').length
  const readyRows = validRows.filter(
    (row) => results[row.rowNumber]?.status !== 'done'
  )
  const progress = validRows.length
    ? Math.round(((doneCount + failedCount) / validRows.length) * 100)
    : 0
  const finished = !importing && doneCount + failedCount > 0

  async function runImport(rows) {
    setImporting(true)

    for (const row of rows) {
      setResults((prev) => ({
        ...prev,
        [row.rowNumber]: { status: 'importing' }
      }))

      try {
        await createProjectBankProject({
          title: row.title,
          domain: row.domain,
          description: row.description,
          specificFunctionalities: row.specificFunctionalities,
          technologies: row.technologies,
          sdgGoals: row.sdgGoals,
          facultyId: row.facultyId
        })

        setResults((prev) => ({
          ...prev,
          [row.rowNumber]: { status: 'done' }
        }))
      } catch (error) {
        setResults((prev) => ({
          ...prev,
          [row.rowNumber]: {
            status: 'failed',
            message: error.message || 'Import failed'
          }
        }))
      }
    }

    setImporting(false)
  }

  function renderStatus(row) {
    const result = results[row.rowNumber]

    if (result?.status === 'importing') {
      return <span className="status-pill upcoming">Importing...</span>
    }

    if (result?.status === 'done') {
      return <span className="status-pill available">Imported</span>
    }

    if (result?.status === 'failed') {
      return (
        <div>
          <span className="status-pill invalid">Failed</span>
          <div className="row-error-list">{result.message}</div>
        </div>
      )
    }

    if (row.valid) {
      return <span className="status-pill upcoming">Ready</span>
    }

    return (
      <div>
        <span className="status-pill invalid">Needs fixing</span>

        <ul className="row-error-list">
          {row.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-heading">Upload Projects (Excel)</h1>

            <p className="page-subtext">
              Upload an Excel sheet with the same fields as the manual form.
              Rows are checked before anything is saved, and valid rows are
              added to the student Project Bank.
            </p>
          </div>

          <div className="upload-header-actions">
            <a
              className="btn btn-secondary"
              href="/project-bank-template.xlsx"
              download
            >
              Download Template
            </a>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/project-bank')}
            >
              Back to Project Bank
            </button>
          </div>
        </div>
      </div>

      {parseError ? <div className="form-error">{parseError}</div> : null}

      {!parsedRows.length ? (
        <div
          className={dragging ? 'admin-dropzone large dragging' : 'admin-dropzone large'}
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
            {parsing
              ? 'Reading your file...'
              : 'Drag and drop your Excel file here'}
          </div>

          <div className="admin-dropzone-or">or</div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={parsing}
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
              loadFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />

          <div className="admin-dropzone-hint">
            Supported format: .xlsx, .xls · up to {MAX_ROWS} projects
          </div>
        </div>
      ) : (
        <>
          <div className="upload-file-bar">
            <div>
              <div className="upload-file-name">{fileName}</div>

              <div className="upload-file-meta">
                {resolvedRows.length} row{resolvedRows.length === 1 ? '' : 's'}{' '}
                found
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={importing}
              onClick={resetFile}
            >
              Choose a Different File
            </button>
          </div>

          <div className="upload-summary">
            <div className="upload-summary-stat">
              <div className="upload-summary-value">{resolvedRows.length}</div>
              <div className="upload-summary-label">Total Rows</div>
            </div>

            <div className="upload-summary-stat">
              <div className="upload-summary-value ok">{validRows.length}</div>
              <div className="upload-summary-label">Ready to Import</div>
            </div>

            <div className="upload-summary-stat">
              <div className="upload-summary-value bad">{invalidCount}</div>
              <div className="upload-summary-label">Need Fixing</div>
            </div>

            <div className="upload-summary-stat">
              <div className="upload-summary-value ok">{doneCount}</div>
              <div className="upload-summary-label">Imported</div>
            </div>
          </div>

          <div className="upload-approver">
            <div>
              <div className="upload-approver-title">
                Default Faculty Approver
              </div>

              <div className="upload-approver-text">
                Used for rows that have no Faculty Email column value. Rows
                with a Faculty Email use that faculty member instead.
              </div>
            </div>

            <select
              className="field-select upload-approver-select"
              value={defaultFacultyId}
              disabled={facultyLoading || importing}
              onChange={(event) => setDefaultFacultyId(event.target.value)}
            >
              <option value="">
                {facultyLoading ? 'Loading faculty...' : 'No default approver'}
              </option>

              {faculty.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          {facultyError ? <div className="form-error">{facultyError}</div> : null}

          {importing || finished ? (
            <div className="upload-progress">
              <div className="upload-progress-track">
                <div
                  className="upload-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="upload-progress-text">
                {importing
                  ? `Importing... ${doneCount + failedCount} of ${validRows.length} processed`
                  : `Finished: ${doneCount} imported, ${failedCount} failed`}
              </div>
            </div>
          ) : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Project Title</th>
                  <th>Domain</th>
                  <th>Technologies</th>
                  <th>SDG Goals</th>
                  <th>Faculty Approver</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {resolvedRows.map((row) => (
                  <tr key={row.rowNumber}>
                    <td className="admin-table-index">{row.rowNumber}</td>

                    <td className="admin-table-title">{row.title || '-'}</td>

                    <td>
                      {row.domain ? (
                        <span className="admin-chip">{row.domain}</span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td>{row.technologies.join(', ') || '-'}</td>

                    <td>{row.sdgGoals.join(', ') || '-'}</td>

                    <td>{row.facultyName || '-'}</td>

                    <td>{renderStatus(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="upload-footer">
            {finished && !failedCount && !readyRows.length ? (
              <div className="form-feedback">
                All {doneCount} projects were added to the Project Bank.
              </div>
            ) : (
              <p className="section-subtext">
                Rows that need fixing are skipped. Correct them in your sheet
                and upload again.
              </p>
            )}

            <div className="form-footer-actions">
              {finished ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/admin/project-bank')}
                >
                  Go to Project Bank
                </button>
              ) : null}

              <button
                type="button"
                className="btn btn-primary"
                disabled={importing || facultyLoading || !readyRows.length}
                onClick={() => runImport(readyRows)}
              >
                {importing
                  ? 'Importing...'
                  : failedCount
                    ? `Retry ${readyRows.length} Project${readyRows.length === 1 ? '' : 's'}`
                    : `Import ${readyRows.length} Project${readyRows.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminUploadProjects
