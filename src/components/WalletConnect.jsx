import React, { useState, useEffect } from 'react'
import { useWeb3Modal } from '@web3modal/react'
import { useAccount, useDisconnect } from 'wagmi'
import { Wallet, Power, Copy, CheckCircle } from 'lucide-react'

export default function WalletConnect({ isMobile = false }) {
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)

  const formatAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
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
            marginBottom: '16px'
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
                    {formatAddress(address)}
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
              onClick={() => disconnect()}
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

          {/* Deposit Info */}
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
              ⚠️ Send BNB to this address to start trading
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => open()}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '14px',
            fontSize: '16px',
            fontWeight: 600,
            border: 'none',
            background: 'linear-gradient(135deg, #6C3CE1, #00D4AA)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <Wallet size={20} />
          Connect Wallet
        </button>
      )}
    </div>
  )
}
