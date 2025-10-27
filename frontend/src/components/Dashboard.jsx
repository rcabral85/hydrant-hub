import React, { useState, useEffect } from 'react'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalHydrants: 0,
    activeHydrants: 0,
    lastTest: null
  })
  
  const apiUrl = import.meta.env.VITE_API_URL || 'https://hydrant-management-production.up.railway.app/api'
  
  useEffect(() => {
    // Test API connection
    fetch(`${apiUrl}/health`)
      .then(res => res.json())
      .then(data => console.log('API Health:', data))
      .catch(err => console.error('API Error:', err))
  }, [])
  
  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2>📊 Dashboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', margin: '20px 0' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
          <h3>🚰 Total Hydrants</h3>
          <p style={{ fontSize: '2em', margin: '10px 0' }}>{stats.totalHydrants}</p>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
          <h3>✅ Active Hydrants</h3>
          <p style={{ fontSize: '2em', margin: '10px 0' }}>{stats.activeHydrants}</p>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' }}>
          <h3>🧪 Last Test</h3>
          <p>{stats.lastTest || 'No tests recorded'}</p>
        </div>
      </div>
      
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px', margin: '20px 0' }}>
        <h3>🎯 Quick Actions</h3>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#4CAF50', color: 'white', cursor: 'pointer' }}>
            ➕ Add Hydrant
          </button>
          <button style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#2196F3', color: 'white', cursor: 'pointer' }}>
            🧪 Flow Test
          </button>
          <button style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#FF9800', color: 'white', cursor: 'pointer' }}>
            📍 View Map
          </button>
          <button style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#9C27B0', color: 'white', cursor: 'pointer' }}>
            📊 Reports
          </button>
        </div>
      </div>
      
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px', textAlign: 'left' }}>
        <h3>🏢 Organization: Town of Milton</h3>
        <p>👤 <strong>User:</strong> Richard Cabral (Water Distribution Operator)</p>
        <p>🔧 <strong>Role:</strong> Administrator</p>
        <p>📧 <strong>Email:</strong> demo@milton.ca</p>
        <p>🌐 <strong>API Status:</strong> <span style={{ color: '#4CAF50' }}>Connected</span></p>
      </div>
    </div>
  )
}

export default Dashboard