import React from 'react'
import { useApp } from '../../context/AppContext'
import { TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react'

export default function DerivativesAgent({ isMobile = false }) {
  const { state } = useApp()
  const agent = state.agents.find(a => a.type === 'derivatives')
  const signal = agent?.signal

  const getRiskColor = (risk) => {
    if (risk < 0.3) return '#00D4AA'
    if (risk < 0.6) return '#F59E0B'
    return '#FF6B6B'
  }

  const getRiskLabel = (risk) => {
    if (risk < 0.3) return 'Low'
    if (risk < 0.6) return 'Medium'
    return 'High'
  }

  return (
    <div style={{
      padding: isMobile ? '20px' : '28px',
      borderRadius: '20px',
      background: 'rgba(20, 20, 30, 0.6)',
      backdropFilter: 'blur(20px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: isMobile ? '16px' : '20px' 
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
            fontSize: isMobile ? '20px' : '24px',
            flexShrink: 0
          }}>
            📊
          </div>
          <div>
            <h3 style={{ 
              fontSize: isMobile ? '15px' : '17px', 
              fontWeight: 600 
            }}>
              Derivatives Agent
            </h3>
            <p style={{ 
              fontSize: isMobile ? '11px' : '12px', 
              color: 'rgba(255,255,255,0.4)' 
            }}>
              Funding & Leverage
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={isMobile ? 12 : 14} style={{ color: signal ? '#FF6B6B' : 'rgba(255,255,255,0.1)' }} />
          <span style={{ 
            fontSize: isMobile ? '10px' : '12px', 
            color: 'rgba(255,255,255,0.3)' 
          }}>
            {signal ? 'Active' : 'Idle'}
          </span>
        </div>
      </div>

      {signal ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
          <div style={{
            padding: isMobile ? '14px' : '16px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '14px'
          }}>
            <div style={{
              padding: isMobile ? '8px' : '10px',
              borderRadius: '10px',
              background: `rgba(${signal.squeezeRisk < 0.3 ? '0,212,170' : signal.squeezeRisk < 0.6 ? '245,158,11' : '255,107,107'}, 0.1)`,
              flexShrink: 0
            }}>
              <TrendingUp size={isMobile ? 16 : 20} style={{ color: getRiskColor(signal.squeezeRisk) }} />
            </div>
            <div>
              <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'rgba(255,255,255,0.3)' }}>Squeeze Risk</p>
              <p style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                fontWeight: 600,
                color: getRiskColor(signal.squeezeRisk)
              }}>
                {getRiskLabel(signal.squeezeRisk)} ({Math.round(signal.squeezeRisk * 100)}%)
              </p>
            </div>
          </div>

          <div style={{
            padding: isMobile ? '14px' : '16px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '14px'
          }}>
            <div style={{
              padding: isMobile ? '8px' : '10px',
              borderRadius: '10px',
              background: signal.imbalance > 0.3 ? 'rgba(0,212,170,0.1)' : signal.imbalance > -0.3 ? 'rgba(245,158,11,0.1)' : 'rgba(255,107,107,0.1)',
              flexShrink: 0
            }}>
              {signal.imbalance > 0.3 
                ? <TrendingUp size={isMobile ? 16 : 20} style={{ color: '#00D4AA' }} />
                : signal.imbalance > -0.3 
                  ? <TrendingUp size={isMobile ? 16 : 20} style={{ color: '#F59E0B' }} />
                  : <TrendingDown size={isMobile ? 16 : 20} style={{ color: '#FF6B6B' }} />
              }
            </div>
            <div>
              <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'rgba(255,255,255,0.3)' }}>Market Imbalance</p>
              <p style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                fontWeight: 600,
                color: signal.imbalance > 0.3 ? '#00D4AA' : signal.imbalance > -0.3 ? '#F59E0B' : '#FF6B6B'
              }}>
                {(signal.imbalance * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: isMobile ? '12px' : '13px', color: 'rgba(255,255,255,0.3)' }}>Confidence</span>
              <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 500 }}>{Math.round(signal.confidence * 100)}%</span>
            </div>
            <div style={{
              width: '100%',
              height: isMobile ? '3px' : '4px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${signal.confidence * 100}%`,
                height: '100%',
                borderRadius: '4px',
                background: 'linear-gradient(90deg, #FF6B6B, #F87171)',
                transition: 'width 0.6s ease'
              }} />
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: isMobile ? '10px' : '12px',
            color: 'rgba(255,255,255,0.3)',
            flexWrap: 'wrap',
            gap: '4px'
          }}>
            <span>Price: ${signal.price.toFixed(4)}</span>
            <span>Updated: {new Date(signal.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center',
          padding: isMobile ? '24px 0' : '32px 0',
          color: 'rgba(255,255,255,0.2)'
        }}>
          <AlertTriangle size={isMobile ? 24 : 32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontSize: isMobile ? '13px' : '14px' }}>Waiting for signal...</p>
        </div>
      )}
    </div>
  )
}
