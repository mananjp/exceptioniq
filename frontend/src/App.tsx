import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'

export default function App() {
  // Read initial values from localStorage to preserve selection on refresh
  const [entityId, setEntityId] = useState<string>(() => localStorage.getItem('selectedEntityId') || '')
  const [currentUserRole, setCurrentUserRole] = useState<string>(() => localStorage.getItem('currentUserRole') || 'analyst')

  useEffect(() => {
    if (entityId) {
      localStorage.setItem('selectedEntityId', entityId)
    }
  }, [entityId])

  useEffect(() => {
    localStorage.setItem('currentUserRole', currentUserRole)
  }, [currentUserRole])

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar 
          entityId={entityId} 
          setEntityId={setEntityId} 
          currentUserRole={currentUserRole} 
          setCurrentUserRole={setCurrentUserRole} 
        />
        <main className="page-container">
          <Outlet context={{ entityId, setEntityId, currentUserRole, setCurrentUserRole }} />
        </main>
      </div>
    </div>
  )
}
