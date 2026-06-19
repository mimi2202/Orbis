// src/utils/agents.js
import { getRealMarketData } from '../services/marketData'

let lastSignals = null

export async function generateSignals() {
  try {
    const marketData = await getRealMarketData()
    
    if (!marketData || !marketData.btc || !marketData.btc.price) {
      console.log('⚠️ No market data, using cached')
      return lastSignals || generateFallbackSignals()
    }
    
    const btcChange = marketData.btc.change24h || 0
    const ethChange = marketData.eth.change24h || 0
    const solChange = marketData.sol.change24h || 0
    
    const signals = {
      whale: {
        direction: btcChange > 0.5 ? 'bullish' : btcChange < -0.5 ? 'bearish' : 'neutral',
        confidence: Math.min(0.92, Math.abs(btcChange) / 8 + 0.4),
        price: marketData.btc.price,
        change24h: btcChange,
        timestamp: Date.now(),
        source: 'CMC Real Data'
      },
      narrative: {
        direction: solChange > 1 ? 'bullish' : solChange < -1 ? 'bearish' : 'neutral',
        momentum: Math.min(0.95, Math.abs(solChange) / 12 + 0.3),
        confidence: Math.min(0.92, Math.abs(solChange) / 10 + 0.4),
        price: marketData.sol.price,
        change24h: solChange,
        timestamp: Date.now(),
        source: 'CMC Real Data'
      },
      derivatives: {
        direction: ethChange > 0.5 ? 'bullish' : ethChange < -0.5 ? 'bearish' : 'neutral',
        squeezeRisk: Math.max(0.1, Math.min(0.9, 0.5 + (ethChange / 20))),
        imbalance: Math.max(-0.8, Math.min(0.8, ethChange / 15)),
        confidence: Math.min(0.92, Math.abs(ethChange) / 10 + 0.4),
        price: marketData.eth.price,
        change24h: ethChange,
        timestamp: Date.now(),
        source: 'CMC Real Data'
      }
    }
    
    lastSignals = signals
    return signals
    
  } catch (error) {
    console.error('Error generating signals:', error)
    return lastSignals || generateFallbackSignals()
  }
}

function generateFallbackSignals() {
  return {
    whale: {
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      confidence: 0.5 + Math.random() * 0.4,
      price: 65000 + (Math.random() - 0.5) * 1000,
      change24h: (Math.random() - 0.5) * 4,
      timestamp: Date.now(),
      source: 'Fallback'
    },
    narrative: {
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      momentum: 0.3 + Math.random() * 0.7,
      confidence: 0.5 + Math.random() * 0.4,
      price: 180 + (Math.random() - 0.5) * 15,
      change24h: (Math.random() - 0.5) * 4,
      timestamp: Date.now(),
      source: 'Fallback'
    },
    derivatives: {
      direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
      squeezeRisk: Math.random(),
      imbalance: (Math.random() - 0.5) * 1.5,
      confidence: 0.5 + Math.random() * 0.4,
      price: 3500 + (Math.random() - 0.5) * 150,
      change24h: (Math.random() - 0.5) * 4,
      timestamp: Date.now(),
      source: 'Fallback'
    }
  }
}

export function shouldUpdateSignals(lastUpdate) {
  if (!lastUpdate) return true
  return Date.now() - lastUpdate > 3000
}
