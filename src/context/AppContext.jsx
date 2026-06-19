import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { 
  initializeState, 
  updateAgentSignal, 
  addTrade, 
  updateReputation,
  purchaseSignal 
} from '../utils/state'
import { API_URL } from '../utils/api'
import { generateSignals, shouldUpdateSignals } from '../utils/agents'

const AppContext = createContext()

// Load state from localStorage
const loadState = () => {
  try {
    const savedState = localStorage.getItem('syntra-state')
    if (savedState) {
      const parsed = JSON.parse(savedState)
      return {
        ...initializeState(),
        ...parsed,
        agents: parsed.agents || initializeState().agents,
        marketplace: parsed.marketplace || initializeState().marketplace,
        trades: parsed.trades || [],
        currentTrade: parsed.currentTrade || null,
        lastUpdate: parsed.lastUpdate || null,
        lastExecution: parsed.lastExecution || null,
        tradeCount: parsed.tradeCount || 0,
        winCount: parsed.winCount || 0,
        walletConnected: parsed.walletConnected || false,
        walletAddress: parsed.walletAddress || null
      }
    }
  } catch (error) {
    console.error('Failed to load state:', error)
  }
  return initializeState()
}

const initialState = loadState()

function appReducer(state, action) {
  let newState
  switch (action.type) {
    case 'UPDATE_SIGNALS':
      const newSignals = action.payload
      let updatedState = { ...state }
      Object.entries(newSignals).forEach(([agentType, signal]) => {
        updatedState = updateAgentSignal(updatedState, agentType, signal)
      })
      newState = updatedState
      break

    case 'PURCHASE_SIGNAL':
      newState = purchaseSignal(state, action.payload.agent, action.payload.price)
      break

    case 'EXECUTE_TRADE':
      const trade = action.payload.trade
      newState = addTrade(state, trade)
      newState.tradeCount = (newState.tradeCount || 0) + 1
      if (trade.result === 'WIN') {
        newState.winCount = (newState.winCount || 0) + 1
      }
      break

    case 'UPDATE_REPUTATION':
      newState = updateReputation(state, action.payload)
      break

    case 'SET_LOADING':
      newState = { ...state, loading: action.payload }
      break

    case 'SET_WALLET':
      newState = { 
        ...state, 
        walletConnected: action.payload.connected,
        walletAddress: action.payload.address 
      }
      break

    case 'CLEAR_HISTORY':
      newState = {
        ...initializeState(),
        agents: state.agents.map(agent => ({ ...agent, signal: null })),
        marketplace: state.marketplace.map(item => ({ ...item, purchased: false })),
        tradeCount: 0,
        winCount: 0,
        walletConnected: state.walletConnected,
        walletAddress: state.walletAddress
      }
      break

    default:
      newState = state
  }
  
  try {
    localStorage.setItem('syntra-state', JSON.stringify(newState))
  } catch (error) {
    console.error('Failed to save state:', error)
  }
  
  return newState
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const [walletConnected, setWalletConnected] = useState(state.walletConnected || false)

  // Listen for wallet connection events
  useEffect(() => {
    const handleWalletConnected = (event) => {
      const address = event.detail?.address || event.detail
      setWalletConnected(true)
      dispatch({ 
        type: 'SET_WALLET', 
        payload: { connected: true, address: address } 
      })
      console.log('🔗 Wallet connected:', address)
    }

    const handleWalletDisconnected = () => {
      setWalletConnected(false)
      dispatch({ 
        type: 'SET_WALLET', 
        payload: { connected: false, address: null } 
      })
      console.log('🔗 Wallet disconnected')
    }

    window.addEventListener('wallet-connected', handleWalletConnected)
    window.addEventListener('wallet-disconnected', handleWalletDisconnected)
    
    return () => {
      window.removeEventListener('wallet-connected', handleWalletConnected)
      window.removeEventListener('wallet-disconnected', handleWalletDisconnected)
    }
  }, [])

  // Auto-generate signals ONLY if wallet is connected
  useEffect(() => {
    if (!walletConnected) {
      console.log('⏸️ Waiting for wallet connection...')
      return
    }

const API_URL = import.meta.env.VITE_API_URL || '${API_URL}'

    const interval = setInterval(async () => {
      if (shouldUpdateSignals(state.lastUpdate)) {
        const signals = await generateSignals()
        if (signals) {
          dispatch({ type: 'UPDATE_SIGNALS', payload: signals })
        }
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [state.lastUpdate, walletConnected])

  // Fetch REAL trade status from server ONLY if wallet connected
  useEffect(() => {
    if (!walletConnected) return

    const fetchTradeStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/status`)
        const data = await response.json()
        if (data.success && data.trades && data.trades.length > 0) {
          const latestTrade = data.trades[0]
          dispatch({
            type: 'EXECUTE_TRADE',
            payload: {
              trade: {
                decision: latestTrade.action || 'BUY',
                conviction: 75,
                result: latestTrade.pnl > 0 ? 'WIN' : 'LOSS',
                profit: latestTrade.pnl || 0,
                txHash: latestTrade.txHash || '0x...',
                executedAt: latestTrade.timestamp || Date.now(),
                pnl: latestTrade.pnl || 0
              }
            }
          })
        }
      } catch (error) {
        console.error('Failed to fetch trade status:', error)
      }
    }

    const interval = setInterval(fetchTradeStatus, 5000)
    return () => clearInterval(interval)
  }, [walletConnected])

  const value = { state, dispatch, walletConnected }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}
