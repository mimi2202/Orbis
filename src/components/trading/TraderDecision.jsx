import React, { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import { Brain, Zap, ArrowRight, Clock, Play, Square } from 'lucide-react'
import { API_URL } from '../../utils/api'

export default function TraderDecision({ isMobile = false }) {
  const { state } = useApp()
  const [showDetails, setShowDetails] = useState(false)
  const [isAutoTrading, setIsAutoTrading] = useState(false)
  const [autoStatus, setAutoStatus] = useState('Idle')
  const [realTrade, setRealTrade] = useState(null)
  const trade = state.currentTrade

  // Check auto-trade status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`)
        const data = await response.json()
        if (data.success) {
          setIsAutoTrading(data.isAutoTrading || false)
          setAutoStatus(data.isAutoTrading ? '🟢 Running' : '⚪ Idle')
          if (data.trades && data.trades.length > 0) {
            setRealTrade(data.trades[0])
          }
        }
      } catch (error) {
        console.error('Failed to check status:', error)
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [API_URL])

  const startAutoTrade = async () => {
    try {
      const response = await fetch(`${API_URL}/api/start-auto-trade`, {
        method: 'POST'
      })
      const result = await response.json()
      if (result.success) {
        setIsAutoTrading(true)
        setAutoStatus('🟢 Running')
      } else {
        alert(result.message || 'Failed to start auto trading')
      }
    } catch (error) {
      console.error('Start auto trade error:', error)
      alert('Failed to start auto trading. Make sure backend is running.')
    }
  }

  const stopAutoTrade = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stop-auto-trade`, {
        method: 'POST'
      })
      const result = await response.json()
      if (result.success) {
        setIsAutoTrading(false)
        setAutoStatus('⚪ Idle')
      } else {
        alert(result.message || 'Failed to stop auto trading')
      }
    } catch (error) {
      console.error('Stop auto trade error:', error)
      alert('Failed to stop auto trading')
    }
  }

  return (
    <div style={{
      padding: isMobile ? '20px' : '28px',
      borderRadius: '20px',
      background: 'rgba(20, 20, 30, 0.8)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: isMobile ? '16px' : '24px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '14px' }}>
          <div style={{
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: isMobile ? '12px' : '14px',
            background: 'linear-gradient(135deg, #6C3CE1, #00D4AA)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Brain size={isMobile ? 18 : 22} style={{ color: 'white' }} />
          </div>
          <div>
            <h3 style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 600 }}>
              🤖 AI Trading
            </h3>
            <p style={{ 
              fontSize: isMobile ? '11px' : '12px', 
              color: isAutoTrading ? '#00D4AA' : 'rgba(255,255,255,0.4)'
            }}>
              {isAutoTrading ? '🟢 Auto-trading enabled' : '⚪ Auto-trading disabled'}
            </p>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '100px',
            fontSize: isMobile ? '10px' : '12px',
            background: isAutoTrading ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.04)',
            color: isAutoTrading ? '#00D4AA' : 'rgba(255,255,255,0.3)'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isAutoTrading ? '#00D4AA' : 'rgba(255,255,255,0.2)',
              animation: isAutoTrading ? 'pulseGlow 1s ease-in-out infinite' : 'none'
            }} />
            {autoStatus}
          </div>
          {isAutoTrading ? (
            <button
              onClick={stopAutoTrade}
              style={{
                padding: isMobile ? '6px 14px' : '8px 20px',
                borderRadius: '10px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: 600,
                border: 'none',
                background: 'rgba(255,107,107,0.15)',
                color: '#FF6B6B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Square size={isMobile ? 14 : 16} />
              Stop
            </button>
          ) : (
            <button
              onClick={startAutoTrade}
              style={{
                padding: isMobile ? '6px 14px' : '8px 20px',
                borderRadius: '10px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: 600,
                border: 'none',
                background: 'linear-gradient(135deg, #6C3CE1, #00D4AA)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Play size={isMobile ? 14 : 16} />
              Start Auto
            </button>
          )}
        </div>
      </div>

      {/* Rest of the component remains the same */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: isMobile ? '12px' : '14px'
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>
          {isAutoTrading 
            ? '🤖 AI is actively trading on BSC' 
            : '⏸️ AI is paused'}
        </span>
        <span style={{ 
          color: isAutoTrading ? '#00D4AA' : 'rgba(255,255,255,0.3)',
          fontFamily: 'monospace'
        }}>
          {isAutoTrading ? '🔴 REAL BSC' : '⚪ IDLE'}
        </span>
      </div>

      {/* AI Decision Display */}
      {realTrade || trade ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
          <div style={{
            padding: isMobile ? '16px' : '20px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <p style={{ fontSize: isMobile ? '11px' : '13px', color: 'rgba(255,255,255,0.3)' }}>
                {realTrade ? 'REAL Trade Result' : 'Conviction Score'}
              </p>
              <p style={{ 
                fontSize: isMobile ? '28px' : '32px', 
                fontWeight: 700, 
                letterSpacing: '-0.5px',
                color: realTrade?.pnl > 0 ? '#00D4AA' : realTrade?.pnl < 0 ? '#FF6B6B' : 'white'
              }}>
                {realTrade ? `$${realTrade.pnl?.toFixed(2)}` : `${Math.round(trade?.conviction || 0)}%`}
              </p>
            </div>
            <div style={{
              padding: isMobile ? '6px 16px' : '8px 20px',
              borderRadius: '12px',
              fontSize: isMobile ? '13px' : '15px',
              fontWeight: 600,
              background: realTrade?.pnl > 0 
                ? 'rgba(0,212,170,0.1)' 
                : realTrade?.pnl < 0
                  ? 'rgba(255,107,107,0.1)'
                  : 'rgba(255,255,255,0.05)',
              color: realTrade?.pnl > 0 ? '#00D4AA' : realTrade?.pnl < 0 ? '#FF6B6B' : 'rgba(255,255,255,0.5)'
            }}>
              {realTrade ? (realTrade.pnl > 0 ? '✅ PROFIT' : realTrade.pnl < 0 ? '❌ LOSS' : 'HOLD') : trade?.decision || 'WAITING'}
            </div>
          </div>

          {realTrade && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', 
              gap: isMobile ? '10px' : '12px' 
            }}>
              <div style={{
                padding: isMobile ? '12px' : '14px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>
                <p style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.3)' }}>
                  Entry Price
                </p>
                <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: 'white' }}>
                  ${realTrade.entryPrice?.toFixed(2) || '—'}
                </p>
              </div>
              <div style={{
                padding: isMobile ? '12px' : '14px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.04)'
              }}>
                <p style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.3)' }}>
                  Exit Price
                </p>
                <p style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 600, color: 'white' }}>
                  ${realTrade.exitPrice?.toFixed(2) || '—'}
                </p>
              </div>
            </div>
          )}

          {realTrade?.txHash && (
            <div style={{
              padding: isMobile ? '12px' : '14px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: isMobile ? '10px' : '12px', color: 'rgba(255,255,255,0.3)' }}>
                  🔴 REAL BSC Transaction
                </span>
              </div>
              <p style={{
                fontSize: isMobile ? '10px' : '12px',
                fontFamily: 'monospace',
                color: '#00D4AA',
                wordBreak: 'break-all'
              }}>
                {realTrade.txHash.slice(0, 20)}...{realTrade.txHash.slice(-10)}
              </p>
            </div>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              padding: isMobile ? '8px' : '10px',
              borderRadius: '12px',
              fontSize: isMobile ? '12px' : '13px',
              color: 'rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.04)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {showDetails ? 'Hide' : 'Show'} Trade Details
            <ArrowRight size={isMobile ? 14 : 16} style={{ 
              transform: showDetails ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }} />
          </button>

          {showDetails && (
            <div style={{
              maxHeight: isMobile ? '140px' : '160px',
              overflowY: 'auto',
              padding: '4px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)',
                marginBottom: '4px',
                fontSize: isMobile ? '12px' : '13px'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Amount</span>
                <span style={{ color: 'white' }}>{realTrade?.amount || '—'} BNB</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)',
                fontSize: isMobile ? '12px' : '13px'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>P&L</span>
                <span style={{ color: realTrade?.pnl > 0 ? '#00D4AA' : '#FF6B6B' }}>
                  ${realTrade?.pnl?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center',
          padding: isMobile ? '32px 0' : '40px 0',
          color: 'rgba(255,255,255,0.2)'
        }}>
          <Brain size={isMobile ? 32 : 40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'rgba(255,255,255,0.4)' }}>
            Waiting for AI signals...
          </p>
          <p style={{ fontSize: isMobile ? '12px' : '13px', marginTop: '6px', color: 'rgba(255,255,255,0.2)' }}>
            Click "Start Auto" to begin AI trading
          </p>
        </div>
      )}
    </div>
  )
}
