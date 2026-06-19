import React, { useState, useEffect } from 'react'
import { Brain, Zap, Menu, X, Activity, TrendingUp, DollarSign, RotateCcw } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Header({ isMobile = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { state, dispatch } = useApp()
  
  // Real-time stats from server
  const totalTrades = state.trades.length || state.tradeCount || 0
  const winRate = totalTrades > 0 
    ? Math.round((state.trades.filter(t => t.result === 'WIN').length / totalTrades) * 100)
    : 0
  const totalPnL = state.trades.reduce((acc, t) => acc + (t.profit || 0), 0)

  // Get latest market prices from signals
  const getLatestPrices = () => {
    const prices = {}
    state.agents.forEach(agent => {
      if (agent.signal && agent.signal.price) {
        prices[agent.type] = {
          price: agent.signal.price,
          change: agent.signal.change24h || 0,
          source: agent.signal.source || 'CMC Real Data'
        }
      }
    })
    return prices
  }

  const prices = getLatestPrices()

  // Handle reset
  const handleReset = () => {
    if (window.confirm('⚠️ Reset all trade history? This cannot be undone!')) {
      dispatch({ type: 'CLEAR_HISTORY' })
      localStorage.removeItem('syntra-state')
      window.location.reload()
    }
  }

  return (
    <div style={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      gap: isMobile ? '8px' : '0'
    }}>
      {/* Logo Section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? '10px' : '16px',
        flex: isMobile ? '1' : 'none',
        minWidth: isMobile ? 'auto' : '200px'
      }}>
        <div style={{
          position: 'relative',
          width: isMobile ? '40px' : '56px',
          height: isMobile ? '40px' : '56px',
          borderRadius: isMobile ? '12px' : '16px',
          background: 'linear-gradient(135deg, #6C3CE1, #00D4AA)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(108,60,225,0.3)',
          flexShrink: 0
        }}>
          <Brain size={isMobile ? 20 : 28} style={{ color: 'white' }} />
          <div style={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: isMobile ? '14px' : '18px',
            padding: '2px',
            background: 'linear-gradient(135deg, #6C3CE1, #00D4AA, transparent)',
            opacity: 0.3,
            pointerEvents: 'none'
          }} />
        </div>
        <div>
          <h1 style={{ 
            fontSize: isMobile ? '18px' : '28px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '12px',
            flexWrap: 'wrap'
          }}>
            <span>Syntra</span>
            <span style={{
              fontSize: isMobile ? '9px' : '12px',
              fontWeight: 500,
              padding: isMobile ? '2px 8px' : '4px 12px',
              borderRadius: '100px',
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.3px'
            }}>
              v1.0
            </span>
          </h1>
          {!isMobile && (
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '2px'
            }}>
              <Zap size={14} style={{ color: '#00D4AA' }} />
              Autonomous Intelligence Exchange
            </p>
          )}
        </div>
      </div>

      {/* Right Section - Desktop */}
      {!isMobile && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          flexShrink: 1,
          flexWrap: 'wrap',
          justifyContent: 'flex-end'
        }}>
          {/* Market Prices */}
          {Object.keys(prices).length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {Object.entries(prices).map(([key, data]) => (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'capitalize'
                  }}>
                    {key === 'whale' ? 'BTC' : key === 'narrative' ? 'SOL' : 'ETH'}:
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: 'white',
                    fontWeight: 600
                  }}>
                    ${data.price ? data.price.toFixed(2) : '0.00'}
                  </span>
                  <span style={{
                    fontSize: '9px',
                    color: data.change > 0 ? '#00D4AA' : '#FF6B6B',
                    fontWeight: 500
                  }}>
                    {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Real-time Stats */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '12px',
            background: 'rgba(0,212,170,0.06)',
            border: '1px solid rgba(0,212,170,0.12)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Activity size={12} style={{ color: '#00D4AA' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                {totalTrades}
              </span>
            </div>
            <div style={{
              width: '1px',
              height: '14px',
              background: 'rgba(255,255,255,0.06)'
            }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <TrendingUp size={12} style={{ color: winRate > 50 ? '#00D4AA' : '#FF6B6B' }} />
              <span style={{ 
                fontSize: '11px',
                color: winRate > 50 ? '#00D4AA' : '#FF6B6B',
                fontWeight: 600
              }}>
                {winRate}%
              </span>
            </div>
            <div style={{
              width: '1px',
              height: '14px',
              background: 'rgba(255,255,255,0.06)'
            }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <DollarSign size={12} style={{ color: totalPnL > 0 ? '#00D4AA' : '#FF6B6B' }} />
              <span style={{ 
                fontSize: '11px',
                color: totalPnL > 0 ? '#00D4AA' : '#FF6B6B',
                fontWeight: 600
              }}>
                ${totalPnL.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Live Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '12px',
            background: 'rgba(0,212,170,0.12)',
            border: '1px solid rgba(0,212,170,0.2)'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#00D4AA',
              boxShadow: '0 0 16px rgba(0,212,170,0.6)',
              animation: 'pulseGlow 1s ease-in-out infinite'
            }} />
            <span style={{ fontSize: '11px', color: '#00D4AA', fontWeight: 600 }}>LIVE</span>
          </div>

          {/* REAL Mode */}
          <div style={{
            padding: '4px 10px',
            borderRadius: '12px',
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.15)'
          }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              color: '#FF6B6B'
            }}>
              🔴 REAL
            </span>
          </div>

          {/* Reset Button - FIXED */}
          <button
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '12px',
              background: 'rgba(255,107,107,0.08)',
              border: '1px solid rgba(255,107,107,0.15)',
              color: '#FF6B6B',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 500,
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,107,107,0.15)'
              e.currentTarget.style.borderColor = 'rgba(255,107,107,0.25)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,107,107,0.08)'
              e.currentTarget.style.borderColor = 'rgba(255,107,107,0.15)'
            }}
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      )}

      {/* Mobile Menu Button */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '8px',
            background: 'rgba(0,212,170,0.1)',
            border: '1px solid rgba(0,212,170,0.15)'
          }}>
            <div style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#00D4AA',
              animation: 'pulseGlow 1s ease-in-out infinite'
            }} />
            <span style={{ fontSize: '9px', color: '#00D4AA', fontWeight: 600 }}>LIVE</span>
          </div>
          
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      )}

      {/* Mobile Dropdown Menu */}
      {isMobile && menuOpen && (
        <div style={{
          width: '100%',
          marginTop: '8px',
          padding: '16px',
          borderRadius: '14px',
          background: 'rgba(20,20,30,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Market Prices - Mobile */}
            {Object.keys(prices).length > 0 && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Market Prices</span>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {Object.entries(prices).map(([key, data]) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                        {key === 'whale' ? 'BTC' : key === 'narrative' ? 'SOL' : 'ETH'}:
                      </span>
                      <span style={{ fontSize: '11px', color: 'white', fontWeight: 600 }}>
                        ${data.price ? data.price.toFixed(2) : '0.00'}
                      </span>
                      <span style={{
                        fontSize: '9px',
                        color: data.change > 0 ? '#00D4AA' : '#FF6B6B'
                      }}>
                        {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Trades</span>
              <span style={{ fontSize: '12px', color: 'white', fontWeight: 500 }}>
                {totalTrades}
              </span>
            </div>
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Win Rate</span>
              <span style={{ 
                fontSize: '12px', 
                color: winRate > 50 ? '#00D4AA' : '#FF6B6B',
                fontWeight: 500 
              }}>
                {winRate}%
              </span>
            </div>
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>P&L</span>
              <span style={{ 
                fontSize: '12px', 
                color: totalPnL > 0 ? '#00D4AA' : '#FF6B6B',
                fontWeight: 500 
              }}>
                ${totalPnL.toFixed(2)}
              </span>
            </div>
            <div style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Mode</span>
              <span style={{ fontSize: '12px', color: '#FF6B6B', fontWeight: 600 }}>
                🔴 REAL
              </span>
            </div>

            {/* Reset Button - Mobile */}
            <button
              onClick={handleReset}
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(255,107,107,0.08)',
                border: '1px solid rgba(255,107,107,0.15)',
                color: '#FF6B6B',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px'
              }}
            >
              <RotateCcw size={14} />
              Reset All History
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
