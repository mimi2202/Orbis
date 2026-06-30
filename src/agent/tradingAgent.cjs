// src/agent/tradingAgent.cjs - REAL EXECUTION (SPOT)
const BitgetApi = require('../services/bitgetApi.cjs');
const SkillHub = require('../services/skillHub.cjs');
const QwenAnalyst = require('./qwenAnalyst.cjs');
const BitgetExecutor = require('./bitgetExecutor.cjs');
require('dotenv').config();

class TradingAgent {
  constructor() {
    this.api = new BitgetApi(
      process.env.BITGET_API_KEY || 'mock',
      process.env.BITGET_SECRET_KEY || 'mock',
      process.env.BITGET_PASSPHRASE || 'mock'
    );
    this.skillHub = new SkillHub(this.api);
    this.analyst = new QwenAnalyst(
      process.env.BITGET_QWEN_API_KEY || 'mock',
      this.skillHub
    );
    this.executor = new BitgetExecutor(this.api, {
      maxTradeAmount: parseFloat(process.env.MAX_TRADE_AMOUNT || 0.001),
      quoteBuyAmount: parseFloat(process.env.QUOTE_BUY_AMOUNT || 6),
      stopLossPercent: parseFloat(process.env.STOP_LOSS_PERCENT || 1),
      takeProfitPercent: parseFloat(process.env.TAKE_PROFIT_PERCENT || 2),
      maxDailyTrades: parseInt(process.env.MAX_DAILY_TRADES || 10),
      maxDrawdown: parseFloat(process.env.MAX_DRAWDOWN || 30),
      deRiskDrawdown: parseFloat(process.env.DERISK_DRAWDOWN || 22),
      minSecondsBetweenTrades: parseInt(process.env.MIN_SECONDS_BETWEEN_TRADES || 60),
    });

    // Bitget spot minimum is ~1 USDT notional. Anything below this is dust the
    // exchange will reject (error 45110), so we never treat it as a position.
    this.MIN_NOTIONAL_USDT = 1.5;

    this.isRunning = false;
    this.cycleInterval = 15000;
    this.symbol = 'BTCUSDT';
    this.status = {
      state: 'idle',
      lastUpdate: null,
      message: '',
      logs: [],
      stats: {
        balance: 0,
        totalTrades: 0,
        wins: 0,
        pnl: 0,
        winRate: 0,
        drawdown: 0
      }
    };
  }

  addLog(type, message) {
    if (!this.status.logs) this.status.logs = [];
    this.status.logs.push({
      id: Date.now() + Math.random() * 1000,
      type: type,
      message: message,
      timestamp: Date.now()
    });
    if (this.status.logs.length > 100) {
      this.status.logs = this.status.logs.slice(-100);
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('Agent is already running');
      return;
    }
    console.log('Starting Orbis Trading Agent (REAL/SPOT)...');
    console.log('Trading Pair: ' + this.symbol);
    console.log('Cycle Interval: ' + (this.cycleInterval / 1000) + 's');

    this.executor.loadTradeHistory();

    // REAL balance from the account - source of truth, not a hardcoded number.
    const startBal = await this.executor.syncBalance();

    // If the account already holds a MEANINGFUL amount of BTC, reconstruct a
    // position so the agent can sell it. Sub-$1.50 BTC is dust the exchange
    // won't accept a sell for (45110), so we ignore it instead of looping.
    try {
      const btc = await this.api.getBalance('BTC');
      const px = await this.api.getPrice(this.symbol);
      const btcValue = btc.available * px;
      if (btcValue >= this.MIN_NOTIONAL_USDT) {
        this.executor.position = {
          symbol: this.symbol,
          entryPrice: px,
          quantity: btc.available,
          timestamp: new Date().toISOString(),
          orderId: 'preexisting',
          stopLoss: px * (1 - this.executor.config.stopLossPercent / 100),
          takeProfit: px * (1 + this.executor.config.takeProfitPercent / 100),
        };
        console.log('Detected existing BTC position:', btc.available, '(~$' + btcValue.toFixed(2) + ')');
      } else if (btc.available > 0) {
        console.log('Ignoring BTC dust:', btc.available, '(~$' + btcValue.toFixed(2) + ', below $' + this.MIN_NOTIONAL_USDT + ' min)');
      }
    } catch (e) { /* no BTC, fine */ }

    console.log('Real starting USDT balance: $' + (startBal ? startBal.toFixed(2) : '0.00'));
    if (!startBal || startBal <= 0) {
      console.log('WARNING: account USDT balance is 0 - buys will fail until funded.');
      this.addLog('system', 'Account USDT balance is 0 - fund the account before live trades.');
    }

    this.isRunning = true;
    this.status.state = 'running';
    this.status.message = 'Agent started';
    this.addLog('system', 'Agent started (real execution)');

    this.runLoop();
  }

  async stop() {
    console.log('Stopping Orbis Trading Agent...');
    this.isRunning = false;
    this.status.state = 'stopped';
    this.status.message = 'Agent stopped';
    this.addLog('system', 'Agent stopped');

    if (this.executor.position) {
      console.log('Closing open position (real sell)...');
      await this.executor.executeSell(this.symbol, {
        decision: 'SELL',
        reasoning: 'Agent stopped',
        confidence: 100,
      });
    }
  }

  async runLoop() {
    while (this.isRunning) {
      try {
        await this.cycle();
      } catch (error) {
        console.error('Error in trading cycle:', error.message);
        this.status.message = 'Error: ' + error.message;
        this.addLog('error', 'Error: ' + error.message);
      }
      await this.sleep(this.cycleInterval);
    }
  }

  async cycle() {
    console.log('\nTrading Cycle Started');
    console.log('='.repeat(50));
    this.addLog('system', 'Trading cycle started');

    const monitorResult = await this.executor.monitorPosition();
    if (monitorResult) {
      console.log('Position closed by monitoring');
      this.updateStatus('Position closed', monitorResult);
      this.addLog('position_close', 'Position closed by monitoring');
      return;
    }

    console.log('Requesting Qwen analysis...');
    this.addLog('system', 'Requesting Qwen analysis...');

    const decision = await this.analyst.analyze(this.symbol, !!this.executor.position);

    console.log('Qwen Decision: ' + decision.decision + ' (' + decision.confidence + '% confidence)');
    console.log('Reasoning: ' + decision.reasoning);
    this.addLog('agent_log', 'Qwen: ' + decision.decision + ' (' + decision.confidence + '%) - ' + decision.reasoning);

    const result = await this.executor.executeDecision(decision, this.symbol);

    if (result.action === 'BUY') {
      console.log('BUY executed at $' + result.price);
      this.updateStatus('Trade executed: BUY', result);
      this.addLog('signal_buy', 'BUY ' + this.symbol + ' @ $' + result.price);
    } else if (result.action === 'SELL') {
      console.log('SELL executed, PnL: $' + (result.pnl?.toFixed(2) || 'N/A'));
      this.updateStatus('Trade executed: SELL', result);
      this.addLog('position_close', 'SELL ' + this.symbol + ' @ $' + result.exitPrice + ' | PnL: $' + (result.pnl?.toFixed(2) || '0'));
    } else if (result.action === 'HOLD') {
      console.log('HOLD: No action taken');
      this.addLog('signal_hold', 'HOLD - ' + decision.reasoning);
    } else if (result.action === 'BLOCKED') {
      console.log('Trade blocked: ' + result.reason);
      this.addLog('trade_blocked', 'BLOCKED - ' + result.reason);
    }

    const stats = this.executor.getStats();
    this.status.stats = stats;
    this.updateStatus('Cycle complete', { stats });

    console.log('='.repeat(50));
    console.log('Balance: $' + (stats.balance?.toFixed(2) || 'N/A'));
    console.log('Win Rate: ' + (stats.winRate?.toFixed(1) || 0) + '%');
    console.log('Total PnL: $' + (stats.totalPnl?.toFixed(2) || 0));
    console.log('Drawdown: ' + (stats.drawdown?.toFixed(1) || 0) + '%');
    console.log('='.repeat(50));

    this.saveState();
  }

  updateStatus(message, data) {
    this.status.lastUpdate = new Date().toISOString();
    this.status.message = message;
    this.status.data = data;
  }

  getStatus() {
    let tradesArray = [];
    try {
      if (Array.isArray(this.executor.trades)) {
        tradesArray = this.executor.trades.slice(-20);
      } else if (this.executor.trades && typeof this.executor.trades === 'object') {
        tradesArray = Object.values(this.executor.trades).slice(-20);
      }
    } catch (e) {
      tradesArray = [];
    }

    return {
      state: this.isRunning ? 'running' : 'idle',
      ...this.status,
      symbol: this.symbol,
      position: this.executor.position,
      trades: tradesArray,
      stats: this.status.stats || this.executor.getStats(),
      _logs: this.status.logs || []
    };
  }

  saveState() {
    try {
      const fs = require('fs');
      const state = {
        ...this.getStatus(),
        timestamp: new Date().toISOString(),
      };
      fs.writeFileSync('agent-state.json', JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Failed to save state:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }
}

if (require.main === module) {
  const agent = new TradingAgent();

  process.on('SIGINT', async function () {
    console.log('\nReceived SIGINT');
    await agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async function () {
    console.log('\nReceived SIGTERM');
    await agent.stop();
    process.exit(0);
  });

  agent.start();

  setInterval(function () {
    const status = agent.getStatus();
    if (process.send) {
      process.send({ type: 'status', data: status });
    }
  }, 5000);
}

module.exports = TradingAgent;
