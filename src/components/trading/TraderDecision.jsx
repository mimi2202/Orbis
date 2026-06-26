// src/components/trading/TraderDecision.jsx - REDUCED RE-RENDERS
import React, { useEffect, useState, useRef } from 'react'
import AgentLogs from './AgentLogs'
import HedgeFundPanel from './HedgeFundPanel'
import { API_URL } from '../../utils/api'
import { Brain, Play, Square } from 'lucide-react'
export default function TraderDecision() {
  const [status, setStatus] = useState(null)
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [trades, setTrades] = useState([])
  const mountedRef = useRef(true)
  const fetchIntervalRef = useRef(null)
  const fetchStatus = async () => {
    if (!mountedRef.current) return
    try {
      const res = await fetch(API_URL + '/api/status')
      const data = await res.json()
      if (data.success) {
        setStatus(data)
        setRunning(Boolean(data.isAutoTrading || data.running))
        setTrades(data.trades || [])
      }
    } catch (err) {
      console.error('Status fetch error:', err)
    }
  }
  const start = async () => {
    setLoading(true)
    try {
      await fetch(API_URL + '/api/start-auto-trade', { method: 'POST' })
      await fetchStatus()
    } catch (err) {
      console.error('Start error:', err)
    }
    setLoading(false)
  }
  const stop = async () => {
    setLoading(true)
    try {
      await fetch(API_URL + '/api/stop-auto-trade', { method: 'POST' })
      await fetchStatus()
    } catch (err) {
      console.error('Stop error:', err)
    }
    setLoading(false)
  }
  useEffect(() => {
    mountedRef.current = true
    fetchStatus()
    // Slower interval to reduce glitching
    fetchIntervalRef.current = setInterval(fetchStatus, 5000)
    return () => {
      mountedRef.current = false
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current)
      }
    }
  }, [])
  const address = status?.agent?.address || 'Not connected'
  return (
    <div style={{
      padding: '20px',
      background: '#0B0B0F',
      borderRadius: '16px',
      color: 'white',
      border: '1px solid rgba(255,255,255,0.08)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Brain size={20} />
          <h3 style={{ margin: 0 }}>Hedge Fund AI Engine</h3>
        </div>
        <button
          onClick={running ? stop : start}
          disabled={loading}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            border: 'none',
            background: running ? '#EF4444' : '#00D4AA',
            color: 'white',
            cursor: loading ? 'default' : 'pointer',
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            opacity: loading ? 0.5 : 1
          }}
        >
          {running ? <Square size={16} /> : <Play size={16} />}
          {running ? 'Stop' : 'Start'}
        </button>
      </div>
      {/* node */}
      <div style={{
        marginTop: '15px',
        padding: '12px',
        background: '#111827',
        borderRadius: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: '8px'
      }}>
        <div>Mode: <span style={{ color: running ? '#00D4AA' : '#888' }}>{running ? 'LIVE' : 'IDLE'}</span></div>
        <div>Open Position: <span style={{ color: status?.openPosition ? '#00D4AA' : '#888' }}>{status?.openPosition ? 'YES' : 'NO'}</span></div>
       <div>Total Trades: <span style={{ color: 'white' }}>{status?.stats?.totalTrades || trades.length || 0}</span></div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <AgentLogs />
      </div>
      <div style={{ marginTop: '20px' }}>
        <HedgeFundPanel status={status} trades={trades} />
      </div>
    </div>
  )
}
