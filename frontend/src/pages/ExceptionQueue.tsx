import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { client } from '../api/client'
import { ExceptionRecord } from '../types'
import ExceptionTable from '../components/ExceptionTable'

interface AppContextType {
  entityId: string
}

export default function ExceptionQueue() {
  const { entityId } = useOutletContext<AppContextType>()
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [codeFilter, setCodeFilter] = useState('')

  const fetchExceptions = async () => {
    if (!entityId) return
    setLoading(true)
    try {
      const data = await client.get(`/exceptions/?entity=${entityId}`)
      const list = Array.isArray(data) ? data : data.results || []
      setExceptions(list)
    } catch (err) {
      console.error('Failed to load exceptions', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExceptions()
  }, [entityId])

  // Apply filters on client side
  const filteredExceptions = exceptions.filter(exc => {
    // Search query filter
    const matchesSearch = search.trim() === '' || 
      exc.exception_code.toLowerCase().includes(search.toLowerCase()) ||
      (exc.context.reference || '').toLowerCase().includes(search.toLowerCase()) ||
      (exc.context.counterparty || '').toLowerCase().includes(search.toLowerCase()) ||
      exc.id.toLowerCase().includes(search.toLowerCase())

    // Status filter
    const matchesStatus = statusFilter === '' || exc.status === statusFilter

    // Severity filter
    const matchesSeverity = severityFilter === '' || exc.severity === severityFilter

    // Exception code filter
    const matchesCode = codeFilter === '' || exc.exception_code === codeFilter

    return matchesSearch && matchesStatus && matchesSeverity && matchesCode
  })

  // Group codes for filter selector
  const availableCodes = Array.from(new Set(exceptions.map(e => e.exception_code)))

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading exceptions...</div>
  }

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header-row">
        <div>
          <h1>Exceptions Queue</h1>
          <p>Investigate, route, and resolve reconciliation mismatches.</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="filter-bar">
        <input 
          type="text"
          placeholder="🔍 Search by ID, reference, counterparty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input filter-input-search"
        />

        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-input"
        >
          <option value="">All Statuses</option>
          <option value="detected">Detected</option>
          <option value="routed">Routed</option>
          <option value="investigating">Investigating</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="closed">Closed</option>
        </select>

        <select 
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="filter-input"
        >
          <option value="">All Severities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select 
          value={codeFilter}
          onChange={(e) => setCodeFilter(e.target.value)}
          className="filter-input"
        >
          <option value="">All Codes</option>
          {availableCodes.map(code => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      </div>

      {/* Table view */}
      <ExceptionTable exceptions={filteredExceptions} />
    </div>
  )
}
