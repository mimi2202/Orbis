// src/services/cmc.js
import axios from 'axios'

const CMC_API_KEY = process.env.CMC_API_KEY
const CMC_API = 'https://pro-api.coinmarketcap.com/v1'

export async function getMarketData() {
  const [prices, fearGreed, funding] = await Promise.all([
    getPrices(),
    getFearGreedIndex(),
    getFundingRates()
  ])
  
  return { prices, fearGreed, funding }
}

async function getPrices() {
  const response = await axios.get(`${CMC_API}/cryptocurrency/quotes/latest`, {
    params: {
      symbol: 'BTC,ETH,BNB,SOL'
    },
    headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY }
  })
  return response.data
}

async function getFearGreedIndex() {
  const response = await axios.get(`${CMC_API}/global-metrics/quotes/latest`)
  return response.data.data.fear_greed
}

async function getFundingRates() {
  // CMC has funding rates for derivatives
  const response = await axios.get(`${CMC_API}/derivatives`)
  return response.data.data
}
