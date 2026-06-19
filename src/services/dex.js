// src/services/dex.js
import { ethers } from 'ethers'

// PancakeSwap Router
const PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
const BSC_RPC = 'https://bsc-dataseed.binance.org/'

// Token addresses on BSC
const TOKENS = {
  BNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'
}

export async function executeRealTrade(decision, amount) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(BSC_RPC)
    const wallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider)
    
    // Get current price
    const price = await getPrice()
    
    // Build swap transaction
    let tx
    if (decision === 'BUY') {
      // Swap BNB → USDT
      tx = await swapBNBtoUSDT(wallet, amount)
    } else {
      // Swap USDT → BNB
      tx = await swapUSDTtoBNB(wallet, amount)
    }
    
    // Wait for confirmation
    const receipt = await tx.wait()
    
    // Calculate real PnL
    const pnl = await calculateRealPnL(decision, amount, price)
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      price: price,
      amount: amount,
      pnl: pnl
    }
  } catch (error) {
    console.error('Trade failed:', error)
    return { success: false, error: error.message }
  }
}

async function swapBNBtoUSDT(wallet, amount) {
  const router = new ethers.Contract(
    PANCAKE_ROUTER,
    ['function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline)'],
    wallet
  )
  
  const path = [TOKENS.BNB, TOKENS.USDT]
  const amountIn = ethers.utils.parseEther(amount.toString())
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20
  
  return await router.swapExactETHForTokens(
    0, // amountOutMin (0 = no slippage protection)
    path,
    wallet.address,
    deadline,
    { value: amountIn }
  )
}

async function getPrice() {
  const provider = new ethers.providers.JsonRpcProvider(BSC_RPC)
  const router = new ethers.Contract(
    PANCAKE_ROUTER,
    ['function getAmountsOut(uint amountIn, address[] path) view returns (uint[])'],
    provider
  )
  
  const path = [TOKENS.BNB, TOKENS.USDT]
  const amounts = await router.getAmountsOut(
    ethers.utils.parseEther('1'),
    path
  )
  
  return parseFloat(ethers.utils.formatEther(amounts[1]))
}
