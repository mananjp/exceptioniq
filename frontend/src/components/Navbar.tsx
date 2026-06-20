import { useState, useEffect } from 'react'
import { client } from '../api/client'
import { Entity } from '../types'

interface NavbarProps {
  entityId: string
  setEntityId: (id: string) => void
  currentUserRole: string
  setCurrentUserRole: (role: string) => void
}

export default function Navbar({
  entityId,
  setEntityId,
  currentUserRole,
  setCurrentUserRole
}: NavbarProps) {
  const [entities, setEntities] = useState<Entity[]>([])
  const [health, setHealth] = useState<'checking' | 'live' | 'offline'>('checking')
  const [resetting, setResetting] = useState(false)

  const showDevTools = (import.meta as any).env.VITE_DEV_TOOLS === 'true'

  // Fetch entities
  const fetchEntities = async () => {
    try {
      const data = await client.get('/entities/')
      // DRF list views return standard arrays or paginated results
      const list = Array.isArray(data) ? data : data.results || []
      setEntities(list)
      if (list.length > 0 && !entityId) {
        setEntityId(list[0].id)
      }
    } catch (err) {
      console.error('Failed to load entities', err)
    }
  }

  // Check health status
  const checkHealth = () => {
    client.get('/health/')
      .then(() => setHealth('live'))
      .catch(() => setHealth('offline'))
  }

  useEffect(() => {
    fetchEntities()
    checkHealth()
    const interval = setInterval(checkHealth, 8000)
    return () => clearInterval(interval)
  }, [])

  // Auto-select entity if entity list changes
  useEffect(() => {
    if (entities.length > 0 && !entityId) {
      setEntityId(entities[0].id)
    }
  }, [entities, entityId])

  // Handle DB reset
  const handleResetDb = async () => {
    if (!entityId) return
    if (!window.confirm('Are you sure you want to reset all reconciliation and exception data for this entity? This will wipe the tables.')) return
    
    setResetting(true)
    try {
      await client.post('/recon/bank/clear/', { entity_id: entityId })
      alert('Database cleared successfully! Press OK to reload.')
      window.location.reload()
    } catch (err: any) {
      alert(`Reset failed: ${err.message || err}`)
    } finally {
      setResetting(false)
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        <label className="form-label" style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Active Entity:</label>
        {entities.length > 0 ? (
          <select 
            value={entityId} 
            onChange={(e) => setEntityId(e.target.value)} 
            className="entity-selector"
          >
            {entities.map(ent => (
              <option key={ent.id} value={ent.id}>{ent.name}</option>
            ))}
          </select>
        ) : (
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Loading entities...</span>
        )}
      </div>

      <div className="navbar-right">
        {health === 'live' ? (
          <span className="badge-live">Live</span>
        ) : (
          <span className="badge-offline">Offline</span>
        )}

        {showDevTools && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid var(--color-border)', paddingLeft: '16px' }}>
            <label className="form-label" style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role Switcher:</label>
            <select 
              value={currentUserRole} 
              onChange={(e) => setCurrentUserRole(e.target.value)}
              className="user-switcher"
            >
              <option value="admin">🔑 Admin</option>
              <option value="analyst">💼 Analyst</option>
              <option value="approver">✍️ Approver</option>
              <option value="manager">📈 Manager</option>
            </select>

            <button 
              onClick={handleResetDb} 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#fca5a5', color: '#b91c1c', background: '#fef2f2' }}
              disabled={resetting || !entityId}
            >
              {resetting ? 'Resetting...' : '⚠️ Reset DB'}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
