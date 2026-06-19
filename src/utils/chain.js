// src/utils/chain.js

let isConnected = false
let currentWallet = null

export async function connectWallet(chain = 'bsc') {
  return new Promise((resolve) => {
    setTimeout(() => {
      isConnected = true
      currentWallet = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      resolve({
        address: currentWallet,
        chain,
        balance: (Math.random() * 10 + 1).toFixed(2)
      })
    }, 1500)
  })
}

export async function executeRealTrade(trade) {
  if (!isConnected) {
    throw new Error('Wallet not connected')
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      resolve({
        success: true,
        txHash,
        blockNumber: Math.floor(Math.random() * 10000000) + 10000000,
        gasUsed: Math.floor(Math.random() * 50000) + 20000,
        status: 'confirmed'
      })
    }, 2000)
  })
}

export async function purchaseSignalOnChain(agent, price) {
  if (!isConnected) {
    throw new Error('Wallet not connected')
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      resolve({
        success: true,
        txHash,
        agent,
        price,
        timestamp: Date.now()
      })
    }, 1500)
  })
}

export function getChainStatus() {
  return {
    isConnected,
    wallet: currentWallet,
    chain: 'bsc'
  }
}

export function disconnectWallet() {
  isConnected = false
  currentWallet = null
}
