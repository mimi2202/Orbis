// src/services/skillHub.cjs - SPOT MODE (no funding rate / no perp positions)
class SkillHub {
  constructor(bitgetApi) {
    this.api = bitgetApi;
  }

  async getSentimentData(symbol = 'BTCUSDT') {
    try {
      // SPOT: no funding rate. Build sentiment from 24h price change only.
      const ticker = await this.api.getTicker(symbol);
      const change = ticker.change24h || 0;

      // Fear & Greed proxy: strong down move -> fear, strong up move -> greed.
      const fearGreed = Math.max(0, Math.min(100, 50 - change * 500));

      return {
        fundingRate: 0, // n/a for spot, kept for schema compatibility
        fearGreedIndex: Math.round(fearGreed),
        longShortRatio: 1 + (Math.random() - 0.5) * 0.4,
        sentiment: fearGreed < 30 ? 'fear' : fearGreed > 70 ? 'greed' : 'neutral',
        change: change,
      };
    } catch (error) {
      console.error('Failed to get sentiment data:', error.message);
      throw error;
    }
  }

  async getTechnicalData(symbol = 'BTCUSDT') {
    try {
      const klines = await this.api.getKlines(symbol, '5min', 100);
      const prices = klines.map(k => k.close);
      const rsi = this.calculateRSI(prices);
      const macd = this.calculateMACD(prices);
      const ma50 = this.calculateMA(prices.slice(-50), 50);
      const ma200 = this.calculateMA(prices.slice(-200), 200);
      const currentPrice = prices[prices.length - 1];

      return {
        rsi: Math.round(rsi),
        macd: {
          line: macd.line,
          signal: macd.signal,
          histogram: macd.histogram,
        },
        ma50: Math.round(ma50),
        ma200: Math.round(ma200),
        pricePosition: currentPrice > ma50 ? 'above_50' : 'below_50',
        trend: this.determineTrend(prices),
      };
    } catch (error) {
      console.error('Failed to get technical data:', error.message);
      throw error;
    }
  }

  async getMacroData() {
    return {
      dxyIndex: 103 + (Math.random() - 0.5) * 4,
      nasdaqCorrelation: 0.6 + (Math.random() - 0.5) * 0.3,
      fedPolicySignal: Math.random() > 0.5 ? 'dovish' : 'hawkish',
      riskOnOff: Math.random() > 0.6 ? 'risk_on' : 'risk_off',
      liquidityIndex: Math.random() * 100,
    };
  }

  async getMarketIntel(symbol = 'BTCUSDT') {
    return {
      etfFlows: (Math.random() - 0.5) * 500,
      whaleActivity: Math.random() > 0.7 ? 'high' : 'normal',
      defiTvl: 40000 + (Math.random() - 0.5) * 5000,
      largeTransactions: Math.floor(Math.random() * 20) + 5,
      exchangeInflows: (Math.random() - 0.5) * 1000,
    };
  }

  async getNewsBriefing() {
    const headlines = [
      'Bitcoin ETF flows show institutional interest',
      'Fed signals potential rate cuts in 2026',
      'New DeFi protocol launches on Ethereum',
      'Regulatory clarity improves in Asia',
      'Whale accumulates worth of BTC',
    ];

    const selectedHeadlines = [];
    const count = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * headlines.length);
      selectedHeadlines.push({
        title: headlines[idx],
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
        timestamp: new Date().toISOString(),
      });
    }

    return {
      headlines: selectedHeadlines,
      sentimentSummary: this.aggregateSentiment(selectedHeadlines),
    };
  }

  async getMarketContext(symbol = 'BTCUSDT') {
    const [sentiment, technical, macro, intel, news, price] = await Promise.all([
      this.getSentimentData(symbol),
      this.getTechnicalData(symbol),
      this.getMacroData(),
      this.getMarketIntel(symbol),
      this.getNewsBriefing(),
      this.api.getPrice(symbol),
    ]);

    return {
      symbol: symbol,
      price: price,
      timestamp: new Date().toISOString(),
      sentiment: sentiment,
      technical: technical,
      macro: macro,
      intel: intel,
      news: news,
      position: [], // SPOT: no perp positions; held-asset state lives in the agent
    };
  }

  calculateRSI(prices, period = 14) {
    if (!Array.isArray(prices) || prices.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = prices.length - period; i < prices.length - 1; i++) {
      const diff = prices[i + 1] - prices[i];
      if (diff >= 0) gains = gains + diff;
      else losses = losses - diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices) {
    if (!Array.isArray(prices) || prices.length < 26) {
      return { line: 0, signal: 0, histogram: 0 };
    }
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const line = ema12 - ema26;
    const signal = this.calculateEMA([line], 9);
    return { line: line, signal: signal, histogram: line - signal };
  }

  calculateEMA(prices, period) {
    if (!Array.isArray(prices) || prices.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  calculateMA(prices, period) {
    if (!Array.isArray(prices) || prices.length === 0) return 0;
    const validPrices = prices.slice(0, period);
    if (validPrices.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < validPrices.length; i++) {
      sum = sum + validPrices[i];
    }
    return sum / validPrices.length;
  }

  determineTrend(prices) {
    if (!Array.isArray(prices) || prices.length < 50) return 'neutral';
    const ma20 = this.calculateMA(prices.slice(-20), 20);
    const ma50 = this.calculateMA(prices.slice(-50), 50);
    const currentPrice = prices[prices.length - 1];
    if (currentPrice > ma20 && ma20 > ma50) return 'bullish';
    if (currentPrice < ma20 && ma20 < ma50) return 'bearish';
    return 'neutral';
  }

  aggregateSentiment(headlines) {
    if (!Array.isArray(headlines) || headlines.length === 0) return 'neutral';
    let positive = 0;
    let negative = 0;
    for (let i = 0; i < headlines.length; i++) {
      if (headlines[i].sentiment === 'positive') positive++;
      else if (headlines[i].sentiment === 'negative') negative++;
    }
    const neutral = headlines.length - positive - negative;
    if (positive > negative + neutral) return 'positive';
    if (negative > positive + neutral) return 'negative';
    return 'neutral';
  }
}

module.exports = SkillHub;
