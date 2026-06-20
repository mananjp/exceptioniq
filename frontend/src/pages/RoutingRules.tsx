import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { client } from '../api/client'
import { RoutingRule } from '../types'

interface AppContextType {
  entityId: string
}

export default function RoutingRules() {
  const { entityId } = useOutletContext<AppContextType>()
  const [rules, setRules] = useState<RoutingRule[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [excCode, setExcCode] = useState('BANK-AMT')
  const [minAmount, setMinAmount] = useState('0')
  const [maxAmount, setMaxAmount] = useState('')
  const [assignRole, setAssignRole] = useState('analyst')
  const [slaHours, setSlaHours] = useState('24')
  const [priority, setPriority] = useState('medium')

  const fetchRules = async () => {
    if (!entityId) return
    setLoading(true)
    try {
      const data = await client.get(`/routing/rules/?entity=${entityId}`)
      const list = Array.isArray(data) ? data : data.results || []
      setRules(list)
    } catch (err) {
      console.error('Failed to load routing rules', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [entityId])

  // Handle new rule submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entityId) return

    try {
      await client.post('/routing/rules/', {
        entity: entityId,
        reconciliation_type: 'bank',
        exception_code: excCode,
        min_amount: minAmount,
        max_amount: maxAmount ? maxAmount : null,
        assign_to_role: assignRole,
        sla_hours: parseInt(slaHours) || 24,
        priority: priority,
        active: true
      })
      alert('Routing Rule added successfully!')
      // Clear fields
      setMinAmount('0')
      setMaxAmount('')
      setSlaHours('24')
      // Refetch
      fetchRules()
    } catch (err: any) {
      alert(`Failed to create rule: ${err.message || err}`)
    }
  }

  // Handle active status toggle
  const handleToggleActive = async (rule: RoutingRule) => {
    try {
      // In DRF Viewsets, PUT/PATCH is at /routing/rules/{id}/
      // Let's implement PATCH via a post request if needed, or put. We can do client.post with modified data if the view supports PUT or we can just send PATCH if we write a custom request, or since DRF router maps standard PUT/PATCH, we can just call fetch directly for PUT/PATCH. Let's make a standard fetch request for PATCH!
      const res = await fetch(`http://localhost:8000/api/v1/routing/rules/${rule.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !rule.active })
      })
      if (!res.ok) throw new Error('Toggle failed')
      fetchRules()
    } catch (err: any) {
      alert(`Failed to toggle status: ${err.message}`)
    }
  }

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading routing rules...</div>
  }

  return (
    <div className="page-container" style={{ padding: 0 }}>
      <div className="page-header-row">
        <div>
          <h1>Routing & Assignment Rules</h1>
          <p>Define rules for automatic assignment and resolution SLA targeting.</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Rules List */}
        <div>
          <div className="card">
            <h2>Active Routing Rules</h2>
            {rules.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '20px 0', textAlign: 'center' }}>No routing rules defined for this entity.</p>
            ) : (
              <div className="responsive-table" style={{ marginTop: '16px' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Exception Code</th>
                      <th>Condition (Amt)</th>
                      <th>Assign To</th>
                      <th>SLA</th>
                      <th>Priority</th>
                      <th style={{ textAlign: 'center' }}>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map(rule => (
                      <tr key={rule.id}>
                        <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{rule.exception_code}</td>
                        <td style={{ fontSize: '12px' }}>
                          {rule.max_amount 
                            ? `₹${rule.min_amount} - ₹${rule.max_amount}` 
                            : `>= ₹${rule.min_amount}`}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>👤 {rule.assign_to_role}</td>
                        <td>{rule.sla_hours} hrs</td>
                        <td>
                          <span className={`chip badge-${rule.priority === 'critical' ? 'critical' : rule.priority === 'high' ? 'high' : rule.priority === 'medium' ? 'medium' : 'low'}`}>
                            {rule.priority}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="checkbox" 
                            checked={rule.active} 
                            onChange={() => handleToggleActive(rule)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Rule Form */}
        <div>
          <div className="card">
            <h2>Add New Routing Rule</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Exception Code</label>
                <select 
                  value={excCode} 
                  onChange={(e) => setExcCode(e.target.value)}
                  className="form-input"
                >
                  <option value="BANK-AMT">BANK-AMT (Amount mismatch)</option>
                  <option value="BANK-REF">BANK-REF (Reference mismatch)</option>
                  <option value="BANK-DATE">BANK-DATE (Date mismatch)</option>
                  <option value="BANK-MISS-LEDGER">BANK-MISS-LEDGER (Missing ledger)</option>
                  <option value="BANK-MISS-BANK">BANK-MISS-BANK (Missing statement entry)</option>
                  <option value="BANK-DUP">BANK-DUP (Suspected duplicate)</option>
                </select>
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Min Amount (₹)</label>
                  <input 
                    type="number" 
                    value={minAmount} 
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Max Amount (₹, optional)</label>
                  <input 
                    type="number" 
                    value={maxAmount} 
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="form-input"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assign to Role</label>
                <select 
                  value={assignRole} 
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="form-input"
                >
                  <option value="analyst">Analyst</option>
                  <option value="approver">Approver</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SLA Hours</label>
                  <input 
                    type="number" 
                    value={slaHours} 
                    onChange={(e) => setSlaHours(e.target.value)}
                    className="form-input"
                    min="1"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">SLA Priority</label>
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Create Routing Rule
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
