import React from 'react'
import { useApp } from '../context/AppContext'
import { Download, Upload, RotateCcw } from 'lucide-react'
import { exportState, importState } from '../utils/export'

export default function DataTools({ isMobile = false }) {
  const { state, dispatch } = useApp()

  const handleExport = () => {
    exportState(state)
  }

  const handleImport = (event) => {
    const file = event.target.files[0]
    if (file) {
      importState(file).then(data => {
        // Dispatch import action
        // This would need to be implemented in AppContext
        console.log('Imported data:', data)
      }).catch(error => {
        alert('Failed to import data: ' + error.message)
      })
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data?')) {
      dispatch({ type: 'CLEAR_HISTORY' })
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: isMobile ? '8px' : '12px',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={handleExport}
        style={{
          padding: isMobile ? '8px 14px' : '10px 20px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: isMobile ? '12px' : '14px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        }}
      >
        <Download size={isMobile ? 14 : 16} />
        Export
      </button>
      
      <label
        style={{
          padding: isMobile ? '8px 14px' : '10px 20px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: isMobile ? '12px' : '14px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        }}
      >
        <Upload size={isMobile ? 14 : 16} />
        Import
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </label>
      
      <button
        onClick={handleReset}
        style={{
          padding: isMobile ? '8px 14px' : '10px 20px',
          borderRadius: '12px',
          background: 'rgba(255,107,107,0.08)',
          border: '1px solid rgba(255,107,107,0.15)',
          color: '#FF6B6B',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: isMobile ? '12px' : '14px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,107,107,0.15)'
          e.currentTarget.style.borderColor = 'rgba(255,107,107,0.25)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,107,107,0.08)'
          e.currentTarget.style.borderColor = 'rgba(255,107,107,0.15)'
        }}
      >
        <RotateCcw size={isMobile ? 14 : 16} />
        Reset
      </button>
    </div>
  )
}
