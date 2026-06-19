import { API_URL } from '../utils/api'

let cachedData = null
let lastFetch = 0
const CACHE_DURATION = 10000 // 10 seconds

export async function getRealMarketData() {
  const now = Date.now()
  
  // Return cached data if fresh
  if (cachedData && (now - lastFetch) < CACHE_DURATION) {
    return cachedData
  }

  try {
    // Call the backend API instead of CMC directly
    const response = await fetch(`${API_URL}/api/market-data`)
    const data = await response.json()
    
    if (data.success && data.marketData) {
      cachedData = data.marketData
      lastFetch = now
      return data.marketData
    }
    
    console.log('⚠️ No market data from backend, using fallback')
    return generateFallbackData()
    
  } catch (error) {
    console.error('Market data fetch error:', error.message)
    return cachedData || generateFallbackData()
  }
}

function generateFallbackData() {
  return {
    btc: { 
      price: 65000 + (Math.random() - 0.5) * 1000, 
      change24h: (Math.random() - 0.5) * 4 
    },
    eth: { 
      price: 3500 + (Math.random() - 0.5) * 100, 
      change24h: (Math.random() - 0.5) * 4 
    },
    sol: { 
      price: 180 + (Math.random() - 0.5) * 10, 
      change24h: (Math.random() - 0.5) * 6 
    },
    timestamp: Date.now(),
    source: 'Fallback'
  }
}
