// src/components/trading/HedgeFundPanel.jsx
import React from 'react'
export default function HedgeFundPanel({ status, trades }) {
  const stats = status?.stats || {}
  const tradeList = trades || []
  const totalTrades = stats.totalTrades || tradeList.length || 0
  const winRate = stats.winRate || 0
  const pnl = stats.pnl || 0
  return (
    <div style={{
      background: '#0B0B0F',
      padding: '16px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <h3 style={{ fontSize: '14px', color: '#aaa', marginBottom: '12px' }}>
        Hedge Fund Panel
        <span style={{ marginLeft: '8px', fontSize: '10px', color: status?.running ? '#00D4AA' : '#555' }}>
          {status?.running ? '🟢 LIVE' : '⏸️ IDLE'}
        </span>
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#555' }}>Total Trades</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'white' }}>
            {totalTrades}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#555' }}>Win Rate</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: winRate > 50 ? '#00D4AA' : '#FF6B6B' }}>
            {winRate.toFixed(1)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#555' }}>P&L</div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: pnl >= 0 ? '#00D4AA' : '#FF6B6B' }}>
            
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: '#555' }}>Status</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: status?.running ? '#00D4AA' : '#888' }}>
            {status?.running ? 'RUNNING' : 'STOPPED'}
          </div>
        </div>
      </div>
    </div>
  )
}
