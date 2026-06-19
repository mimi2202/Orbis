// src/services/tradingBot.js
import dotenv from 'dotenv'
import { executeRealTrade, getAccountBalance, getPrice } from './realtimeTrader.js'
import { riskManager } from './riskManager.js'

dotenv.config()

console.log('🤖 Syntra Trading Bot Started')
console.log('⚠️  Risk Limits:', {
  maxTrade: process.env.MAX_TRADE_AMOUNT,
  maxDailyLoss: process.env.MAX_DAILY_LOSS
})

async function runBot() {
  while (true) {
    try {
      // Get current state
      const balance = await getAccountBalance()
      const price = await getPrice()
      
      console.log(`📊 BTC: $${price} | Balance: $${balance.usdt}`)
      
      // Check risk limits
      const metrics = riskManager.getMetrics()
      if (metrics.dailyLoss >= riskManager.maxDailyLoss) {
        console.log('🛑 Daily loss limit reached. Stopping.')
        break
      }
      
      // Check if we should trade
      // This would integrate with your AI decision
      
      await new Promise(resolve => setTimeout(resolve, 5000))
    } catch (error) {
      console.error('Bot error:', error)
      await new Promise(resolve => setTimeout(resolve, 10000))
    }
  }
}

runBot()
