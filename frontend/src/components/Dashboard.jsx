import React, { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'https://hydrant-management-production.up.railway.app/api'

const Dashboard = () => {
  const [stats, setStats] = useState({ totalHydrants: 0, activeHydrants: 0, lastTest: null })
  const [list, setList] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${apiUrl}/hydrants`)
        const data = await res.json()
        const hydrants = data.hydrants || []
        setList(hydrants)
        setStats({
          totalHydrants: hydrants.length,
          activeHydrants: hydrants.filter(h => (h.status || '').toLowerCase() === 'active').length,
          lastTest: null
        })
      } catch (e) {
        console.error('Failed to load hydrants', e)
      }
    }
    load()
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
        <h3>🧾 Hydrants</h3>
        {list.length === 0 ? (
          <p>No hydrants found.</p>
        ) : (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {list.map(h => (
              <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                <div><strong>#{h.hydrant_number}</strong></div>
                <div>{h.address}</div>
                <div style={{ textTransform: 'capitalize' }}>{h.status || 'unknown'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
