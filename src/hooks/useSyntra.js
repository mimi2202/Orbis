import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../context/AppContext'

export function useSyntra() {
  const { state, dispatch } = useApp()
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize the system
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Get agent by type
  const getAgent = useCallback((type) => {
    return state.agents.find(a => a.type === type)
  }, [state.agents])

  // Get all signals
  const getSignals = useCallback(() => {
    return state.agents.reduce((acc, agent) => {
      if (agent.signal) {
        acc[agent.type] = agent.signal
      }
      return acc
    }, {})
  }, [state.agents])

  // Get marketplace status
  const getMarketplace = useCallback(() => {
    return state.marketplace
  }, [state.marketplace])

  // Get trade history
  const getTrades = useCallback(() => {
    return state.trades
  }, [state.trades])

  // Get current trade
  const getCurrentTrade = useCallback(() => {
    return state.currentTrade
  }, [state.currentTrade])

  // Get reputation scores
  const getReputation = useCallback(() => {
    return state.agents.map(agent => ({
      type: agent.type,
      name: agent.name,
      trust: agent.trust,
      accuracy: agent.accuracy,
      icon: agent.icon
    }))
  }, [state.agents])

  // Calculate win rate
  const getWinRate = useCallback(() => {
    if (state.trades.length === 0) return 0
    const wins = state.trades.filter(t => t.result === 'WIN').length
    return (wins / state.trades.length) * 100
  }, [state.trades])

  // Calculate total P&L
  const getTotalPnL = useCallback(() => {
    return state.trades.reduce((acc, t) => acc + (t.profit || 0), 0)
  }, [state.trades])

  // Get system status
  const getStatus = useCallback(() => {
    const hasSignals = state.agents.some(a => a.signal !== null)
    const hasTrades = state.trades.length > 0
    const allPurchased = state.marketplace.every(m => m.purchased)
    
    return {
      hasSignals,
      hasTrades,
      allPurchased,
      activeAgents: state.agents.filter(a => a.signal !== null).length,
      totalAgents: state.agents.length,
      lastUpdate: state.lastUpdate,
      lastExecution: state.lastExecution,
      isLive: hasSignals && hasTrades
    }
  }, [state])

  return {
    state,
    dispatch,
    getAgent,
    getSignals,
    getMarketplace,
    getTrades,
    getCurrentTrade,
    getReputation,
    getWinRate,
    getTotalPnL,
    getStatus,
    isInitialized
  }
}
