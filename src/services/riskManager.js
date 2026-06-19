// src/services/riskManager.js

class RiskManager {
  constructor() {
    this.dailyLoss = 0
    this.dailyTrades = 0
    this.positions = []
    this.maxPositions = 3
    this.maxDailyLoss = parseFloat(process.env.MAX_DAILY_LOSS) || 20
    this.maxDailyTrades = 20
    this.stopLossPercent = parseFloat(process.env.STOP_LOSS_PERCENT) || 5
    this.takeProfitPercent = parseFloat(process.env.TAKE_PROFIT_PERCENT) || 10
  }

  // Check if trade is allowed
  canTrade(decision, balance) {
    // Check daily limits
    if (this.dailyLoss >= this.maxDailyLoss) {
      return { allowed: false, reason: 'Daily loss limit reached' }
    }

    if (this.dailyTrades >= this.maxDailyTrades) {
      return { allowed: false, reason: 'Daily trade limit reached' }
    }

    // Check position limit
    if (this.positions.length >= this.maxPositions) {
      return { allowed: false, reason: 'Max positions reached' }
    }

    // Check balance
    const tradeAmount = this.calculateTradeAmount(decision.conviction, balance)
    if (tradeAmount > balance.usdt) {
      return { allowed: false, reason: 'Insufficient balance' }
    }

    return { allowed: true, tradeAmount }
  }

  // Calculate trade amount with risk management
  calculateTradeAmount(conviction, balance) {
    // Base amount: 1-2% of balance
    const basePercent = 0.01 + (conviction / 100) * 0.01
    let amount = balance.usdt * basePercent
    
    // Cap at max trade amount
    const maxAmount = parseFloat(process.env.MAX_TRADE_AMOUNT) || 10
    amount = Math.min(amount, maxAmount)
    
    // Min trade amount
    const minAmount = parseFloat(process.env.MIN_TRADE_AMOUNT) || 1
    amount = Math.max(amount, minAmount)
    
    return amount
  }

  // Update risk metrics after trade
  updateAfterTrade(trade) {
    this.dailyTrades++
    if (trade.profit < 0) {
      this.dailyLoss += Math.abs(trade.profit)
    }
  }

  // Reset daily counters
  reset() {
    this.dailyLoss = 0
    this.dailyTrades = 0
  }

  // Get risk metrics
  getMetrics() {
    return {
      dailyLoss: this.dailyLoss,
      dailyTrades: this.dailyTrades,
      maxDailyLoss: this.maxDailyLoss,
      maxDailyTrades: this.maxDailyTrades,
      openPositions: this.positions.length
    }
  }
}

export const riskManager = new RiskManager()
