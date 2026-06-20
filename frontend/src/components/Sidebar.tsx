import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        ExceptionIQ
      </div>
      <nav>
        <ul className="sidebar-menu">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              📊 Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/exceptions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              🔍 Exceptions Queue
            </NavLink>
          </li>
          <li>
            <NavLink to="/ingestion" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              📥 Data Ingestion
            </NavLink>
          </li>
          <li>
            <NavLink to="/routing-rules" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              ⚙️ Routing Rules
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  )
}
