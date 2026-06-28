🧠 Orbis - Autonomous Intelligence Exchange (Bitget AI Hackathon S1)
🚀 Overview
Orbis is an autonomous AI trading agent that combines Qwen 3.6 Plus market analysis with Bitget's v3 API for live trading execution. It behaves like a self-running hedge fund terminal, powered by AI-driven market intelligence.

🧠 Core Concept
Orbis simulates a machine-native financial market with:

AI Intelligence Sources:
Sentiment Analyst → Fear & Greed Index, funding rates, long/short ratios

Technical Analysis → RSI, MACD, moving averages, trend detection

Macro Analyst → Fed policy signals, DXY correlation, risk-on/off regime

Trading Agent:
Collects market context from all 3 skills

Qwen AI generates trading decision (BUY/SELL/HOLD)

Executes trades via Bitget API (paper or real)

Manages risk with stop-loss and take-profit

📊 Architecture
text
Bitget Market Data (Price, Klines, Ticker)
         ↓
Bitget Skill Hub (3 Analyst Skills)
         ↓
Qwen 3.6 Plus AI Analysis
         ↓
Trading Decision Engine
         ↓
Bitget v3 API Execution
         ↓
Live Dashboard (Bloomberg Feed)
🔧 Tech Stack
Component	Technology
Backend	Node.js, Express, WebSocket
Frontend	React, Vite, TailwindCSS
Trading API	Bitget v3 API (Unified Account)
AI Model	Qwen 3.6 Plus (Alibaba Cloud DashScope)
Market Data	Bitget Public API v2
Deployment	Render (Backend), Vercel (Frontend)
🎯 Hackathon Track
Track 1: Trading Agent

Orbis demonstrates:

✅ Natural language-driven trading (Qwen interprets strategy rules)

✅ BTC/USDT spot trading on Bitget

✅ Adaptive market regime strategy (trend-following + mean reversion)

✅ Paper trading + real trading support

✅ Live dashboard with Bloomberg-style event feed

⚙️ Strategy Logic
Market Regime Detection
Trending: Fast SMA > Slow SMA → Follow trend

Ranging: Fast SMA ≤ Slow SMA → Mean reversion

Unclear: Stay flat

Entry Rules
BUY: Funding Rate < -0.01% AND Fear & Greed < 40

SELL: Funding Rate > 0.1% OR Fear & Greed > 75

HOLD: Conditions neutral or uncertain

Risk Management
Stop Loss: -1% from entry

Take Profit: +2% from entry

Max Hold Time: 4 hours

Max Daily Trades: 10

Max Drawdown: 30%

📡 Live Features
🧠 Qwen AI Analysis - Real-time market interpretation

📊 Hedge Fund Dashboard - Balance, win rate, PnL, drawdown

📡 Bloomberg Feed - Live event stream via WebSocket

💰 Wallet System - Bitget API key management (no private keys)

🎮 Start/Stop Controls - Manual agent control from dashboard

🖥️ How to Run
1. Clone the repository
bash
git clone https://github.com/mimi2202/Orbis.git
cd Orbis
2. Install dependencies
bash
npm install
3. Configure environment variables
Create a .env file:

env
BITGET_API_KEY=your_api_key
BITGET_SECRET_KEY=your_secret
BITGET_PASSPHRASE=your_passphrase
BITGET_QWEN_API_KEY=your_qwen_key
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
MAX_TRADE_AMOUNT=0.001
STOP_LOSS_PERCENT=1
TAKE_PROFIT_PERCENT=2
MAX_DAILY_TRADES=10
MAX_DRAWDOWN=30
4. Start backend
bash
node server.cjs
5. Start frontend
bash
npm run dev
6. Open dashboard
text
http://localhost:5173
🎮 How to Use
Open dashboard → https://orbis-blue.vercel.app

Click "Start Engine" → Agent begins trading cycle

Watch AI trade → Qwen analysis, signals, trades, PnL updates

Monitor performance → Stats cards show real-time metrics

📊 Paper Trading Log
A complete paper trading log with 67 trades is available in this repo:

📁 paper_trading_log.csv

Period: June 24-26, 2026

Starting Balance: $1,000 USDT (scaled to $10,000 for testing)

Win Rate: 55.2% (37 wins / 30 losses)

Total PnL: +$0.09 USDT (paper)

Best Trade: +$0.13 USDT

Worst Trade: -$0.14 USDT

📈 Performance Summary
Metric	Value
Total Trades	67
Win Rate	55.2%
Total PnL	+$0.09 USDT
Max Drawdown	-0.21%
Best Trade	+$0.13 USDT
Worst Trade	-$0.14 USDT
🔮 Future Upgrades
More trading pairs (ETH, SOL)

AI reinforcement learning for strategy optimization

Multi-strategy support

Institutional dashboard mode

Telegram/Discord bot integration

📌 Hackathon Submission
Project: Orbis - Autonomous Intelligence Exchange

Track: Trading Agent (Track 1)

Live Demo: https://orbis-blue.vercel.app

GitHub (Backend): https://github.com/mimi2202/Orbis

GitHub (Frontend): https://github.com/UDM2202/Orbis

How to Add the CSV to Your GitHub Repo