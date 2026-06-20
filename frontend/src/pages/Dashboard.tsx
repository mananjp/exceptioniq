import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { client } from '../api/client'
import { ExceptionRecord } from '../types'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface AppContextType {
  entityId: string
}

const COLORS: Record<string, string> = {
  'BANK-AMT':         '#3B4EFF',
  'BANK-MISS-LEDGER': '#D97706',
  'BANK-MISS-BANK':   '#059669',
  'BANK-DUP':         '#DC2626',
  'BANK-DATE':        '#7C3AED',
  'BANK-REF':         '#0891B2',
}

export default function Dashboard() {
  const { entityId } = useOutletContext<AppContextType>()
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchExceptions = async () => {
    if (!entityId) return
    setLoading(true)
    try {
      const data = await client.get(`/exceptions/?entity=${entityId}`)
      const list = Array.isArray(data) ? data : data.results || []
      setExceptions(list)
    } catch (err) {
      console.error('Failed to load dashboard exceptions', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExceptions()
  }, [entityId])

  // Compute metrics
  const totalCount = exceptions.length
  
  const openCount = exceptions.filter(e => 
    e.status !== 'closed' && e.status !== 'approved'
  ).length

  const closedCount = exceptions.filter(e => 
    e.status === 'closed' || e.status === 'approved'
  ).length

  const highSeverityCount = exceptions.filter(e => 
    (e.severity === 'high' || e.severity === 'critical') && e.status !== 'closed' && e.status !== 'approved'
  ).length

  const nowTime = new Date().getTime()
  const breachedCount = exceptions.filter(e => 
    e.status !== 'closed' && e.status !== 'approved' && e.sla_deadline && new Date(e.sla_deadline).getTime() < nowTime
  ).length

  // Compute exception distribution by code
  const codeCounts: Record<string, number> = {}
  exceptions.forEach(exc => {
    codeCounts[exc.exception_code] = (codeCounts[exc.exception_code] || 0) + 1
  })

  const distributionData = Object.entries(codeCounts).map(([code, count]) => ({
    code,
    count
  })).sort((a, b) => b.count - a.count)

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading dashboard analytics...</div>
  }

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header-row">
        <div>
          <h1>Dashboard Overview</h1>
          <p>Reconciliation health and metrics for the selected entity.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-label">Active Exceptions</div>
          <div className="stat-value">{openCount}</div>
          <div className="stat-sub">Awaiting resolution / approval</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-resolved)' }}>
          <div className="stat-label">Resolved & Closed</div>
          <div className="stat-value">{closedCount}</div>
          <div className="stat-sub">Total resolved mismatches</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div className="stat-label">High / Critical</div>
          <div className="stat-value">{highSeverityCount}</div>
          <div className="stat-sub">Open high risk exceptions</div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444', background: breachedCount > 0 ? '#fef2f2' : 'none' }}>
          <div className="stat-label" style={{ color: breachedCount > 0 ? '#b91c1c' : 'inherit' }}>SLA Breached</div>
          <div className="stat-value" style={{ color: breachedCount > 0 ? '#b91c1c' : 'inherit' }}>{breachedCount}</div>
          <div className="stat-sub">Overdue exceptions needing escalation</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-2" style={{ marginTop: '24px' }}>
        <div className="card">
          <h2>Exception Distribution by Code</h2>
          <p style={{ marginBottom: '16px', fontSize: '13px' }}>Frequency count of active and closed reconciliation issues.</p>
          <div className="chart-container">
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={distributionData} margin={{ top: 4, right: 16, left: -20, bottom: 4 }}>
                  <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry) => (
                      <Cell key={entry.code} fill={COLORS[entry.code] ?? '#6B7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>No exceptions to display chart data.</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Process Insights</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>📈 Overall Accuracy Rate</div>
              <p style={{ fontSize: '12px' }}>
                Currently reconciled matches: <strong>{totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 100}%</strong> of exceptions closed.
              </p>
            </div>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>🕒 SLA Health Index</div>
              <p style={{ fontSize: '12px' }}>
                Open SLA compliance rate: <strong>{openCount > 0 ? Math.round(((openCount - breachedCount) / openCount) * 100) : 100}%</strong> within resolution window.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '13px' }}>⚡ Recommendations</div>
              <p style={{ fontSize: '12px' }}>
                Seed data represents 30 exceptions. Review and approve the <strong>{exceptions.filter(e => e.status === 'pending_approval').length} pending approval</strong> exceptions as an Approver.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
