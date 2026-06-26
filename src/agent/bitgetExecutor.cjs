// src/agent/bitgetExecutor.cjs - REAL EXECUTION (SPOT), no paper balance
const fs = require('fs');

class BitgetExecutor {
  constructor(bitgetApi, config = {}) {
    this.api = bitgetApi;
    this.config = {
      maxTradeAmount: config.maxTradeAmount || 0.001,      // base qty (BTC) for SELL
      quoteBuyAmount: config.quoteBuyAmount || 6,          // USDT to spend per BUY (spot market-buy sizes by quote)
      stopLossPercent: config.stopLossPercent || 1,
      takeProfitPercent: config.takeProfitPercent || 2,
      maxDailyTrades: config.maxDailyTrades || 10,
      maxDrawdown: config.maxDrawdown || 30,               // hard DQ line
      deRiskDrawdown: config.deRiskDrawdown || 22,         // act BEFORE the line
      minSecondsBetweenTrades: config.minSecondsBetweenTrades || 60,
    };
    this.position = null;
    this.trades = [];
    this.dailyTrades = 0;
    this.totalPnl = 0;

    // Real balances — seeded from the account in syncBalance(), never hardcoded.
    this.peakBalance = 0;
    this.currentBalance = 0;
    this.balanceReady = false;

    this.lastTradeTs = 0;
    this.isRunning = false;
    this.tradeHistoryPath = 'trade-history.json';
  }

  // Pull the real USDT balance from Bitget. Source of truth for equity/drawdown.
  async syncBalance() {
    try {
      const usdt = await this.api.getBalance('USDT');
      const btc = await this.api.getBalance('BTC');
      const price = await this.api.getPrice('BTCUSDT');
      // Total equity = USDT + value of BTC held. Counting only USDT made a buy
      // look like a 90%+ drawdown. This values the whole portfolio.
      const usdtTotal = usdt.available + usdt.frozen;
      const btcTotal = (btc.available + btc.frozen) * price;
      this.currentBalance = usdtTotal + btcTotal;
      this.btcHeld = btc.available; // live BTC available to sell
      if (this.peakBalance === 0) this.peakBalance = this.currentBalance;
      if (this.currentBalance > this.peakBalance) this.peakBalance = this.currentBalance;
      this.balanceReady = true;
      return this.currentBalance;
    } catch (e) {
      console.error('syncBalance failed:', e.message);
      return this.currentBalance;
    }
  }

  cooldownRemaining() {
    const elapsed = (Date.now() - this.lastTradeTs) / 1000;
    return Math.max(0, this.config.minSecondsBetweenTrades - elapsed);
  }

  async executeDecision(decision, symbol = 'BTCUSDT') {
    if (decision.decision === 'HOLD') {
      console.log('HOLD: No trade executed');
      return { action: 'HOLD', reason: decision.reasoning };
    }
    if (this.dailyTrades >= this.config.maxDailyTrades) {
      return { action: 'BLOCKED', reason: 'Daily trade limit reached' };
    }
    // Cooldown — stops the 15s loop from over-firing on a bad signal.
    const cd = this.cooldownRemaining();
    if (cd > 0) {
      return { action: 'BLOCKED', reason: 'Cooldown ' + Math.ceil(cd) + 's' };
    }
    if (decision.confidence < 60) {
      return { action: 'BLOCKED', reason: 'Confidence ' + decision.confidence + '%' };
    }

    // Drawdown guard on REAL equity. De-risk early so we never touch the DQ line.
    await this.syncBalance();
    const dd = this.calculateDrawdown();
    if (dd >= this.config.deRiskDrawdown) {
      // Too close to the limit: only allow de-risking (sell to stables), never add risk.
      if (decision.decision === 'BUY') {
        return { action: 'BLOCKED', reason: 'Risk gate: drawdown ' + dd.toFixed(1) + '% >= ' + this.config.deRiskDrawdown + '% (de-risk only)' };
      }
      // a SELL is allowed (it reduces exposure)
    }

    if (decision.decision === 'BUY') return this.executeBuy(symbol, decision);
    if (decision.decision === 'SELL') return this.executeSell(symbol, decision);
    return { action: 'HOLD', reason: 'No valid decision' };
  }

  async executeBuy(symbol, decision) {
    console.log('BUY: real spot buy on ' + symbol);
    const price = await this.api.getPrice(symbol);

    // SPOT MARKET BUY: Bitget sizes a market buy by QUOTE (USDT) amount.
    // Sending quoteBuyAmount USDT; approximate base qty for our records.
    const order = await this.api.placeOrder(symbol, 'buy', this.config.quoteBuyAmount, 'market');
    const filledQty = parseFloat(order.baseVolume || order.size || (this.config.quoteBuyAmount / price));
    const fillPrice = parseFloat(order.priceAvg || order.fillPrice || price);

    this.position = {
      symbol: symbol,
      entryPrice: fillPrice,
      quantity: filledQty,
      timestamp: new Date().toISOString(),
      orderId: order.orderId,
      stopLoss: fillPrice * (1 - this.config.stopLossPercent / 100),
      takeProfit: fillPrice * (1 + this.config.takeProfitPercent / 100),
    };
    this.dailyTrades++;
    this.lastTradeTs = Date.now();
    this.trades.push({
      type: 'BUY', symbol, price: fillPrice, quantity: filledQty,
      timestamp: new Date().toISOString(), orderId: order.orderId,
    });
    this.saveTradeHistory();
    await this.syncBalance();

    return {
      action: 'BUY', symbol, price: fillPrice, quantity: filledQty,
      stopLoss: this.position.stopLoss, takeProfit: this.position.takeProfit,
      orderId: order.orderId,
    };
  }

  async executeSell(symbol, decision) {
    if (!this.position) {
      console.log('No position to close');
      return { action: 'HOLD', reason: 'No position open' };
    }
    console.log('SELL: real spot sell on ' + symbol);

    const balanceBefore = this.currentBalance;
    const currentPrice = await this.api.getPrice(symbol);

    // Sell the REAL BTC balance we actually hold (after buy fees we hold slightly
    // less than the recorded buy qty - selling the recorded qty caused 25202).
    const btc = await this.api.getBalance('BTC');
    // shave a hair for precision/fee rounding, floor to 6 dp
    const sellable = Math.floor((btc.available * 0.999) * 1e6) / 1e6;
    const quantity = sellable > 0 ? sellable : this.position.quantity;

    // Real spot SELL of the held base asset (closePosition is a no-op on spot).
    const order = await this.api.placeOrder(symbol, 'sell', quantity, 'market');

    await this.syncBalance();
    // Real PnL = actual USDT delta across the round trip.
    const pnl = this.currentBalance - balanceBefore + 0; // delta from this sell
    const pnlPercent = ((currentPrice / this.position.entryPrice) - 1) * 100;
    this.totalPnl = this.totalPnl + pnl;

    this.dailyTrades++;
    this.lastTradeTs = Date.now();
    this.trades.push({
      type: 'SELL', symbol,
      entryPrice: this.position.entryPrice, exitPrice: currentPrice,
      quantity, pnl, pnlPercent,
      timestamp: new Date().toISOString(), orderId: order.orderId,
    });
    this.saveTradeHistory();

    const entryPrice = this.position.entryPrice;
    this.position = null;
    return {
      action: 'SELL', symbol, entryPrice, exitPrice: currentPrice,
      pnl, pnlPercent, orderId: order.orderId,
    };
  }

  async monitorPosition() {
    if (!this.position) return null;
    const currentPrice = await this.api.getPrice(this.position.symbol);
    if (currentPrice <= this.position.stopLoss) {
      console.log('STOP LOSS TRIGGERED');
      return this.executeSell(this.position.symbol, { decision: 'SELL', reasoning: 'Stop loss', confidence: 100 });
    }
    if (currentPrice >= this.position.takeProfit) {
      console.log('TAKE PROFIT TRIGGERED');
      return this.executeSell(this.position.symbol, { decision: 'SELL', reasoning: 'Take profit', confidence: 100 });
    }
    const holdTime = (Date.now() - new Date(this.position.timestamp).getTime()) / 3600000;
    if (holdTime >= 4) {
      console.log('MAX HOLD TIME REACHED');
      return this.executeSell(this.position.symbol, { decision: 'SELL', reasoning: 'Max hold time', confidence: 100 });
    }
    return null;
  }

  calculateDrawdown() {
    if (this.peakBalance <= 0) return 0;
    if (this.currentBalance > this.peakBalance) this.peakBalance = this.currentBalance;
    return ((this.peakBalance - this.currentBalance) / this.peakBalance) * 100;
  }

  getStats() {
    const tradesArray = Array.isArray(this.trades) ? this.trades : [];
    const sellTrades = tradesArray.filter(t => t.type === 'SELL');
    const totalTrades = sellTrades.length;
    const winningTrades = sellTrades.filter(t => t.pnl > 0).length;
    return {
      balance: this.currentBalance,        // REAL USDT equity
      totalTrades,
      wins: winningTrades,
      losses: totalTrades - winningTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      pnl: this.totalPnl,
      totalPnl: this.totalPnl,
      drawdown: this.calculateDrawdown(),
      dailyTrades: this.dailyTrades,
      position: this.position ? {
        symbol: this.position.symbol,
        entryPrice: this.position.entryPrice,
        currentPrice: null, pnl: 0, pnlPercent: 0,
      } : null,
    };
  }

  saveTradeHistory() {
    try {
      const tradesArray = Array.isArray(this.trades) ? this.trades : [];
      fs.writeFileSync(this.tradeHistoryPath, JSON.stringify(tradesArray, null, 2));
    } catch (error) {
      console.error('Failed to save trade history:', error.message);
    }
  }

  loadTradeHistory() {
    try {
      if (fs.existsSync(this.tradeHistoryPath)) {
        const parsed = JSON.parse(fs.readFileSync(this.tradeHistoryPath, 'utf8'));
        this.trades = Array.isArray(parsed) ? parsed : [];
        const sellTrades = this.trades.filter(t => t.type === 'SELL');
        let totalPnl = 0;
        for (let i = 0; i < sellTrades.length; i++) totalPnl += (sellTrades[i].pnl || 0);
        this.totalPnl = totalPnl;
        console.log('Loaded ' + this.trades.length + ' trades from history');
      } else {
        this.trades = [];
        console.log('No trade history found, starting fresh');
      }
    } catch (error) {
      console.error('Failed to load trade history:', error.message);
      this.trades = [];
    }
    // NOTE: balance is NOT derived from history anymore — it comes from the
    // real account via syncBalance(). Call agent-side at startup.
  }

  resetDailyTrades() {
    this.dailyTrades = 0;
  }
}

module.exports = BitgetExecutor;
