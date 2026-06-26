import React, { useState, useEffect, useMemo } from 'react'
import { API_URL } from '../../utils/api'
import { CheckCircle, XCircle, Clock, Hash, Zap, Bot } from 'lucide-react'

const safeNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export default function ExecutionResult({ isMobile = false }) {
  const [recordedTrades, setRecordedTrades] = useState([])
  const [status, setStatus] = useState(null)
  const [totalTrades, setTotalTrades] = useState(0)

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`)
        const data = await response.json()
        if (data.success) {
          setStatus(data)
          const trades = Array.isArray(data.trades) ? data.trades : []
          setRecordedTrades(trades)
          const tradeCount = data.stats?.totalTrades || trades.length || 0
          setTotalTrades(tradeCount)
        }
      } catch (error) {
        console.error('Failed to fetch trades:', error)
      }
    }

    fetchTrades()
    const interval = setInterval(fetchTrades, 5000)
    return () => clearInterval(interval)
  }, [])

  const latestTrade = useMemo(() => {
    if (!recordedTrades.length) return null
    return recordedTrades[recordedTrades.length - 1]
  }, [recordedTrades])

  // Bitget spot returns an orderId (not a 0x blockchain hash). The orderId is
  // the real proof the order hit the exchange and filled.
  const orderId = latestTrade?.orderId || latestTrade?.txHash || null
  const hasExecuted = !!latestTrade && !!orderId

  const pnl = safeNumber(latestTrade?.pnl, 0)
  const totalPnL = safeNumber(status?.stats?.pnl || status?.totalPnL || 0, 0)
  // A BUY opens a position (no realized PnL yet) -> treat as success/open.
  const action = latestTrade?.action || latestTrade?.type || 'TRADE'
  const isBuy = action === 'BUY'
  const result = latestTrade?.result || (isBuy ? 'OPEN' : (pnl >= 0 ? 'WIN' : 'LOSS'))
  const isPositive = pnl >= 0
  const isOpen = result === 'OPEN' || isBuy

  return (
    <div
      style={{
        padding: isMobile ? '20px' : '28px',
        borderRadius: '20px',
        background: 'rgba(20, 20, 30, 0.8)',
        border: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? '16px' : '24px',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '14px' }}>
          <div
            style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: isMobile ? '12px' : '14px',
              background: 'linear-gradient(135deg, #00D4AA, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Zap size={isMobile ? 18 : 22} style={{ color: 'white' }} />
          </div>
          <div>
            <h3 style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 600 }}>
              Execution Result
            </h3>
            <p
              style={{
                fontSize: isMobile ? '11px' : '12px',
                color: hasExecuted ? '#00D4AA' : 'rgba(255,255,255,0.35)'
              }}
            >
              {hasExecuted ? '🟢 REAL BITGET ORDER' : '🤖 Autonomous agent execution'}
            </p>
          </div>
        </div>
        <div
          style={{
            padding: isMobile ? '2px 10px' : '4px 14px',
            borderRadius: '100px',
            fontSize: isMobile ? '10px' : '12px',
            background: hasExecuted ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.04)',
            color: hasExecuted ? '#00D4AA' : 'rgba(255,255,255,0.3)'
          }}
        >
          {hasExecuted ? '✅ Filled' : 'Pending'}
        </div>
      </div>

      {hasExecuted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
          <div
            style={{
              padding: isMobile ? '16px' : '20px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '12px' : '16px',
              background: isPositive || isOpen ? 'rgba(0,212,170,0.05)' : 'rgba(255,107,107,0.05)',
              border: `1px solid ${isPositive || isOpen ? 'rgba(0,212,170,0.2)' : 'rgba(255,107,107,0.2)'}`,
              flexWrap: 'wrap'
            }}
          >
            {isPositive || isOpen ? (
              <CheckCircle size={isMobile ? 24 : 28} style={{ color: '#00D4AA' }} />
            ) : (
              <XCircle size={isMobile ? 24 : 28} style={{ color: '#FF6B6B' }} />
            )}
            <div>
              <p
                style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                  color: isPositive || isOpen ? '#00D4AA' : '#FF6B6B'
                }}
              >
                {action} — {result}
              </p>
              <p
                style={{
                  fontSize: isMobile ? '13px' : '14px',
                  color: pnl >= 0 ? '#00D4AA' : '#FF6B6B'
                }}
              >
                Trade P&L: {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT
              </p>
              <p
                style={{
                  fontSize: isMobile ? '12px' : '13px',
                  color: totalPnL >= 0 ? '#00D4AA' : '#FF6B6B'
                }}
              >
                Total P&L: {totalPnL >= 0 ? '+' : ''}{totalPnL.toFixed(2)} USDT
              </p>
            </div>
            <div
              style={{
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '10px',
                background: 'rgba(0,212,170,0.1)',
                border: '1px solid rgba(0,212,170,0.2)',
                color: '#00D4AA'
              }}
            >
              <Bot size={12} style={{ display: 'inline', marginRight: '4px' }} />
              AUTO AGENT
            </div>
          </div>

          {orderId && (
            <div
              style={{
                padding: isMobile ? '12px' : '14px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Hash size={isMobile ? 12 : 14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <span
                  style={{
                    fontSize: isMobile ? '10px' : '12px',
                    color: 'rgba(255,255,255,0.3)'
                  }}
                >
                  Bitget Order ID
                </span>
              </div>
              <p
                style={{
                  fontSize: isMobile ? '10px' : '12px',
                  fontFamily: 'monospace',
                  color: '#00D4AA',
                  wordBreak: 'break-all'
                }}
              >
                {orderId}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <a
                  href="https://www.bitget.com/spot/BTCUSDT"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '11px',
                    color: '#6C3CE1',
                    textDecoration: 'none'
                  }}
                >
                  🔗 View on Bitget (Orders → Order History)
                </a>
                <button
                  onClick={() => {
                    try { navigator.clipboard.writeText(orderId) } catch (e) {}
                  }}
                  style={{
                    fontSize: '10px',
                    color: '#00D4AA',
                    background: 'rgba(0,212,170,0.08)',
                    border: '1px solid rgba(0,212,170,0.2)',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Copy Order ID
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: isMobile ? '10px' : '12px',
              color: 'rgba(255,255,255,0.2)',
              flexWrap: 'wrap',
              gap: '4px'
            }}
          >
            <span>
              Executed:{' '}
              {latestTrade.timestamp ? new Date(latestTrade.timestamp).toLocaleTimeString() : '...'}
            </span>
            <span>Conviction: {Math.round(safeNumber(latestTrade.conviction || latestTrade.confidence, 0))}%</span>
            <span style={{ color: '#00D4AA' }}>🤖 Autonomous</span>
          </div>

          <div
            style={{
              padding: isMobile ? '8px' : '10px',
              borderRadius: '8px',
              background: 'rgba(0,212,170,0.03)',
              border: '1px solid rgba(0,212,170,0.06)',
              fontSize: isMobile ? '10px' : '11px',
              color: 'rgba(255,255,255,0.3)',
              textAlign: 'center'
            }}
          >
            📊 {totalTrades} total autonomous trades recorded
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: isMobile ? '32px 0' : '40px 0',
            color: 'rgba(255,255,255,0.2)'
          }}
        >
          <Clock size={isMobile ? 32 : 40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'rgba(255,255,255,0.4)' }}>
            Awaiting autonomous execution...
          </p>
          <p style={{ fontSize: isMobile ? '12px' : '13px', marginTop: '6px', color: 'rgba(255,255,255,0.2)' }}>
            Orbis will execute trades from the funded agent wallet.
          </p>
        </div>
      )}
    </div>
  )
}