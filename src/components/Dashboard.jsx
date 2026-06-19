// src/components/Dashboard.jsx - CENTERED & FULL WIDTH
import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import Header from './Header'
import Stats from './Stats'
import Marketplace from './marketplace/Marketplace'
import WhaleAgent from './agents/WhaleAgent'
import NarrativeAgent from './agents/NarrativeAgent'
import DerivativesAgent from './agents/DerivativesAgent'
import TraderDecision from './trading/TraderDecision'
import ExecutionResult from './trading/ExecutionResult'
import ReputationDisplay from './reputation/ReputationDisplay'
import WalletConnectButton from './WalletConnectButton'
import { Store, Signal, Brain, Shield, Menu, X, Wallet } from 'lucide-react'

export default function Dashboard() {
  const { state } = useApp()
  const [activeTab, setActiveTab] = useState('wallet')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [isTablet, setIsTablet] = useState(window.innerWidth < 1024)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth < 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const tabs = [
    { id: 'wallet', label: ' Wallet', icon: Wallet },
    { id: 'marketplace', label: ' Marketplace', icon: Store },
    { id: 'signals', label: ' Live Signals', icon: Signal },
    { id: 'trading', label: ' AI Trading', icon: Brain },
    { id: 'reputation', label: ' Reputation', icon: Shield }
  ]

  const getGridColumns = () => {
    if (isMobile) return '1fr'
    if (isTablet) return 'repeat(2, 1fr)'
    return 'repeat(3, 1fr)'
  }

  const getTradingGridColumns = () => {
    if (isMobile) return '1fr'
    return '1fr 1fr'
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(108,60,225,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,212,170,0.05) 0%, transparent 50%), #0A0A0F',
      padding: isMobile ? '12px' : '20px 24px',
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{ 
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
      }}>
        <Header isMobile={isMobile} />
        
        <div style={{ marginTop: isMobile ? '16px' : '24px' }}>
          <Stats isMobile={isMobile} />
        </div>

        {/* Tabs */}
        <div style={{ marginTop: isMobile ? '16px' : '24px', display: 'flex', justifyContent: 'center' }}>
          {isMobile ? (
            <div style={{ position: 'relative', width: '100%' }}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {tabs.find(t => t.id === activeTab)?.icon && 
                    React.createElement(tabs.find(t => t.id === activeTab).icon, { size: 18 })
                  }
                  {tabs.find(t => t.id === activeTab)?.label}
                </span>
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              
              {mobileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  right: 0,
                  background: 'rgba(20,20,30,0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  padding: '6px',
                  zIndex: 50,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                }}>
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id)
                          setMobileMenuOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                          background: isActive ? 'linear-gradient(135deg, #6C3CE1, #00D4AA)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              padding: '4px',
              display: 'flex',
              gap: '4px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {tabs.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                      background: isActive ? 'linear-gradient(135deg, #6C3CE1, #00D4AA)' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: isActive ? '0 4px 16px rgba(108,60,225,0.3)' : 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ marginTop: isMobile ? '16px' : '24px' }}>
          {activeTab === 'wallet' && <WalletConnectButton isMobile={isMobile} />}
          
          {activeTab === 'marketplace' && <Marketplace isMobile={isMobile} isTablet={isTablet} />}
          
          {activeTab === 'signals' && (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: getGridColumns(),
              gap: isMobile ? '12px' : '16px'
            }}>
              <WhaleAgent isMobile={isMobile} />
              <NarrativeAgent isMobile={isMobile} />
              <DerivativesAgent isMobile={isMobile} />
            </div>
          )}
          
          {activeTab === 'trading' && (
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: getTradingGridColumns(),
              gap: isMobile ? '12px' : '16px'
            }}>
              <TraderDecision isMobile={isMobile} />
              <ExecutionResult isMobile={isMobile} />
            </div>
          )}
          
          {activeTab === 'reputation' && <ReputationDisplay isMobile={isMobile} isTablet={isTablet} />}
        </div>
      </div>
    </div>
  )
}
