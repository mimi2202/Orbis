import React, { useEffect, useState } from 'react'
import { API_URL } from '../../utils/api'

export default function AgentLogs() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const baseUrl = API_URL || 'http://localhost:5000'
        const res = await fetch(baseUrl + '/api/status')
        const data = await res.json()
        if (data.success && data._logs && Array.isArray(data._logs)) {
          setLogs(data._logs.slice(0, 60))
        }
      } catch (e) {}
    }

    fetchLogs()
    const interval = setInterval(fetchLogs, 2000)
    return () => clearInterval(interval)
  }, [])

  const color = {
    market: '#6C3CE1',
    signal_buy: '#00D4AA',
    signal_hold: '#F59E0B',
    position_open: '#3B82F6',
    position_update: '#9CA3AF',
    position_close: '#EF4444',
    system: '#FFFFFF',
    twak_sign: '#8B5CF6',
    trade_approved: '#00D4AA',
    trade_blocked: '#EF4444'
  }

  return (
    <div style={{
      background: '#0B0B0F',
      padding: 16,
      borderRadius: 12,
      height: 320,
      overflow: 'auto',
      color: 'white',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <h3 style={{ marginBottom: 12, fontSize: 14, color: '#aaa' }}>
        Bloomberg Feed
        <span style={{ marginLeft: 8, fontSize: 10, color: '#00D4AA' }}>
          {logs.length > 0 ? logs.length + ' events' : 'Waiting...'}
        </span>
      </h3>

      {logs.length === 0 && (
        <div style={{ color: '#555', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
          Waiting for agent events...
        </div>
      )}

      {logs.map(log => (
        <div key={log.id} style={{ 
          marginBottom: 6, 
          fontSize: 12,
          fontFamily: 'monospace',
          padding: '4px 0',
          borderBottom: '1px solid rgba(255,255,255,0.03)'
        }}>
          <span style={{ 
            color: color[log.type] || '#fff',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: 10,
            marginRight: 8
          }}>
            [{log.type}]
          </span>
          <span style={{ color: '#ccc' }}>
            {log.message}
          </span>
          <span style={{ color: '#555', fontSize: 9, marginLeft: 8 }}>
            {new Date(log.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ))}
    </div>
  )
}
