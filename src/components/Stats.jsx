// src/components/Stats.jsx
import React, { useState, useEffect } from 'react'
import { API_URL } from '../utils/api'
const safeNumber = (value, fallback) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : (fallback || 0)
}
export default function Stats({ isMobile }) {
  const [data, setData] = useState({
    balance: 10000,
    totalTrades: 0,
    winRate: 0,
    pnl: 0,
    wins: 0,
    losses: 0
  })
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL + '/api/status')
        const result = await res.json()
        if (!mounted) return
        if (result.success) {
          const stats = result.stats || {}
          const trades = result.trades || []
          
const totalTrades = safeNumber(stats.totalTrades, 0) || trades.length || 0
setData({
  balance: safeNumber(stats.balance, 10000),
  totalTrades: totalTrades,
  winRate: safeNumber(stats.winRate, 0),
  pnl: safeNumber(stats.pnl, 0),
  wins: safeNumber(stats.wins, 0),
  losses: safeNumber(stats.losses, 0)
})

          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])
  const items = [
    { label: 'Balance', value: '$' + data.balance.toFixed(2), sub: 'USDT' },
    { label: 'Total Trades', value: data.totalTrades, sub: data.wins + 'W / ' + data.losses + 'L' },
    { label: 'Win Rate', value: data.winRate.toFixed(1) + '%', sub: '' },
    { label: 'Total P&L', value: '$' + data.pnl.toFixed(2), sub: data.pnl >= 0 ? 'Profit' : 'Loss' }
  ]
  const gridCols = isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: gridCols,
      gap: isMobile ? '12px' : '20px',
      width: '100%'
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: isMobile ? '16px' : '24px',
          borderRadius: '20px',
          background: 'rgba(20, 20, 30, 0.6)',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <p style={{ fontSize: isMobile ? '11px' : '14px', color: 'rgba(255,255,255,0.4)' }}>
            {item.label}
          </p>
          <p style={{ fontSize: isMobile ? '20px' : '28px', fontWeight: 700, marginTop: '4px' }}>
            {loading ? '...' : item.value}
          </p>
          {item.sub && (
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
              {item.sub}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
