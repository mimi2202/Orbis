const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')
const WebSocket = require('ws')
const { spawn } = require('child_process')
dotenv.config()
const app = express()
app.use(cors({ origin: '*' }))
app.use(bodyParser.json())
const server = require('http').createServer(app)
const wss = new WebSocket.Server({ server })
let clients = []
wss.on('connection', (ws) => {
  clients.push(ws)
  ws.on('close', () => { clients = clients.filter(c => c !== ws) })
})
function broadcast(data) {
  const msg = JSON.stringify(data)
  clients.forEach(ws => { if (ws.readyState === 1) ws.send(msg) })
}
const PORT = process.env.PORT || 5000
const AGENT_ADDRESS = process.env.AGENT_ADDRESS || null
const STATE_FILE = path.join(__dirname, 'agent-state.json')
const CONTROL_FILE = path.join(__dirname, 'agent-control.json')
const SETTINGS_FILE = path.join(__dirname, 'agent-settings.json')
const AGENT_SCRIPT = path.join(__dirname, 'src', 'agent', 'momentumAgent.cjs')
// ============================================
// AGENT PROCESS MANAGEMENT
// ============================================
let agentProcess = null
let agentRunning = false
function startAgent() {
  if (agentProcess) return
  fs.writeFileSync(CONTROL_FILE, JSON.stringify({ action: 'start', timestamp: Date.now() }))
  agentProcess = spawn('node', [AGENT_SCRIPT], {
    cwd: __dirname,
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe']
  })
  agentProcess.stdout.on('data', (data) => {
    console.log('[AGENT] ' + data.toString().trim())
  })
  agentProcess.stderr.on('data', (data) => {
    console.log('[AGENT ERR] ' + data.toString().trim())
  })
  agentProcess.on('close', (code) => {
    console.log('Agent exited with code ' + code)
    agentProcess = null
    agentRunning = false
  })
  agentRunning = true
  broadcast({ id: Date.now(), type: 'system', message: 'Agent started', timestamp: Date.now() })
}
function stopAgent() {
  if (!agentProcess) return
  fs.writeFileSync(CONTROL_FILE, JSON.stringify({ action: 'stop', timestamp: Date.now() }))
  setTimeout(() => {
    if (agentProcess) {
      agentProcess.kill('SIGTERM')
      agentProcess = null
      agentRunning = false
    }
  }, 3000)
}
// ============================================
// STATE
// ============================================
function readAgentState() {
  try { if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) }
  catch (e) {}
  return null
}
// ============================================
// HEALTH CHECK (keeps Render alive)
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})
// ============================================
// API: STATUS
// ============================================
app.get('/api/status', (req, res) => {
  const state = readAgentState()
  res.json({
    success: true,
    running: agentRunning,
    isAutoTrading: agentRunning,
    market: state?.market || { btc: 0 },
    trades: state?.trades || [],
    openPosition: state?.openPosition || null,
    currentDecision: state?.currentDecision || null,
    stats: state?.stats || { totalTrades: 0, wins: 0, losses: 0, pnl: 0, winRate: 0 },
    agent: state?.agent || { address: AGENT_ADDRESS, configured: !!AGENT_ADDRESS },
    totalTrades: state?.stats?.totalTrades || 0,
    wins: state?.stats?.wins || 0,
    winRate: state?.stats?.winRate || 0,
    totalPnL: state?.stats?.pnl || 0,
    bnbBalance: state?.bnbBalance || 0,
    usdValue: state?.usdValue || 0,
    totalUsd: state?.totalUsd || 0,
    drawdown: state?.drawdown || 0,
    _logs: state?._logs || [],
    lastUpdate: state?.lastUpdate || null
  })
})
// ============================================
// API: AGENT WALLET
// ============================================
app.get('/api/agent-wallet', (req, res) => {
  const state = readAgentState()
  res.json({
    success: true,
    address: AGENT_ADDRESS,
    bnbBalance: state?.bnbBalance || 0,
    usdtBalance: state?.usdtBalance || 0,
    usdValue: state?.totalUsd || 0,
    canAutoTrade: !!AGENT_ADDRESS
  })
})
// ============================================
// API: AGENT SIGNALS
// ============================================
app.get('/api/agent-signals', (req, res) => {
  const state = readAgentState()
  const top = state?.topMomentum || []
  const signals = {}
  if (top.length > 0) signals.whale = { direction: 'bullish', confidence: top[0].score || 75, price: top[0].price || 0, change24h: 1.5, description: top[0].symbol }
  if (top.length > 1) signals.narrative = { direction: 'bullish', confidence: top[1].score || 65, price: top[1].price || 0, change24h: 2.1, description: top[1].symbol }
  if (top.length > 2) signals.derivatives = { direction: 'bullish', confidence: top[2].score || 55, price: top[2].price || 0, change24h: -0.5, description: top[2].symbol }
  if (!signals.whale) signals.whale = { direction: 'bullish', confidence: 70, price: 85000, change24h: 1.2 }
  if (!signals.narrative) signals.narrative = { direction: 'bullish', confidence: 60, price: 180, change24h: 2.1 }
  if (!signals.derivatives) signals.derivatives = { direction: 'bearish', confidence: 55, price: 3200, change24h: -0.8 }
  res.json({ success: true, signals })
})
// ============================================
// API: SETTINGS
// ============================================
app.get('/api/settings', (req, res) => {
  let settings = { maxTradeAmount: 0.5, stopLossPercent: 3, takeProfitPercent: 5, maxDailyLoss: 20, maxDailyTrades: 20, drawdownCap: 30, tokenAllowlist: ['USDT', 'USDC', 'ETH'] }
  try { if (fs.existsSync(SETTINGS_FILE)) settings = { ...settings, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) } } catch (e) {}
  res.json({ success: true, settings })
})
app.post('/api/settings', (req, res) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2))
  res.json({ success: true, message: 'Settings saved' })
})
// ============================================
// API: START (spawns agent on demand)
// ============================================
app.post('/api/start-auto-trade', (req, res) => {
  startAgent()
  res.json({ success: true, message: 'Agent starting', running: true })
})
// ============================================
// API: STOP (kills agent)
// ============================================
app.post('/api/stop-auto-trade', (req, res) => {
  stopAgent()
  res.json({ success: true, message: 'Agent stopped', running: false })
})
// ============================================
// API: TWAK SIGN
// ============================================
app.post('/api/twak/sign', (req, res) => {
  broadcast({ id: Date.now(), type: 'twak_sign', message: 'Intent signed', data: req.body, timestamp: Date.now() })
  res.json({ success: true })
})
// ============================================
// START SERVER (NO AUTO-START AGENT)
// ============================================
server.listen(PORT, () => {
  console.log('========================================')
  console.log('  SYNTA SERVER v3')
  console.log('  Port: ' + PORT)
  console.log('  Agent: ' + (AGENT_ADDRESS || 'NOT SET'))
  console.log('  Agent starts MANUALLY via dashboard')
  console.log('========================================')
})
process.on('SIGINT', () => { stopAgent(); process.exit(0) })
process.on('SIGTERM', () => { stopAgent(); process.exit(0) })
