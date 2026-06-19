// src/components/trading/ExecutionResult.jsx - REAL TX
import React from 'react'
import { useApp } from '../../context/AppContext'
import { CheckCircle, XCircle, Clock, Hash, Zap } from 'lucide-react'

export default function ExecutionResult({ isMobile = false }) {
  const { state } = useApp()
  const trade = state.currentTrade

  // Check if tx is real (starts with 0x and is 66 chars)
  const isRealTx = trade?.txHash?.startsWith('0x') && trade?.txHash?.length === 66

  return (
    <div style={{
      padding: isMobile ? '20px' : '28px',
      borderRadius: '20px',
      background: 'rgba(20, 20, 30, 0.8)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
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
            background: 'linear-gradient(135deg, #FF6B6B, #F87171)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Zap size={isMobile ? 18 : 22} style={{ color: 'white' }} />
          </div>
          <div>
            <h3 style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: 600 }}>
              Execution Result
            </h3>
            <p style={{ 
              fontSize: isMobile ? '11px' : '12px', 
              color: isRealTx ? '#00D4AA' : '#FF6B6B'
            }}>
              {isRealTx ? '🔴 REAL BSC TX' : '⚠️ NO TX YET'}
            </p>
          </div>
        </div>
        <div style={{
          padding: isMobile ? '2px 10px' : '4px 14px',
          borderRadius: '100px',
          fontSize: isMobile ? '10px' : '12px',
          background: trade ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.04)',
          color: trade ? '#00D4AA' : 'rgba(255,255,255,0.3)'
        }}>
          {trade ? (isRealTx ? '✅ BSC Executed' : 'Completed') : 'Pending'}
        </div>
      </div>

      {trade ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
          <div style={{
            padding: isMobile ? '16px' : '20px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px',
            background: trade.result === 'WIN' 
              ? 'rgba(0,212,170,0.05)' 
              : 'rgba(255,107,107,0.05)',
            border: `1px solid ${trade.result === 'WIN' ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,107,0.1)'}`,
            flexWrap: 'wrap'
          }}>
            {trade.result === 'WIN' 
              ? <CheckCircle size={isMobile ? 24 : 28} style={{ color: '#00D4AA' }} />
              : <XCircle size={isMobile ? 24 : 28} style={{ color: '#FF6B6B' }} />
            }
            <div>
              <p style={{ 
                fontSize: isMobile ? '18px' : '20px', 
                fontWeight: 600,
                color: trade.result === 'WIN' ? '#00D4AA' : '#FF6B6B'
              }}>
                {trade.result || 'PENDING'}
              </p>
              <p style={{ 
                fontSize: isMobile ? '13px' : '14px',
                color: (trade.profit || 0) > 0 ? '#00D4AA' : '#FF6B6B'
              }}>
                {trade.profit !== undefined ? `Profit: $${trade.profit.toFixed(2)}` : 'Waiting for result...'}
              </p>
            </div>
            {isRealTx && (
              <div style={{
                padding: '4px 12px',
                borderRadius: '100px',
                fontSize: '10px',
                background: 'rgba(0,212,170,0.1)',
                border: '1px solid rgba(0,212,170,0.2)',
                color: '#00D4AA'
              }}>
                🔗 REAL BSC
              </div>
            )}
          </div>

          {trade.txHash && (
            <div style={{
              padding: isMobile ? '12px' : '14px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Hash size={isMobile ? 12 : 14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <span style={{ 
                  fontSize: isMobile ? '10px' : '12px', 
                  color: 'rgba(255,255,255,0.3)' 
                }}>
                  {isRealTx ? '🔴 REAL BSC Transaction Hash' : 'Transaction Hash'}
                </span>
              </div>
              <p style={{
                fontSize: isMobile ? '10px' : '12px',
                fontFamily: 'monospace',
                color: isRealTx ? '#00D4AA' : 'rgba(255,255,255,0.4)',
                wordBreak: 'break-all'
              }}>
                {trade.txHash}
              </p>
              {isRealTx && (
                <a
                  href={`https://bscscan.com/tx/${trade.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#6C3CE1',
                    textDecoration: 'none'
                  }}
                >
                  🔗 View on BSCScan
                </a>
              )}
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: isMobile ? '10px' : '12px',
            color: 'rgba(255,255,255,0.2)',
            flexWrap: 'wrap',
            gap: '4px'
          }}>
            <span>Executed: {trade.executedAt ? new Date(trade.executedAt).toLocaleTimeString() : '...'}</span>
            <span>Conviction: {Math.round(trade.conviction || 0)}%</span>
            {isRealTx && (
              <span style={{ color: '#00D4AA' }}>🔴 REAL</span>
            )}
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center',
          padding: isMobile ? '32px 0' : '40px 0',
          color: 'rgba(255,255,255,0.2)'
        }}>
          <Clock size={isMobile ? 32 : 40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <p style={{ fontSize: isMobile ? '14px' : '15px', color: 'rgba(255,255,255,0.4)' }}>
            Awaiting execution on BSC...
          </p>
          <p style={{ fontSize: isMobile ? '12px' : '13px', marginTop: '6px', color: 'rgba(255,255,255,0.2)' }}>
            Trades execute on BNB Smart Chain
          </p>
        </div>
      )}
    </div>
  )
}
