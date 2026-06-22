import React, { useEffect, useState } from 'react'
import { WS_URL } from '../../utils/api'

export default function HedgeFundPanel({ status }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    let ws = null
    try {
      ws = new WebSocket(WS_URL)
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'market') setData(msg.data)
        } catch (err) {}
      }
    } catch (e) {}

    return () => { if (ws) ws.close() }
  }, [])

  // Fall back to status prop
  if (status?.market?.btc) {
    return (
      <div style={{
        padding: 20,
        borderRadius: 16,
        background: '#0B0B1A',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <h3>Hedge Fund Desk</h3>
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 14, opacity: 0.6 }}>BTC Price</div>
          <div style={{ fontSize: 24, color: '#00D4AA' }}>
            
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 12, opacity: 0.5 }}>
          Agent Balance: {status.bnbBalance ? status.bnbBalance.toFixed(4) : '0'} BNB
        </div>
        <div style={{ fontSize: 12, opacity: 0.5 }}>
          Trades Today: {status.totalTrades || 0}
        </div>
      </div>
    )
  }

  return null
}
