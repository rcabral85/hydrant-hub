import React, { useState } from 'react'

const FlowTestForm = () => {
  const [testData, setTestData] = useState({
    hydrantNumber: '',
    staticPressure: '',
    residualPressure: '',
    totalFlow: ''
  })
  
  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Flow Test Data:', testData)
    alert('Flow test data recorded successfully!')
  }
  
  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2>🧪 NFPA 291 Flow Test</h2>
      
      <div style={{ background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '10px', maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>🚰 Hydrant Number:</label>
            <input 
              type="text" 
              value={testData.hydrantNumber}
              onChange={(e) => setTestData({...testData, hydrantNumber: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
              placeholder="e.g., H-001"
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>📊 Static Pressure (PSI):</label>
            <input 
              type="number" 
              value={testData.staticPressure}
              onChange={(e) => setTestData({...testData, staticPressure: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
              placeholder="e.g., 65"
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>📉 Residual Pressure (PSI):</label>
            <input 
              type="number" 
              value={testData.residualPressure}
              onChange={(e) => setTestData({...testData, residualPressure: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
              placeholder="e.g., 45"
            />
          </div>
          
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>💧 Total Flow (GPM):</label>
            <input 
              type="number" 
              value={testData.totalFlow}
              onChange={(e) => setTestData({...testData, totalFlow: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: 'none' }}
              placeholder="e.g., 1500"
            />
          </div>
          
          <button 
            type="submit"
            style={{ 
              width: '100%', 
              padding: '15px', 
              borderRadius: '5px', 
              border: 'none', 
              background: '#4CAF50', 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: 'bold', 
              cursor: 'pointer' 
            }}
          >
            📝 Submit Flow Test
          </button>
        </form>
        
        <div style={{ marginTop: '30px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '14px' }}>
          <p><strong>📋 NFPA 291 Compliance:</strong></p>
          <p>This form captures essential data points required for NFPA 291 standard fire hydrant flow testing.</p>
        </div>
      </div>
    </div>
  )
}

export default FlowTestForm