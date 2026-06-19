import React from 'react'
import { useApp } from '../../context/AppContext'
import { TrendingUp, TrendingDown, Sparkles, Zap } from 'lucide-react'

export default function NarrativeAgent({ isMobile = false }) {
  const { state } = useApp()
  const agent = state.agents.find(a => a.type === 'narrative')
  const signal = agent?.signal

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
            background: 'linear-gradient(135deg, #00D4AA, #34D399)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '20px' : '24px',
            flexShrink: 0
          }}>
            📰
          </div>
          <div>
            <h3 style={{ 
              fontSize: isMobile ? '15px' : '17px', 
              fontWeight: 600 
            }}>
              Narrative Agent
            </h3>
            <p style={{ 
              fontSize: isMobile ? '11px' : '12px', 
              color: 'rgba(255,255,255,0.4)' 
            }}>
              Market Narrative Strength
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={isMobile ? 12 : 14} style={{ color: signal ? '#00D4AA' : 'rgba(255,255,255,0.1)' }} />
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
              background: signal.direction === 'bullish' ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,107,0.1)',
              flexShrink: 0
            }}>
              {signal.direction === 'bullish' 
                ? <TrendingUp size={isMobile ? 16 : 20} style={{ color: '#00D4AA' }} />
                : <TrendingDown size={isMobile ? 16 : 20} style={{ color: '#FF6B6B' }} />
              }
            </div>
            <div>
              <p style={{ fontSize: isMobile ? '11px' : '12px', color: 'rgba(255,255,255,0.3)' }}>Direction</p>
              <p style={{ 
                fontSize: isMobile ? '14px' : '16px', 
                fontWeight: 600,
                textTransform: 'capitalize',
                color: signal.direction === 'bullish' ? '#00D4AA' : '#FF6B6B'
              }}>
                {signal.direction}
              </p>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: isMobile ? '12px' : '13px', color: 'rgba(255,255,255,0.3)' }}>Momentum Score</span>
              <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 500 }}>{Math.round(signal.momentum * 100)}%</span>
            </div>
            <div style={{
              width: '100%',
              height: isMobile ? '3px' : '4px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.06)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${signal.momentum * 100}%`,
                height: '100%',
                borderRadius: '4px',
                background: 'linear-gradient(90deg, #00D4AA, #34D399)',
                transition: 'width 0.6s ease'
              }} />
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
                background: 'linear-gradient(90deg, #6C3CE1, #00D4AA)',
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
          <Sparkles size={isMobile ? 24 : 32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
          <p style={{ fontSize: isMobile ? '13px' : '14px' }}>Waiting for signal...</p>
        </div>
      )}
    </div>
  )
}
