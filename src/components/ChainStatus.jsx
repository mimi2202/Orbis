import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { Wallet, CheckCircle, Loader, Power } from 'lucide-react'
import { connectWallet, disconnectWallet, getChainStatus } from '../utils/chain'

export default function ChainStatus({ isMobile = false }) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletInfo, setWalletInfo] = useState(null)
  const { state, dispatch } = useApp()

  useEffect(() => {
    const status = getChainStatus()
    if (status.isConnected) {
      setWalletInfo(status)
      dispatch({ type: 'SET_CHAIN_MODE', payload: 'REAL' })
      dispatch({ type: 'SET_WALLET', payload: status })
    }
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const result = await connectWallet()
      setWalletInfo(result)
      dispatch({ type: 'SET_CHAIN_MODE', payload: 'REAL' })
      dispatch({ type: 'SET_WALLET', payload: result })
    } catch (error) {
      console.error('Failed to connect:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    disconnectWallet()
    setWalletInfo(null)
    dispatch({ type: 'SET_CHAIN_MODE', payload: 'REAL' })
    dispatch({ type: 'SET_WALLET', payload: null })
  }

  if (state.chainMode === 'REAL' && walletInfo) {
    return (
      <button
        onClick={handleDisconnect}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '6px' : '10px',
          padding: isMobile ? '6px 12px' : '8px 16px',
          borderRadius: '12px',
          background: 'rgba(0,212,170,0.1)',
          border: '1px solid rgba(0,212,170,0.2)',
          color: '#00D4AA',
          cursor: 'pointer',
          fontSize: isMobile ? '11px' : '13px',
          fontWeight: 500,
          transition: 'all 0.3s ease'
        }}
      >
        <CheckCircle size={isMobile ? 14 : 18} />
        {isMobile ? 'Connected' : 'Wallet Connected'}
        <span style={{
          fontSize: isMobile ? '9px' : '11px',
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'monospace'
        }}>
          {walletInfo.address.slice(0, 4)}...{walletInfo.address.slice(-4)}
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '6px' : '10px',
        padding: isMobile ? '6px 12px' : '8px 16px',
        borderRadius: '12px',
        background: 'rgba(108,60,225,0.1)',
        border: '1px solid rgba(108,60,225,0.15)',
        color: '#6C3CE1',
        cursor: isConnecting ? 'default' : 'pointer',
        fontSize: isMobile ? '11px' : '13px',
        fontWeight: 500,
        transition: 'all 0.3s ease'
      }}
    >
      {isConnecting ? (
        <Loader size={isMobile ? 14 : 18} className="animate-spin-slow" />
      ) : (
        <Wallet size={isMobile ? 14 : 18} />
      )}
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
