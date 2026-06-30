// server.cjs - SPOT / Bitget AI Trading Agent
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const { spawn } = require('child_process');

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'https://orbis-blue.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
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
const AGENT_SCRIPT = path.join(__dirname, 'src', 'agent', 'tradingAgent.cjs');

// Single shared Bitget client for read-only dashboard calls (real balance).
const BitgetApi = require('./src/services/bitgetApi.cjs');
const bitget = new BitgetApi(
  process.env.BITGET_API_KEY,
  process.env.BITGET_SECRET_KEY,
  process.env.BITGET_PASSPHRASE
);

// Agent Process Management
let agentProcess = null;
let agentRunning = false;

function startAgent() {
  if (agentProcess) {
    console.log('[SERVER] Agent already running');
    return;
  }

  console.log('[SERVER] Starting Bitget Trading Agent...');

  agentProcess = spawn('node', [AGENT_SCRIPT], {
    cwd: __dirname,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  agentProcess.stdout.on('data', (data) => {
    const msg = data.toString().trim();
    console.log('[AGENT] ' + msg);
    broadcast({ id: Date.now(), type: 'agent_log', message: msg, timestamp: Date.now() });
  });

  agentProcess.stderr.on('data', (data) => {
    const msg = data.toString().trim();
    console.log('[AGENT ERR] ' + msg);
    broadcast({ id: Date.now(), type: 'agent_error', message: msg, timestamp: Date.now() });
  });

  agentProcess.on('close', (code) => {
    console.log('[SERVER] Agent exited with code ' + code);
    agentProcess = null;
    agentRunning = false;
    broadcast({ id: Date.now(), type: 'system', message: 'Agent stopped', timestamp: Date.now() });
  });

  agentRunning = true;
  broadcast({ id: Date.now(), type: 'system', message: 'Bitget Agent started', timestamp: Date.now() });
}

function stopAgent() {
  if (!agentProcess) return;
  console.log('[SERVER] Stopping Bitget Trading Agent...');
  agentProcess.kill('SIGTERM');
  setTimeout(() => {
    if (agentProcess) {
      agentProcess.kill('SIGKILL');
      agentProcess = null;
      agentRunning = false;
    }
  }, 2000);
}

function readAgentState() {
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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    agent: agentRunning ? 'running' : 'stopped',
    version: 'V2 - Bitget AI (SPOT)'
  });
});

// Status
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
    logs: state?.logs || [],
    _logs: state?.logs || [],
    lastUpdate: state?.timestamp || state?.lastUpdate || null,
    version: 'V2',
    agent: {
      type: 'Bitget AI Agent',
      qwenEnabled: !!process.env.BITGET_QWEN_API_KEY,
      mode: 'SPOT'
    }
  });
});

// Agent Wallet — REAL balance from Bitget (v3 unified account).
// (The old hardcoded $10,000 mock handler has been removed so this one wins.)
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
    res.json({
      success: false,
      error: error.message,
      balance: 0,
      usdValue: 0
    });
  }
});

// Strategy
app.get('/api/strategy', (req, res) => {
  try {
    const strategyPath = path.join(__dirname, 'strategies', 'default.strategy.md');
    if (fs.existsSync(strategyPath)) {
      const content = fs.readFileSync(strategyPath, 'utf8');
      res.json({ success: true, content });
    } else {
      res.json({ success: false, error: 'Strategy file not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Settings
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

// Agent Signals
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

// Start Auto Trade
app.post('/api/start-auto-trade', (req, res) => {
  if (agentRunning) {
    return res.json({ success: false, message: 'Agent already running', running: true });
  }
  startAgent();
  res.json({ success: true, message: 'Bitget AI Agent starting', running: true, version: 'V2' });
});

// Stop Auto Trade
app.post('/api/stop-auto-trade', (req, res) => {
  if (!agentRunning) {
    return res.json({ success: false, message: 'Agent not running', running: false });
  }
  stopAgent();
  res.json({ success: true, message: 'Agent stopped', running: false });
});

// TWAK Sign (compatibility)
app.post('/api/twak/sign', (req, res) => {
  broadcast({ id: Date.now(), type: 'twak_sign', message: 'Intent signed', data: req.body, timestamp: Date.now() });
  res.json({ success: true, version: 'V2' });
});

// ============================================
// START SERVER
// ============================================
server.listen(PORT, () => {
  console.log('========================================');
  console.log('  ORBIS - Bitget AI Trading Agent (SPOT)');
  console.log('  Port: ' + PORT);
  console.log('  Qwen: ' + (process.env.BITGET_QWEN_API_KEY ? 'ENABLED' : 'DISABLED'));
  console.log('  Agent auto-start in 5 seconds...');
  console.log('========================================');

  setTimeout(() => {
    console.log('[SERVER] Auto-starting agent...');
    startAgent();
  }, 5000);
});

// Graceful Shutdown
process.on('SIGINT', () => { console.log('\n[SERVER] Shutting down...'); stopAgent(); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n[SERVER] Shutting down...'); stopAgent(); process.exit(0); });
