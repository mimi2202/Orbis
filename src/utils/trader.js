// src/utils/trader.js

let tradeHistory = []
let currentPosition = null

export function traderDecision(signals) {
  // Calculate conviction based on signal quality
  let conviction = 0
  let buySignals = 0
  let totalSignals = 0
  let confidenceSum = 0

  Object.values(signals).forEach(signal => {
    totalSignals++
    confidenceSum += signal.confidence
    
    if (signal.direction === 'bullish') {
      buySignals++
      conviction += signal.confidence * 100
    } else {
      conviction -= signal.confidence * 50
    }
  })

  // Weighted conviction
  const avgConfidence = confidenceSum / totalSignals
  conviction = (conviction / totalSignals) * avgConfidence
  
  // Add momentum factor if available
  if (signals.narrative?.momentum) {
    conviction += signals.narrative.momentum * 10
  }
  
  // Normalize
  conviction = Math.max(0, Math.min(100, conviction + 20))

  // Decision with dynamic threshold
  const threshold = 55 + (1 - avgConfidence) * 20
  const decision = conviction > threshold ? 'BUY' : 'NO BUY'

  return {
    conviction: Math.round(conviction * 10) / 10,
    decision,
    signals,
    confidence: avgConfidence,
    timestamp: Date.now()
  }
}

export function executeTrade(decision) {
  // More realistic trade execution
  const winProbability = Math.min(0.95, decision.conviction / 100)
  const result = Math.random() < winProbability ? 'WIN' : 'LOSS'
  
  // P&L with volatility
  const volatility = 0.05 + (1 - decision.confidence) * 0.1
  const profit = result === 'WIN' 
    ? (1 + Math.random() * 3) * (decision.conviction / 100)
    : -(1 + Math.random() * 2) * (1 - decision.conviction / 100)
  
  const trade = {
    ...decision,
    result,
    profit: parseFloat(profit.toFixed(2)),
    executedAt: Date.now(),
    txHash: `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    price: 100 + (Math.random() - 0.5) * 20
  }
  
  tradeHistory.push(trade)
  currentPosition = trade
  
  return trade
}

export function getTradeHistory() {
  return tradeHistory
}

export function getCurrentPosition() {
  return currentPosition
}

export function resetTrader() {
  tradeHistory = []
  currentPosition = null
}
