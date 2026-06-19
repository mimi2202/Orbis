import React from 'react'
import { useApp } from '../../context/AppContext'
import { Shield, Award, TrendingUp, TrendingDown, Zap } from 'lucide-react'

export default function ReputationDisplay({ isMobile = false, isTablet = false }) {
  const { state } = useApp()
  const agents = state.agents

  const getGridColumns = () => {
    if (isMobile) return '1fr'
    if (isTablet) return 'repeat(2, 1fr)'
    return 'repeat(3, 1fr)'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
      {/* Main Reputation Section */}
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
          gap: isMobile ? '12px' : '14px', 
          marginBottom: isMobile ? '16px' : '24px' 
        }}>
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
            <Shield size={isMobile ? 18 : 22} style={{ color: 'white' }} />
          </div>
          <div>
            <h3 style={{ 
              fontSize: isMobile ? '16px' : '17px', 
              fontWeight: 600 
            }}>
              Reputation Engine
            </h3>
            <p style={{ 
              fontSize: isMobile ? '11px' : '12px', 
              color: 'rgba(255,255,255,0.4)' 
            }}>
              Trust Layer • Updated After Each Trade
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: getGridColumns(),
          gap: isMobile ? '12px' : '16px'
        }}>
          {agents.map(agent => (
            <div key={agent.type} style={{
              padding: isMobile ? '16px' : '20px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: isMobile ? '10px' : '12px', 
                marginBottom: isMobile ? '12px' : '16px' 
              }}>
                <div style={{ 
                  fontSize: isMobile ? '24px' : '28px',
                  flexShrink: 0
                }}>
                  {agent.icon}
                </div>
                <div>
                  <p style={{ 
                    fontSize: isMobile ? '14px' : '15px', 
                    fontWeight: 600, 
                    textTransform: 'capitalize' 
                  }}>
                    {agent.type}
                  </p>
                  <p style={{ 
                    fontSize: isMobile ? '11px' : '12px', 
                    color: 'rgba(255,255,255,0.3)' 
                  }}>
                    Provider
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '12px' }}>
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '4px' 
                  }}>
                    <span style={{ 
                      fontSize: isMobile ? '12px' : '13px', 
                      color: 'rgba(255,255,255,0.3)' 
                    }}>
                      Trust Score
                    </span>
                    <span style={{ 
                      fontSize: isMobile ? '12px' : '13px', 
                      fontWeight: 500 
                    }}>
                      {Math.round(agent.trust)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: isMobile ? '3px' : '4px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${agent.trust}%`,
                      height: '100%',
                      borderRadius: '4px',
                      background: 'linear-gradient(90deg, #6C3CE1, #00D4AA)',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '4px' 
                  }}>
                    <span style={{ 
                      fontSize: isMobile ? '12px' : '13px', 
                      color: 'rgba(255,255,255,0.3)' 
                    }}>
                      Accuracy
                    </span>
                    <span style={{ 
                      fontSize: isMobile ? '12px' : '13px', 
                      fontWeight: 500 
                    }}>
                      {Math.round(agent.accuracy)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: isMobile ? '3px' : '4px',
                    borderRadius: '4px',
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${agent.accuracy}%`,
                      height: '100%',
                      borderRadius: '4px',
                      background: 'linear-gradient(90deg, #FF6B6B, #F87171)',
                      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  fontSize: isMobile ? '11px' : '12px',
                  color: 'rgba(255,255,255,0.2)',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}>
                  <span>Price: ${agent.price}</span>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: agent.trust > 70 ? '#00D4AA' : '#F59E0B'
                  }}>
                    {agent.trust > 70 ? <TrendingUp size={isMobile ? 12 : 14} /> : <TrendingDown size={isMobile ? 12 : 14} />}
                    {agent.trust > 70 ? 'High Trust' : 'Medium Trust'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trades */}
      {state.trades.length > 0 && (
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
            gap: '10px', 
            marginBottom: isMobile ? '16px' : '20px',
            flexWrap: 'wrap'
          }}>
            <Award size={isMobile ? 18 : 20} style={{ color: '#00D4AA' }} />
            <h4 style={{ 
              fontSize: isMobile ? '14px' : '15px', 
              fontWeight: 600 
            }}>
              Recent Trades
            </h4>
            <span style={{
              fontSize: isMobile ? '11px' : '12px',
              padding: '2px 10px',
              borderRadius: '100px',
              background: 'rgba(255,255,255,0.04)',
              color: 'rgba(255,255,255,0.3)'
            }}>
              {state.trades.length} total
            </span>
          </div>
          <div style={{
            maxHeight: isMobile ? '160px' : '200px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {state.trades.slice(-8).reverse().map((trade, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: isMobile ? '10px 12px' : '12px 16px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.03)',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '8px' : '12px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ 
                    fontSize: isMobile ? '11px' : '12px', 
                    color: 'rgba(255,255,255,0.2)',
                    fontFamily: 'monospace'
                  }}>
                    #{state.trades.length - index}
                  </span>
                  <span style={{ 
                    fontSize: isMobile ? '11px' : '12px', 
                    color: 'rgba(255,255,255,0.3)' 
                  }}>
                    {new Date(trade.executedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: isMobile ? '10px' : '16px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ 
                    fontSize: isMobile ? '12px' : '13px',
                    color: 'rgba(255,255,255,0.4)'
                  }}>
                    {Math.round(trade.conviction)}%
                  </span>
                  <span style={{
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: 500,
                    color: trade.result === 'WIN' ? '#00D4AA' : '#FF6B6B'
                  }}>
                    {trade.result}
                  </span>
                  <span style={{
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: 600,
                    color: trade.profit > 0 ? '#00D4AA' : '#FF6B6B'
                  }}>
                    ${trade.profit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
