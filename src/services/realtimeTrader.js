// src/services/realtimeTrader.js
import Binance from 'binance-api-node'
import dotenv from 'dotenv'

dotenv.config()

// Initialize Binance client
const client = Binance({
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET
})

// Trading state
let position = null
let dailyLoss = 0
let dailyTrades = 0
const MAX_DAILY_TRADES = 20

// Risk Management
const RISK_CONFIG = {
  maxTradeAmount: parseFloat(process.env.MAX_TRADE_AMOUNT) || 10,
  minTradeAmount: parseFloat(process.env.MIN_TRADE_AMOUNT) || 1,
  maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE) || 100,
  stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT) || 5,
  takeProfitPercent: parseFloat(process.env.TAKE_PROFIT_PERCENT) || 10,
  maxDailyLoss: parseFloat(process.env.MAX_DAILY_LOSS) || 20
}

// Get real-time account balance
export async function getAccountBalance() {
  try {
    const accountInfo = await client.accountInfo()
    const balances = accountInfo.balances.filter(b => 
      parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
    )
    
    // Get USDT balance
    const usdtBalance = balances.find(b => b.asset === 'USDT')
    return {
      usdt: parseFloat(usdtBalance?.free || 0),
      total: accountInfo.totalWalletBalance || 0,
      balances: balances
    }
  } catch (error) {
    console.error('Failed to get balance:', error)
    return null
  }
}

// Get real market price
export async function getPrice(symbol = 'BTCUSDT') {
  try {
    const ticker = await client.prices({ symbol })
    return parseFloat(ticker[symbol])
  } catch (error) {
    console.error('Failed to get price:', error)
    return null
  }
}

// Execute real trade
export async function executeRealTrade(decision) {
  try {
    // Check risk limits
    if (dailyLoss >= RISK_CONFIG.maxDailyLoss) {
      console.log('⚠️ Daily loss limit reached. Stopping trading.')
      return { success: false, error: 'Daily loss limit reached' }
    }

    if (dailyTrades >= MAX_DAILY_TRADES) {
      console.log('⚠️ Daily trade limit reached.')
      return { success: false, error: 'Daily trade limit reached' }
    }

    // Get current price
    const currentPrice = await getPrice()
    if (!currentPrice) {
      return { success: false, error: 'Failed to get price' }
    }

    // Calculate trade amount
    const tradeAmount = calculateTradeAmount(decision.conviction)
    
    // Check if enough balance
    const balance = await getAccountBalance()
    if (!balance || balance.usdt < tradeAmount) {
      console.log('⚠️ Insufficient balance')
      return { success: false, error: 'Insufficient balance' }
    }

    // Execute order
    let order
    if (decision.decision === 'BUY') {
      order = await client.order({
        symbol: 'BTCUSDT',
        side: 'BUY',
        quantity: tradeAmount / currentPrice,
        type: 'MARKET'
      })
    } else {
      // If we have a position, sell it
      if (position) {
        order = await client.order({
          symbol: 'BTCUSDT',
          side: 'SELL',
          quantity: position.quantity,
          type: 'MARKET'
        })
        position = null
      } else {
        return { success: false, error: 'No position to sell' }
      }
    }

    // Update trade tracking
    dailyTrades++
    
    // Set stop loss and take profit
    if (decision.decision === 'BUY') {
      position = {
        entryPrice: currentPrice,
        quantity: tradeAmount / currentPrice,
        stopLoss: currentPrice * (1 - RISK_CONFIG.stopLossPercent / 100),
        takeProfit: currentPrice * (1 + RISK_CONFIG.takeProfitPercent / 100)
      }
    }

    return {
      success: true,
      order: order,
      price: currentPrice,
      amount: tradeAmount,
      timestamp: Date.now()
    }

  } catch (error) {
    console.error('Trade execution failed:', error)
    return { success: false, error: error.message }
  }
}

// Calculate trade amount based on conviction
function calculateTradeAmount(conviction) {
  // Scale amount based on conviction score
  const baseAmount = RISK_CONFIG.maxTradeAmount
  const scaledAmount = (conviction / 100) * baseAmount
  
  // Ensure within limits
  return Math.max(
    RISK_CONFIG.minTradeAmount,
    Math.min(RISK_CONFIG.maxTradeAmount, scaledAmount)
  )
}

// Check stop loss / take profit
export async function checkPositions() {
  if (!position) return null

  try {
    const currentPrice = await getPrice()
    if (!currentPrice) return null

    // Check stop loss
    if (currentPrice <= position.stopLoss) {
      console.log('🔴 Stop loss triggered!')
      const order = await client.order({
        symbol: 'BTCUSDT',
        side: 'SELL',
        quantity: position.quantity,
        type: 'MARKET'
      })
      position = null
      return { action: 'STOP_LOSS', order }
    }

    // Check take profit
    if (currentPrice >= position.takeProfit) {
      console.log('🟢 Take profit triggered!')
      const order = await client.order({
        symbol: 'BTCUSDT',
        side: 'SELL',
        quantity: position.quantity,
        type: 'MARKET'
      })
      position = null
      return { action: 'TAKE_PROFIT', order }
    }

    return { action: 'HOLD', price: currentPrice }
  } catch (error) {
    console.error('Failed to check positions:', error)
    return null
  }
}

// Get real-time order book
export async function getOrderBook(symbol = 'BTCUSDT') {
  try {
    const depth = await client.depth({ symbol, limit: 10 })
    return {
      bids: depth.bids.map(b => ({ price: parseFloat(b[0]), quantity: parseFloat(b[1]) })),
      asks: depth.asks.map(a => ({ price: parseFloat(a[0]), quantity: parseFloat(a[1]) }))
    }
  } catch (error) {
    console.error('Failed to get order book:', error)
    return null
  }
}

// Get trade history
export async function getTradeHistory() {
  try {
    const trades = await client.myTrades({ symbol: 'BTCUSDT', limit: 20 })
    return trades.map(t => ({
      price: parseFloat(t.price),
      quantity: parseFloat(t.qty),
      commission: parseFloat(t.commission),
      time: t.time
    }))
  } catch (error) {
    console.error('Failed to get trade history:', error)
    return []
  }
}

// Reset daily counters
export function resetDailyCounters() {
  dailyLoss = 0
  dailyTrades = 0
}
