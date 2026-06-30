// server.cjs - SPOT / Orbis Bitget AI Trading Agent (in-process, memory-friendly)
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

dotenv.config();

const app = express();

// NOTE: origins must NOT have a trailing slash or path - just scheme://host.
app.use(cors({
  origin: [
    'https://orbis-blue.vercel.app',
    'https://orbis-467q.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];
wss.on('connection', (ws) => {
  clients.push(ws);
  ws.on('close', () => { clients = clients.filter(c => c !== ws); });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  clients.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}

const PORT = process.env.PORT || 5000;
const STATE_FILE = path.join(__dirname, 'agent-state.json');
const SETTINGS_FILE = path.join(__dirname, 'agent-settings.json');

// Shared Bitget client for read-only dashboard calls (real balance).
const BitgetApi = require('./src/services/bitgetApi.cjs');
const bitget = new BitgetApi(
  process.env.BITGET_API_KEY,
  process.env.BITGET_SECRET_KEY,
  process.env.BITGET_PASSPHRASE
);

// ============================================
// IN-PROCESS AGENT (no spawned child = less memory, live state)
// ============================================
const TradingAgent = require('./src/agent/tradingAgent.cjs');

let agent = null;
let agentRunning = false;

function startAgent() {
  if (agent && agentRunning) {
    console.log('[SERVER] Agent already running');
    return;
  }
  console.log('[SERVER] Starting Orbis Trading Agent (in-process)...');
  if (!agent) agent = new TradingAgent();
  agent.start(); // runs the trading loop in THIS process
  agentRunning = true;
  broadcast({ id: Date.now(), type: 'system', message: 'Orbis Agent started', timestamp: Date.now() });
}

function stopAgent() {
  if (!agent) return;
  console.log('[SERVER] Stopping agent...');
  try { agent.stop(); } catch (e) { console.error('stop error:', e.message); }
  agentRunning = false;
  broadcast({ id: Date.now(), type: 'system', message: 'Agent stopped', timestamp: Date.now() });
}

// Read live state straight from the in-memory agent (falls back to disk).
function readAgentState() {
  if (agent) {
    try { return agent.getStatus(); } catch (e) {}
  }
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return null;
}

// ============================================
// API ENDPOINTS
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    agent: agentRunning ? 'running' : 'stopped',
    version: 'V2 - Orbis (SPOT, in-process)'
  });
});

app.get('/api/status', (req, res) => {
  const state = readAgentState();
  const defaultStats = { totalTrades: 0, wins: 0, losses: 0, pnl: 0, winRate: 0, balance: 0 };

  res.json({
    success: true,
    running: agentRunning,
    isAutoTrading: agentRunning,
    symbol: state?.symbol || 'BTCUSDT',
    price: state?.price || 0,
    stats: state?.stats || defaultStats,
    trades: state?.trades || [],
    position: state?.position || null,
    logs: state?.logs || state?._logs || [],
    _logs: state?._logs || state?.logs || [],
    lastUpdate: state?.timestamp || state?.lastUpdate || null,
    version: 'V2',
    agent: {
      type: 'Orbis Bitget AI Agent',
      qwenEnabled: !!process.env.BITGET_QWEN_API_KEY,
      mode: 'SPOT'
    }
  });
});

app.get('/api/agent-wallet', async (req, res) => {
  try {
    const balance = await bitget.getBalance('USDT');
    res.json({
      success: true,
      address: 'Bitget API',
      balance: balance.available,
      usdValue: balance.available,
      usdtBalance: balance.available,
      usdtFrozen: balance.frozen,
      totalUsd: balance.total,
      canAutoTrade: true
    });
  } catch (error) {
    console.error('Failed to get wallet balance:', error.message);
    res.json({ success: false, error: error.message, balance: 0, usdValue: 0 });
  }
});

app.get('/api/strategy', (req, res) => {
  try {
    const strategyPath = path.join(__dirname, 'strategies', 'default.strategy.md');
    if (fs.existsSync(strategyPath)) {
      res.json({ success: true, content: fs.readFileSync(strategyPath, 'utf8') });
    } else {
      res.json({ success: false, error: 'Strategy file not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/settings', (req, res) => {
  let settings = {
    maxTradeAmount: 0.001,
    stopLossPercent: 1,
    takeProfitPercent: 2,
    maxDailyLoss: 20,
    maxDailyTrades: 10,
    drawdownCap: 30,
    symbol: 'BTCUSDT'
  };
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      settings = { ...settings, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) };
    }
  } catch (e) {}
  res.json({ success: true, settings });
});

app.post('/api/settings', (req, res) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/agent-signals', (req, res) => {
  const state = readAgentState();
  res.json({
    success: true,
    signals: {
      whale: {
        direction: state?.position ? 'bullish' : 'neutral',
        confidence: 70,
        price: state?.price || 0,
        change24h: 1.5,
        description: 'BTC/USDT'
      },
      narrative: {
        direction: 'neutral',
        confidence: 60,
        price: state?.price || 0,
        change24h: 0.8,
        description: 'Qwen Analysis'
      },
      derivatives: {
        direction: 'neutral',
        confidence: 55,
        price: state?.price || 0,
        change24h: 0.3,
        description: 'Spot Momentum Signal'
      }
    },
    lastUpdate: state?.timestamp || null
  });
});

app.post('/api/start-auto-trade', (req, res) => {
  if (agentRunning) {
    return res.json({ success: false, message: 'Agent already running', running: true });
  }
  startAgent();
  res.json({ success: true, message: 'Orbis AI Agent starting', running: true, version: 'V2' });
});

app.post('/api/stop-auto-trade', (req, res) => {
  if (!agentRunning) {
    return res.json({ success: false, message: 'Agent not running', running: false });
  }
  stopAgent();
  res.json({ success: true, message: 'Agent stopped', running: false });
});

app.post('/api/twak/sign', (req, res) => {
  broadcast({ id: Date.now(), type: 'twak_sign', message: 'Intent signed', data: req.body, timestamp: Date.now() });
  res.json({ success: true, version: 'V2' });
});

// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log('========================================');
  console.log('  ORBIS - Bitget AI Trading Agent (SPOT, in-process)');
  console.log('  Port: ' + PORT);
  console.log('  Qwen: ' + (process.env.BITGET_QWEN_API_KEY ? 'ENABLED' : 'DISABLED'));
  console.log('  Agent auto-start in 5 seconds...');
  console.log('========================================');

  setTimeout(() => {
    console.log('[SERVER] Auto-starting agent...');
    startAgent();
  }, 5000);
});

process.on('SIGINT', () => { console.log('\n[SERVER] Shutting down...'); stopAgent(); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n[SERVER] Shutting down...'); stopAgent(); process.exit(0); });
