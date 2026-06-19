import React, { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { ShoppingCart, Star, Shield } from 'lucide-react'
import { API_URL } from '../../utils/api'

export default function Marketplace({ isMobile = false, isTablet = false }) {
  const { state, dispatch } = useApp()
  const [purchasing, setPurchasing] = useState(null)
  const [purchaseError, setPurchaseError] = useState(null)
  
  const API_URL = import.meta.env.VITE_API_URL || '${API_URL}'

  const handlePurchase = async (agentType, price) => {
    setPurchasing(agentType)
    setPurchaseError(null)
    
    try {
      // Real purchase via backend
      const response = await fetch(`${API_URL}/api/purchase-signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agent: agentType, 
          price: price 
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        dispatch({
          type: 'PURCHASE_SIGNAL',
          payload: { agent: agentType, price }
        })
        console.log(`✅ ${agentType} signal purchased: ${result.txHash}`)
      } else {
        setPurchaseError(result.error || 'Purchase failed')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      setPurchaseError(error.message || 'Failed to purchase signal')
    } finally {
      setPurchasing(null)
    }
  }

  const getAgentData = (type) => {
    const data = {
      whale: {
        icon: '🐋',
        gradient: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)',
        description: 'Smart Money Movement'
      },
      narrative: {
        icon: '📰',
        gradient: 'linear-gradient(135deg, #00D4AA, #34D399)',
        description: 'Market Narrative Strength'
      },
      derivatives: {
        icon: '📊',
        gradient: 'linear-gradient(135deg, #FF6B6B, #F87171)',
        description: 'Funding & Leverage'
      }
    }
    return data[type]
  }

  const getGridColumns = () => {
    if (isMobile) return '1fr'
    if (isTablet) return 'repeat(2, 1fr)'
    return 'repeat(3, 1fr)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '28px' }}>
      <div style={{
        padding: isMobile ? '16px 20px' : '28px 32px',
        borderRadius: '20px',
        background: 'rgba(20, 20, 30, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0'
      }}>
        <div>
          <h2 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingCart size={isMobile ? 20 : 24} style={{ color: '#6C3CE1' }} />
            Intelligence Marketplace
          </h2>
          <p style={{ fontSize: isMobile ? '13px' : '15px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
            Purchase predictive signals from specialized AI agents
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: isMobile ? '6px 14px' : '8px 18px',
          borderRadius: '100px',
          background: 'rgba(0,212,170,0.1)',
          border: '1px solid rgba(0,212,170,0.15)'
        }}>
          <div style={{
            width: isMobile ? '6px' : '8px',
            height: isMobile ? '6px' : '8px',
            borderRadius: '50%',
            background: '#00D4AA',
            animation: 'pulseGlow 1.5s ease-in-out infinite'
          }} />
          <span style={{ fontSize: isMobile ? '11px' : '13px', color: '#00D4AA' }}>BSC REAL</span>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: getGridColumns(),
        gap: isMobile ? '16px' : '24px'
      }}>
        {state.marketplace.map((item) => {
          const agent = state.agents.find(a => a.type === item.agent)
          const agentData = getAgentData(item.agent)
          const isPurchased = item.purchased
          const isPurchasing = purchasing === item.agent

          return (
            <div
              key={item.agent}
              style={{
                padding: isMobile ? '20px' : '32px',
                borderRadius: '20px',
                background: 'rgba(20, 20, 30, 0.6)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${isPurchased ? 'rgba(0,212,170,0.2)' : 'rgba(255,255,255,0.06)'}`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.4s ease'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: agentData.gradient,
                opacity: isPurchased ? 1 : 0.3
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: isMobile ? '44px' : '56px',
                    height: isMobile ? '44px' : '56px',
                    borderRadius: isMobile ? '12px' : '16px',
                    background: agentData.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isMobile ? '22px' : '28px',
                    flexShrink: 0
                  }}>
                    {agentData.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: isMobile ? '15px' : '18px', fontWeight: 600, textTransform: 'capitalize' }}>
                      {item.agent}
                    </h3>
                    <p style={{ fontSize: isMobile ? '11px' : '13px', color: 'rgba(255,255,255,0.4)' }}>
                      {agentData.description}
                    </p>
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '4px 10px' : '6px 14px',
                  borderRadius: '100px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <Star size={isMobile ? 12 : 14} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                  <span style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 600 }}>{Math.round(item.trust)}</span>
                </div>
              </div>

              {agent?.signal && (
                <div style={{
                  padding: isMobile ? '14px' : '18px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: isMobile ? '11px' : '13px', color: 'rgba(255,255,255,0.3)' }}>Current Signal</span>
                    <span style={{
                      fontSize: isMobile ? '11px' : '13px',
                      fontWeight: 500,
                      padding: '4px 14px',
                      borderRadius: '100px',
                      background: agent.signal.direction === 'bullish' ? 'rgba(0,212,170,0.15)' : 'rgba(255,107,107,0.15)',
                      color: agent.signal.direction === 'bullish' ? '#00D4AA' : '#FF6B6B'
                    }}>
                      {agent.signal.direction === 'bullish' ? '📈 Bullish' : '📉 Bearish'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '32px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Confidence</p>
                      <p style={{ fontSize: '18px', fontWeight: 600 }}>{Math.round(agent.signal.confidence * 100)}%</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Price</p>
                      <p style={{ fontSize: '18px', fontWeight: 600 }}>${agent.signal.price.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>Trust Score</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{Math.round(item.trust)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.06)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${item.trust}%`,
                    height: '100%',
                    borderRadius: '6px',
                    background: 'linear-gradient(90deg, #6C3CE1, #00D4AA)',
                    transition: 'width 0.8s ease'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                  <span>Accuracy: {Math.round(agent?.accuracy || 70)}%</span>
                  <span>{item.price} BNB</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(item.agent, item.price)}
                disabled={isPurchased || isPurchasing}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: isPurchased || isPurchasing ? 'default' : 'pointer',
                  background: isPurchased 
                    ? 'rgba(0,212,170,0.1)' 
                    : isPurchasing
                      ? 'rgba(255,255,255,0.05)'
                      : 'linear-gradient(135deg, #6C3CE1, #00D4AA)',
                  color: isPurchased ? '#00D4AA' : isPurchasing ? 'rgba(255,255,255,0.3)' : '#FFFFFF',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {isPurchased ? (
                  <>
                    <Shield size={18} />
                    Signal Purchased ✓
                  </>
                ) : isPurchasing ? (
                  <>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255,255,255,0.2)',
                      borderTop: '2px solid #6C3CE1',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Processing on BSC...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Purchase Signal (BSC)
                  </>
                )}
              </button>

              {purchaseError && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'rgba(255,107,107,0.1)',
                  border: '1px solid rgba(255,107,107,0.15)',
                  fontSize: '11px',
                  color: '#FF6B6B'
                }}>
                  ❌ {purchaseError}
                </div>
              )}

              {isPurchased && (
                <div style={{
                  marginTop: '12px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#00D4AA'
                }}>
                  ✓ Signal integrated into intelligence pool
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
