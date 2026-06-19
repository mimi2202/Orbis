// src/components/WalletConnectButton.jsx - FIXED
import React, { useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { useApp } from '../context/AppContext'

export default function WalletConnectButton({ isMobile = false }) {
  const { address, isConnected } = useAccount()
  const { dispatch } = useApp()

  // ✅ All hooks MUST be called BEFORE any conditional returns
  useEffect(() => {
    if (isConnected && address) {
      window.dispatchEvent(new CustomEvent('wallet-connected', { 
        detail: { address } 
      }))
      dispatch({ 
        type: 'SET_WALLET', 
        payload: { connected: true, address } 
      })
    } else {
      window.dispatchEvent(new CustomEvent('wallet-disconnected'))
      dispatch({ 
        type: 'SET_WALLET', 
        payload: { connected: false, address: null } 
      })
    }
  }, [isConnected, address, dispatch])

  // ✅ NO early return before hooks - render conditionally inside JSX
  return (
    <div style={{
      padding: isMobile ? '16px' : '24px',
      borderRadius: '20px',
      background: 'rgba(20,20,30,0.8)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <ConnectButton />
      
      <div style={{
        marginTop: '16px',
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.3)',
        textAlign: 'center'
      }}>
        💡 Supports MetaMask, Trust Wallet, Coinbase Wallet, and more
      </div>
    </div>
  )
}
