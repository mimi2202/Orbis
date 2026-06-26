// src/components/trading/AgentLogs.jsx
import React, { useEffect, useRef, useState } from 'react'
import { API_URL } from '../../utils/api'

// Maps raw backend log types to branded, judge-readable feed lines.
const EVENT_META = {
  signal_buy:     { icon: '✅', label: 'BUY EXECUTED', color: '#00D4AA' },
  position_open:  { icon: '📈', label: 'POSITION OPEN', color: '#3B82F6' },
  position_close: { icon: '💰', label: 'EXIT / SELL',   color: '#F2C94C' },
  trade_approved: { icon: '✅', label: 'TRADE APPROVED', color: '#00D4AA' },
  trade_blocked:  { icon: '⛔', label: 'BLOCKED',        color: '#EF4444' },
  signal_hold:    { icon: '⏸', label: 'HOLD',           color: '#F59E0B' },
  agent_log:      { icon: '🧠', label: 'TRADER',         color: '#88CCFF' },
  twak_sign:      { icon: '✍️', label: 'SIGNED',         color: '#8B5CF6' },
  market:         { icon: '📡', label: 'MARKET',         color: '#6C3CE1' },
  system:         { icon: '⚙', label: 'SYSTEM',          color: '#9AA' },
  error:          { icon: '⚠', label: 'ERROR',           color: '#FF6B6B' },
}

const DIR = {
  bullish: { arrow: '▲', color: '#00D4AA' },
  bearish: { arrow: '▼', color: '#EF4444' },
  neutral: { arrow: '►', color: '#F59E0B' },
}

const PROVIDERS = [
  { key: 'whale',       icon: '🐋', name: 'Whale Agent' },
  { key: 'narrative',   icon: '📰', name: 'Narrative Agent' },
  { key: 'derivatives', icon: '📊', name: 'Derivatives Agent' },
]

export default function AgentLogs() {
  const [logs, setLogs] = useState([])
  const [signals, setSignals] = useState(null)
  const [running, setRunning] = useState(false)
  const feedRef = useRef(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statusRes, sigRes] = await Promise.all([
          fetch(API_URL + '/api/status'),
          fetch(API_URL + '/api/agent-signals').catch(() => null),
        ])
        const data = await statusRes.json()
        if (data && data.success) {
          setRunning(!!data.running)
          let backendLogs = data.logs || data._logs || []
          if (!backendLogs.length && (data.trades || []).length) {
            backendLogs = data.trades.slice(-20).map(t => ({
              id: t.timestamp || Date.now(),
              type: t.type === 'BUY' ? 'signal_buy' : 'position_close',
              message:
                (t.type === 'BUY' ? 'BUY ' : 'SELL ') + (t.symbol || 'BTCUSDT') +
                ' @ $' + Number(t.price || t.exitPrice || 0).toFixed(2) +
                (t.pnl != null ? '  PnL $' + Number(t.pnl).toFixed(2) : ''),
              timestamp: new Date(t.timestamp || Date.now()).getTime(),
            }))
          }
          // newest first
          setLogs([...backendLogs].reverse().slice(0, 80))
        }
        if (sigRes) {
          const s = await sigRes.json()
          if (s && s.success) setSignals(s.signals)
        }
      } catch (e) {
        console.error('Failed to fetch logs:', e)
      }
    }
    fetchAll()
    const interval = setInterval(fetchAll, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      background: '#0B0B0F',
      borderRadius: '12px',
      color: 'white',
      border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    }}>
      <style>{`
        @keyframes orbisPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes orbisRow { from{opacity:0; transform:translateY(-3px)} to{opacity:1; transform:none} }
      `}</style>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>ORBIS</span>
          <span style={{ fontSize: 10, color: '#666' }}>intelligence exchange</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: running ? '#00D4AA' : '#555',
            animation: running ? 'orbisPulse 1.4s infinite' : 'none',
          }} />
          <span style={{ color: running ? '#00D4AA' : '#777' }}>
            {running ? 'LIVE' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Live intelligence strip — the 3 provider agents producing signals */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8,
        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {PROVIDERS.map(p => {
          const sig = signals?.[p.key]
          const dir = DIR[sig?.direction] || DIR.neutral
          const conf = sig?.confidence != null ? sig.confidence : '--'
          return (
            <div key={p.key} style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 10, color: '#9AA', marginBottom: 4 }}>
                {p.icon} {p.name}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ color: dir.color, fontWeight: 700, fontSize: 12 }}>
                  {dir.arrow} {(sig?.direction || 'neutral').toUpperCase()}
                </span>
                <span style={{ fontSize: 10, color: '#bbb' }}>{conf}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Event ticker — trader decisions + real executions */}
      <div ref={feedRef} style={{ height: 240, overflow: 'auto', padding: '8px 0' }}>
        {logs.length === 0 && (
          <div style={{ color: '#555', fontSize: 12, padding: '24px 0', textAlign: 'center' }}>
            {running ? 'Awaiting intelligence and execution…' : 'Agent idle — press Start'}
          </div>
        )}

        {logs.map((log, i) => {
          const meta = EVENT_META[log.type] || { icon: '•', label: (log.type || 'info').toUpperCase(), color: '#888' }
          return (
            <div key={log.id || i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '5px 16px', fontSize: 11,
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              animation: i === 0 ? 'orbisRow .25s ease' : 'none',
            }}>
              <span style={{ fontSize: 12, lineHeight: '16px', width: 16, textAlign: 'center' }}>{meta.icon}</span>
              <span style={{
                color: meta.color, fontWeight: 700, fontSize: 9, letterSpacing: 0.4,
                textTransform: 'uppercase', minWidth: 96, paddingTop: 1,
              }}>
                {meta.label}
              </span>
              <span style={{ color: '#d6d6d6', flex: 1, lineHeight: '16px' }}>
                {log.message}
              </span>
              <span style={{ color: '#555', fontSize: 9, whiteSpace: 'nowrap', paddingTop: 2 }}>
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}