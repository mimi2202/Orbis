// src/components/SimpleWalletConnect.jsx
import React, { useState, useEffect } from 'react'
import { Wallet, Power, CheckCircle, Copy, AlertTriangle, ExternalLink } from 'lucide-react'

export default function SimpleWalletConnect({ isMobile = false }) {
  const [address, setAddress] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [manualMode, setManualMode] = useState(false)

  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum === 'undefined') {
        console.log('⚠️ No wallet found')
        return
      }

      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_accounts' 
        })
        
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
          setError(null)
          window.dispatchEvent(new CustomEvent('wallet-connected', { 
            detail: accounts[0] 
          }))
          console.log('✅ Already connected:', accounts[0])
        }
      } catch (error) {
        console.error('Check error:', error)
      }
    }
    
    checkConnection()
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') return

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAddress(null)
        setIsConnected(false)
        window.dispatchEvent(new CustomEvent('wallet-disconnected'))
        console.log('🔗 Disconnected')
      } else {
        setAddress(accounts[0])
        setIsConnected(true)
        setError(null)
        window.dispatchEvent(new CustomEvent('wallet-connected', { 
          detail: accounts[0] 
        }))
        console.log('🔗 Account changed:', accounts[0])
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
    }
  }, [])

  const connectWallet = async () => {
    setError(null)
    
    if (typeof window.ethereum === 'undefined') {
      setError('❌ Trust Wallet not installed. Please install the extension.')
      return
    }

    setIsConnecting(true)
    setManualMode(false)
    
    try {
      // Try normal connection
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      if (!accounts || accounts.length === 0) {
        setError('❌ No accounts found. Please unlock Trust Wallet.')
        setIsConnecting(false)
        return
      }

      setAddress(accounts[0])
      setIsConnected(true)
      setError(null)
      window.dispatchEvent(new CustomEvent('wallet-connected', { 
        detail: accounts[0] 
      }))
      console.log('✅ Connected:', accounts[0])
      
    } catch (error) {
      console.error('Connection error:', error)
      
      if (error.code === 4001) {
        setError('🔒 Wallet is locked. Please unlock Trust Wallet first, then try again.')
        setManualMode(true)
      } else if (error.code === -32002) {
        setError('⏳ Connection pending. Check Trust Wallet extension.')
      } else {
        setError(`❌ ${error.message || 'Failed to connect'}`)
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    setIsConnected(false)
    setError(null)
    setManualMode(false)
    window.dispatchEvent(new CustomEvent('wallet-disconnected'))
    console.log('🔗 Disconnected')
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{
      padding: isMobile ? '16px' : '24px',
      borderRadius: '20px',
      background: 'rgba(20,20,30,0.8)',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      {isConnected ? (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00D4AA, #34D399)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle size={20} style={{ color: 'white' }} />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600 }}>Wallet Connected</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    color: 'rgba(255,255,255,0.5)'
                  }}>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                  <button
                    onClick={copyAddress}
                    style={{
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? <CheckCircle size={14} style={{ color: '#00D4AA' }} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={disconnectWallet}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                background: 'rgba(255,107,107,0.1)',
                border: '1px solid rgba(255,107,107,0.15)',
                color: '#FF6B6B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Power size={14} />
              Disconnect
            </button>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              Your Agent Address (send BNB here):
            </p>
            <p style={{
              fontSize: '14px',
              fontFamily: 'monospace',
              color: '#00D4AA',
              wordBreak: 'break-all',
              marginTop: '4px'
            }}>
              {address}
            </p>
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255,107,107,0.05)',
              border: '1px solid rgba(255,107,107,0.1)',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.4)'
            }}>
              ⚠️ Send BNB (BSC) to this address to start trading
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Manual Mode Instructions */}
          {manualMode && (
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(108,60,225,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <ExternalLink size={18} style={{ color: '#6C3CE1' }} />
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#6C3CE1' }}>
                  Manual Connection Required
                </p>
              </div>
              <ol style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.6)',
                paddingLeft: '20px',
                lineHeight: '1.8'
              }}>
                <li>Click the <strong>Trust Wallet extension</strong> icon in your browser toolbar</li>
                <li><strong>Unlock</strong> your wallet with your password</li>
                <li>Make sure you're on <strong>BNB Smart Chain</strong></li>
                <li>Click <strong>"Connect"</strong> below again</li>
              </ol>
            </div>
          )}

          <button
            onClick={connectWallet}
            disabled={isConnecting}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              background: isConnecting 
                ? 'rgba(255,255,255,0.05)' 
                : 'linear-gradient(135deg, #6C3CE1, #00D4AA)',
              color: isConnecting ? 'rgba(255,255,255,0.3)' : 'white',
              cursor: isConnecting ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {isConnecting ? (
              <>
                <div style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTop: '2px solid #6C3CE1',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Connecting...
              </>
            ) : (
              <>
                <Wallet size={20} />
                {manualMode ? '🔓 Connect (After Unlocking)' : 'Connect Trust Wallet'}
              </>
            )}
          </button>
          
          {error && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(255,107,107,0.1)',
              border: '1px solid rgba(255,107,107,0.15)',
              color: '#FF6B6B',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
          
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            💡 <strong>Tip:</strong> Open Trust Wallet extension first, unlock it, then click Connect
          </div>
        </div>
      )}
    </div>
  )
}
