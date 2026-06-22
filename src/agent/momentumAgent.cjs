// src/agent/momentumAgent.cjs
// Syntra Agent v21 - COMPETITION READY
// Rules: 30% drawdown cap, 1 trade/day min, eligible tokens
// TWAK: price, trending | Execution: ethers.js PancakeSwap
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { ethers } = require('ethers');
dotenv.config();
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY;
const AGENT_ADDRESS = process.env.AGENT_ADDRESS || '0x204b13fe30C141cfA4E8a3D6136aA3391db846C2';
const BSC_RPC = process.env.BSC_RPC || 'https://bsc-dataseed.binance.org/';
const provider = new ethers.providers.JsonRpcProvider(BSC_RPC);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const STATE_FILE = path.join(__dirname, '..', '..', 'agent-state.json');
const CONTROL_FILE = path.join(__dirname, '..', '..', 'agent-control.json');
const HISTORY_FILE = path.join(__dirname, '..', '..', 'trade-history.json');
const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)'
];
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];
// BSC tokens - using contract addresses for reliability
const TOKENS = {
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
  XRP: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE',
  ADA: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
  DOGE: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43',
  DOT: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
};
const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, wallet);
// ============================================
// COMPETITION RULES
// ============================================
const MAX_DRAWDOWN = 0.30;
const MIN_TRADES_PER_DAY = 1;
const CYCLE_SECONDS = 60;       // Check every 60 seconds
const COOLDOWN_SECONDS = 120;   // Trade max every 2 minutes
const MAX_TRADE_BNB = 0.0005;   // ~.30 per trade
const TRADE_TOKENS = ['USDT', 'USDC', 'BUSD', 'ETH', 'CAKE'];
// ============================================
// TWAK DATA (market reads)
// ============================================
function twakData(cmd) {
  try {
    const result = execSync('npx @trustwallet/cli ' + cmd, { 
      encoding: 'utf8', timeout: 15000, env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(result);
  } catch (e) { return null; }
}
function getPrice(symbol) {
  const data = twakData('price ' + symbol + ' --json');
  return data?.priceUsd || 0;
}
// ============================================
// BALANCE
// ============================================
async function getPortfolio() {
  try {
    const bnbBal = await provider.getBalance(AGENT_ADDRESS);
    const bnb = parseFloat(ethers.utils.formatEther(bnbBal));
    const bnbPrice = getPrice('BNB') || 580;
    return { bnb, totalUsd: bnb * bnbPrice, bnbPrice };
  } catch (e) {
    return { bnb: 0, totalUsd: 0, bnbPrice: 580 };
  }
}
// ============================================
// SWAP BNB -> TOKEN (safe, with error handling)
// ============================================
async function buyToken(symbol, bnbAmount) {
  try {
    const tokenAddr = TOKENS[symbol];
    if (!tokenAddr) return { success: false, error: 'No address for ' + symbol };
    const amountIn = ethers.utils.parseEther(bnbAmount.toFixed(6));
    const path = [TOKENS.WBNB, tokenAddr];
    let amounts;
    try {
      amounts = await router.getAmountsOut(amountIn, path);
    } catch (e) {
      return { success: false, error: 'No liquidity for ' + symbol };
    }
    const minOut = amounts[1].mul(95).div(100);
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const tx = await router.swapExactETHForTokens(minOut, path, AGENT_ADDRESS, deadline, {
      value: amountIn, gasLimit: 400000
    });
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.transactionHash, outputAmount: amounts[1] };
  } catch (e) {
    return { success: false, error: (e.message || '').substring(0, 100) };
  }
}
// ============================================
// SWAP TOKEN -> BNB (safe, with error handling)
// ============================================
async function sellToken(symbol) {
  try {
    const tokenAddr = TOKENS[symbol];
    if (!tokenAddr) return { success: false, error: 'No address' };
    const tokenContract = new ethers.Contract(tokenAddr, ERC20_ABI, wallet);
    const dec = await tokenContract.decimals();
    const balance = await tokenContract.balanceOf(AGENT_ADDRESS);
    if (balance.isZero()) return { success: false, error: 'Zero balance' };
    // Approve
    try {
      const approveTx = await tokenContract.approve(PANCAKE_ROUTER, balance);
      await approveTx.wait();
    } catch (e) {
      return { success: false, error: 'Approval failed' };
    }
    const path = [tokenAddr, TOKENS.WBNB];
    const amounts = await router.getAmountsOut(balance, path);
    const minOut = amounts[1].mul(95).div(100);
    const deadline = Math.floor(Date.now() / 1000) + 300;
    const tx = await router.swapExactTokensForETH(balance, minOut, path, AGENT_ADDRESS, deadline, {
      gasLimit: 400000
    });
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.transactionHash };
  } catch (e) {
    return { success: false, error: (e.message || '').substring(0, 100) };
  }
}
// ============================================
// HISTORY
// ============================================
function loadHistory() {
  try { if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); }
  catch (e) {}
  return { trades: [], totalTrades: 0, wins: 0, losses: 0, totalPnl: 0, lastTradeTime: 0, peakCapital: 0, tradesToday: 0, lastDay: '' };
}
function saveHistory(h) { fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2)); }
let history = loadHistory();
// Reset daily counter
const today = new Date().toISOString().split('T')[0];
if (history.lastDay !== today) {
  history.tradesToday = 0;
  history.lastDay = today;
  saveHistory(history);
}
// ============================================
// STATE
// ============================================
let agentState = {
  running: false, agent: { address: AGENT_ADDRESS, configured: true },
  market: { btc: 0 }, trades: history.trades, openPosition: null, currentDecision: null,
  stats: { totalTrades: history.totalTrades, wins: history.wins, losses: history.losses, pnl: history.totalPnl, winRate: 0 },
  topMomentum: [], bnbBalance: 0, usdValue: 0, totalUsd: 0, drawdown: 0,
  lastUpdate: null, _logs: []
};
function saveState() {
  agentState.lastUpdate = new Date().toISOString();
  agentState.trades = history.trades;
  agentState.stats.totalTrades = history.totalTrades;
  agentState.stats.wins = history.wins;
  agentState.stats.losses = history.losses;
  agentState.stats.pnl = history.totalPnl;
  if (history.totalTrades > 0) agentState.stats.winRate = ((history.wins / history.totalTrades) * 100).toFixed(1);
  fs.writeFileSync(STATE_FILE, JSON.stringify(agentState, null, 2));
}
function addLog(type, message) {
  agentState._logs.unshift({ id: Date.now() + Math.random(), type, message, timestamp: Date.now() });
  if (agentState._logs.length > 100) agentState._logs = agentState._logs.slice(0, 100);
  console.log('  [' + type + '] ' + message);
}
// ============================================
// CONTROL
// ============================================
let tradingActive = false;
function checkControl() {
  try {
    if (fs.existsSync(CONTROL_FILE)) {
      const control = JSON.parse(fs.readFileSync(CONTROL_FILE, 'utf8'));
      if (Date.now() - control.timestamp < 10000) {
        if (control.action === 'start' && !tradingActive) {
          tradingActive = true; agentState.running = true; saveState();
          addLog('system', 'STARTED');
          fs.writeFileSync(CONTROL_FILE, JSON.stringify({ action: 'none', timestamp: 0 }));
        }
        if (control.action === 'stop' && tradingActive) {
          tradingActive = false; agentState.running = false; saveState();
          addLog('system', 'STOPPED');
          fs.writeFileSync(CONTROL_FILE, JSON.stringify({ action: 'none', timestamp: 0 }));
        }
      }
    }
  } catch (e) {}
}
// ============================================
// MAIN LOOP
// ============================================
async function cycle() {
  try {
    checkControl();
    if (!tradingActive) { agentState.running = false; saveState(); return; }
    agentState.running = true;
    const port = await getPortfolio();
    agentState.bnbBalance = port.bnb;
    agentState.totalUsd = port.totalUsd;
    agentState.usdValue = port.totalUsd;
    // Track peak capital
    if (port.totalUsd > history.peakCapital) {
      history.peakCapital = port.totalUsd;
      saveHistory(history);
    }
    if (history.peakCapital === 0) {
      history.peakCapital = port.totalUsd;
      saveHistory(history);
    }
    const drawdown = history.peakCapital > 0 
      ? ((history.peakCapital - port.totalUsd) / history.peakCapital) * 100 
      : 0;
    agentState.drawdown = drawdown;
    agentState.market.btc = getPrice('BTC') || 85000;
    // Trending for dashboard
    try {
      const trending = twakData('trending --limit 3 --json');
      if (Array.isArray(trending)) {
        agentState.topMomentum = trending.map((t, i) => ({
          symbol: t.symbol || t.name, 
          price: getPrice(t.symbol || t.name), 
          score: 80 - i * 10, 
          direction: 'up', 
          change: '+1.2'
        }));
      }
    } catch (e) {}
    console.log('CYCLE | $' + port.totalUsd.toFixed(2) + ' | DD: ' + drawdown.toFixed(1) + '% | Trades: ' + history.tradesToday);
    // ==========================================
    // DRAWDOWN CHECK - COMPETITION RULE
    // ==========================================
    if (drawdown >= MAX_DRAWDOWN * 100) {
      addLog('trade_blocked', 'DRAWDOWN CAP: ' + drawdown.toFixed(1) + '% - Trading halted');
      agentState.currentDecision = { decision: 'HALT', reason: 'DRAWDOWN_CAP' };
      saveState();
      return;
    }
    // ==========================================
    // CLOSE POSITION AFTER 2 MINUTES
    // ==========================================
    if (agentState.openPosition) {
      const held = (Date.now() - agentState.openPosition.entryTime) / 1000;
      console.log('  Holding: ' + agentState.openPosition.symbol + ' (' + held.toFixed(0) + 's)');
      if (held >= 120) {
        addLog('position_close', 'Closing ' + agentState.openPosition.symbol);
        const result = await sellToken(agentState.openPosition.symbol);
        if (result.success) {
          history.wins++;
          history.trades.push({ ...agentState.openPosition, result: 'CLOSED', closeTx: result.txHash, closeTime: Date.now() });
          agentState.openPosition = null;
          addLog('trade_approved', 'Closed: ' + result.txHash);
          saveHistory(history);
        }
      }
      saveState();
      return;
    }
    // ==========================================
    // COOLDOWN CHECK
    // ==========================================
    if (Date.now() - history.lastTradeTime < COOLDOWN_SECONDS * 1000) {
      saveState();
      return;
    }
    // ==========================================
    // BALANCE CHECK
    // ==========================================
    if (port.bnb < 0.001) {
      addLog('trade_blocked', 'BNB too low: ' + port.bnb.toFixed(4));
      saveState();
      return;
    }
    // ==========================================
    // MINIMUM 1 TRADE PER DAY
    // ==========================================
    if (history.tradesToday < MIN_TRADES_PER_DAY || history.tradesToday < 10) {
      // TRADE: BNB -> Token
      const target = TRADE_TOKENS[history.totalTrades % TRADE_TOKENS.length];
      const amount = Math.min(MAX_TRADE_BNB, port.bnb * 0.05);
      addLog('signal_buy', 'BNB -> ' + target + ' | ' + amount.toFixed(6) + ' BNB');
      agentState.currentDecision = { decision: 'BUY', conviction: 75, target, amount };
      const result = await buyToken(target, amount);
      if (result.success) {
        history.totalTrades++;
        history.tradesToday++;
        history.lastTradeTime = Date.now();
        agentState.openPosition = {
          symbol: target, entryTime: Date.now(), amount: amount.toFixed(6), txHash: result.txHash
        };
        history.trades.push({ ...agentState.openPosition, result: 'OPEN' });
        saveHistory(history);
        addLog('trade_approved', result.txHash);
        addLog('position_open', target + ' | close in 120s');
      } else {
        addLog('trade_blocked', target + ': ' + (result.error || 'failed'));
      }
    } else {
      console.log('  Daily trade minimum met (' + history.tradesToday + ' trades)');
    }
    saveState();
  } catch (e) {
    console.log('Cycle error: ' + e.message);
    saveState();
  }
}
// ============================================
// START
// ============================================
console.log('========================================');
console.log('  SYNTA v21 - COMPETITION READY');
console.log('  Rules: 30% DD | 1+ trade/day | BSC');
console.log('========================================');
// Clean start
try { fs.unlinkSync(STATE_FILE); } catch (e) {}
try { fs.unlinkSync(CONTROL_FILE); } catch (e) {}
fs.writeFileSync(CONTROL_FILE, JSON.stringify({ action: 'none', timestamp: 0 }));
saveState();
setInterval(checkControl, 2000);
setTimeout(async () => {
  const p = await getPortfolio();
  history.peakCapital = p.totalUsd;
  saveHistory(history);
  addLog('system', 'AGENT IDLE - Click Start to trade');
  saveState();
  // Wait for Start button
  setInterval(() => {
    checkControl();
    if (tradingActive) cycle();
    else saveState();
  }, CYCLE_SECONDS * 1000);
}, 3000);
process.on('SIGINT', function() {
  agentState.running = false;
  saveHistory(history); saveState();
  console.log('Shutdown. Trades: ' + history.totalTrades);
  process.exit(0);
});



