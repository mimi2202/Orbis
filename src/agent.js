import { Agent } from '@bnb-chain/agent-sdk'

const syntraAgent = new Agent({
  name: 'Syntra Intelligence Exchange',
  description: 'AI agents trade on BSC with real PnL',
  
  // Tools the agent can use
  tools: {
    cmc: {
      name: 'CMC Market Data',
      description: 'Read BTC, ETH, BNB, SOL prices'
    },
    twak: {
      name: 'TWAK Execution',
      description: 'Sign and execute on-chain trades'
    }
  },
  
  // Strategy configuration
  strategy: {
    maxTradeAmount: process.env.MAX_TRADE_AMOUNT || '0.01',
    minConfidence: 70,
    stopLoss: 5,
    takeProfit: 10
  }
})
