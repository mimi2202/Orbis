import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { API_URL } from '../utils/api'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Shield, RefreshCw, RotateCcw } from 'lucide-react'

const DEFAULT_RISK_LIMITS = {
  maxTradeAmount: 5,
  maxDailyLoss: 10,
  maxDailyTrades: 10
}


export default function RealTrading({ isMobile = false }) {
  const { state } = useApp()
  const [balance, setBalance] = useState(null)
  const [price, setPrice] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tradeResult, setTradeResult] = useState(null)
  const [riskLimits, setRiskLimits] = useState(DEFAULT_RISK_LIMITS)
  

  // Manual trading states
  const [manualDecision, setManualDecision] = useState('BUY')
  const [manualAmount, setManualAmount] = useState('0.001')
  const [manualResult, setManualResult] = useState(null)

  // Fetch data from backend
  const fetchData = async () => {
    try {
      const [balanceRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/balance`),
        fetch(`${API_URL}/api/status`)
      ])
      
      const balanceData = await balanceRes.json()
      const statusData = await statusRes.json()
      
      if (balanceData.success) setBalance(balanceData)
      if (statusData.success) {
        setStatus(statusData)
        if (statusData.limits) {
          setRiskLimits(statusData.limits)
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Failed to connect to trading server.')
    }
  }

  // Reset everything
  const handleReset = async () => {
    if (window.confirm('⚠️ Reset all trades and positions? This cannot be undone!')) {
      setLoading(true)
      try {
        const response = await fetch(`${API_URL}/api/reset`, {
          method: 'POST'
        })
        const result = await response.json()
        if (result.success) {
          setTradeResult(null)
          setManualResult(null)
          setError(null)
          await fetchData()
          console.log('✅ Reset successful')
        } else {
          setError(result.error || 'Reset failed')
        }
      } catch (error) {
        console.error('Reset failed:', error)
        setError('Failed to reset')
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [])

  // Execute AI trade
  const executeAITrade = async () => {
    if (!state.currentTrade || state.currentTrade.decision === 'NO BUY') return
    
    setLoading(true)
    setError(null)
    setTradeResult(null)
    setManualResult(null)
    
    try {
      const response = await fetch(`${API_URL}/api/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: state.currentTrade.decision,
          conviction: state.currentTrade.conviction
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTradeResult(result)
        await fetchData()
      } else {
        setError(result.error || 'Trade failed')
      }
    } catch (error) {
      setError(error.message || 'Failed to execute trade')
    } finally {
      setLoading(false)
    }
  }

  // Manual trade execution
  const executeManualTrade = async (decision, amount) => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)
    setManualResult(null)
    setTradeResult(null)

    try {
      const response = await fetch(`${API_URL}/api/trade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decision,
          conviction: 85,
          amount: parseFloat(amount)
        })
      })

      const result = await response.json()

      if (result.success) {
        setManualResult({
          success: true,
          message: `${decision} order executed!`,
          txHash: result.txHash || '0x...',
          amount: amount,
          price: result.price
        })
        await fetchData()
      } else {
        setError(result.error || 'Trade failed')
      }
    } catch (error) {
      setError(error.message || 'Failed to execute trade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: isMobile ? '16px' : '24px',
      borderRadius: '20px',
      background: 'rgba(20,20,30,0.8)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '12px',
            background: 'rgba(0,212,170,0.1)'
          }}>
            <DollarSign size={24} style={{ color: '#00D4AA' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>💰 Manual Trading</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {loading ? 'Executing...' : 'Place manual trades'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchData}
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)'
            }}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.2)',
              color: '#FF6B6B',
              cursor: loading ? 'default' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: loading ? 0.5 : 1
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Balance & Price */}
      {balance && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Balance (BNB)</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#00D4AA' }}>
              {balance.balance?.toFixed(4) || '0.0000'}
            </p>
          </div>
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Position</p>
            <p style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              color: status?.position ? '#00D4AA' : '#FF6B6B'
            }}>
              {status?.position ? '📈 OPEN' : '📉 CLOSED'}
            </p>
          </div>
          <div style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Mode</p>
            <p style={{ 
              fontSize: '20px', 
              fontWeight: 700, 
              color: '#FF6B6B'
            }}>
              🔴 REAL
            </p>
          </div>
        </div>
      )}

      {/* AI Decision Display */}
      {state.currentTrade && (
        <div style={{
          padding: '16px',
          borderRadius: '14px',
          background: state.currentTrade.decision === 'BUY' 
            ? 'rgba(0,212,170,0.05)' 
            : 'rgba(255,107,107,0.05)',
          border: `1px solid ${state.currentTrade.decision === 'BUY' 
            ? 'rgba(0,212,170,0.1)' 
            : 'rgba(255,107,107,0.1)'}`,
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>AI Decision</p>
              <p style={{ 
                fontSize: '24px', 
                fontWeight: 700,
                color: state.currentTrade.decision === 'BUY' ? '#00D4AA' : '#FF6B6B'
              }}>
                {state.currentTrade.decision}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Conviction</p>
              <p style={{ fontSize: '24px', fontWeight: 700 }}>
                {Math.round(state.currentTrade.conviction)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Trade Section */}
      <div style={{
        padding: '16px',
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '16px'
      }}>
        <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'rgba(255,255,255,0.6)' }}>
          💪 Manual Trade
        </h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select
            value={manualDecision}
            onChange={(e) => setManualDecision(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'white',
              fontSize: '14px',
              flex: 1,
              minWidth: '100px'
            }}
          >
            <option value="BUY">📈 BUY</option>
            <option value="SELL">📉 SELL</option>
          </select>
          <input
            type="number"
            value={manualAmount}
            onChange={(e) => setManualAmount(e.target.value)}
            placeholder="Amount in BNB"
            step="0.001"
            min="0.001"
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'white',
              fontSize: '14px',
              flex: 1,
              minWidth: '100px'
            }}
          />
          <button
            onClick={() => executeManualTrade(manualDecision, manualAmount)}
            disabled={loading || !manualAmount || parseFloat(manualAmount) <= 0}
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              background: (!manualAmount || parseFloat(manualAmount) <= 0 || loading)
                ? 'rgba(255,255,255,0.1)'
                : 'linear-gradient(135deg, #6C3CE1, #00D4AA)',
              color: (!manualAmount || parseFloat(manualAmount) <= 0 || loading)
                ? 'rgba(255,255,255,0.3)'
                : 'white',
              cursor: (!manualAmount || parseFloat(manualAmount) <= 0 || loading) ? 'default' : 'pointer'
            }}
          >
            {loading ? 'Executing...' : 'Execute'}
          </button>
        </div>
        {manualResult && (
          <div style={{
            marginTop: '8px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(0,212,170,0.1)',
            fontSize: '12px',
            color: '#00D4AA'
          }}>
            ✅ {manualResult.message} at ${manualResult.price?.toFixed(2)}
          </div>
        )}
      </div>

      {/* Execute AI Button */}
      <button
        onClick={executeAITrade}
        disabled={!state.currentTrade || loading || state.currentTrade.decision === 'NO BUY'}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '14px',
          fontSize: '16px',
          fontWeight: 600,
          border: 'none',
          cursor: (!state.currentTrade || loading || state.currentTrade.decision === 'NO BUY') 
            ? 'default' 
            : 'pointer',
          background: (!state.currentTrade || loading || state.currentTrade.decision === 'NO BUY')
            ? 'rgba(255,255,255,0.05)'
            : 'linear-gradient(135deg, #6C3CE1, #00D4AA)',
          color: (!state.currentTrade || loading || state.currentTrade.decision === 'NO BUY')
            ? 'rgba(255,255,255,0.3)'
            : 'white'
        }}
      >
        {loading ? 'Executing...' : 
         state.currentTrade?.decision === 'NO BUY' ? 'No Trade Signal' :
         'Execute AI Trade'}
      </button>

      {/* Trade Result */}
      {tradeResult && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          borderRadius: '10px',
          background: tradeResult.pnl > 0 ? 'rgba(0,212,170,0.05)' : 'rgba(255,107,107,0.05)',
          border: `1px solid ${tradeResult.pnl > 0 ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,107,0.1)'}`,
          fontSize: '13px',
          color: tradeResult.pnl > 0 ? 'rgba(255,255,255,0.7)' : '#FF6B6B'
        }}>
          {tradeResult.pnl > 0 ? '✅' : '❌'} 
          {tradeResult.message || `Trade at $${tradeResult.price?.toFixed(2)}`}
          {tradeResult.pnl && ` | P&L: $${tradeResult.pnl.toFixed(2)}`}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          borderRadius: '10px',
          background: 'rgba(255,107,107,0.1)',
          border: '1px solid rgba(255,107,107,0.15)',
          color: '#FF6B6B',
          fontSize: '13px'
        }}>
          <AlertTriangle size={14} style={{ display: 'inline', marginRight: '8px' }} />
          {error}
        </div>
      )}

      {/* Risk Warnings */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        borderRadius: '10px',
        background: 'rgba(255,107,107,0.05)',
        border: '1px solid rgba(255,107,107,0.1)',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.4)'
      }}>
        <Shield size={14} style={{ display: 'inline', marginRight: '8px' }} />
        🔴 REAL BNB Trading | 
        Balance: {status?.balance?.toFixed(4) || '0.0000'} BNB |
        Trades: {status?.totalTrades || 0} |
        P&L: ${status?.totalPnL?.toFixed(2) || '0.00'}
        {status?.position && ` | Position: $${status.position.entryPrice?.toFixed(2)}`}
      </div>
    </div>
  )
}
