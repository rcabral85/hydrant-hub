import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import HydrantMap from './components/HydrantMap'
import FlowTestForm from './components/FlowTestForm'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>🔥 HydrantHub</h1>
          <p>Professional Fire Hydrant Management Platform</p>
        </header>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<HydrantMap />} />
          <Route path="/flow-test" element={<FlowTestForm />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
