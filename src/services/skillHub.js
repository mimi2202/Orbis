class SkillHub {
  constructor(bitgetApi) {
    this.api = bitgetApi;
  }

  // Skill 1: Sentiment Analyst
  async getSentimentData(symbol = 'BTCUSDT') {
    const fundingRate = await this.api.getFundingRate(symbol);
    const ticker = await this.api.getTicker(symbol);

    // Simulate Fear & Greed Index based on price movement and funding
    const change = ticker.change24h || 0;
    const fearGreed = Math.max(0, Math.min(100, 50 - change * 500 + fundingRate * 1000));

    return {
      fundingRate,
      fearGreedIndex: Math.round(fearGreed),
      longShortRatio: 1 + (Math.random() - 0.5) * 0.4,
      sentiment: fearGreed < 30 ? 'fear' : fearGreed > 70 ? 'greed' : 'neutral',
    };
  }

  // Skill 2: Technical Analysis
  async getTechnicalData(symbol = 'BTCUSDT') {
    const klines = await this.api.getKlines(symbol, '1h', 24);
    const prices = klines.map(k => k.close);

    // Calculate RSI (simplified)
    const rsi = this.calculateRSI(prices);

    // Calculate MACD
    const macd = this.calculateMACD(prices);

    // Calculate moving averages
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
  }

  // Skill 3: Macro Analyst
  async getMacroData() {
    // Simulate macro indicators
    return {
      dxyIndex: 103 + (Math.random() - 0.5) * 4, // Dollar index
      nasdaqCorrelation: 0.6 + (Math.random() - 0.5) * 0.3,
      fedPolicySignal: Math.random() > 0.5 ? 'dovish' : 'hawkish',
      riskOnOff: Math.random() > 0.6 ? 'risk_on' : 'risk_off',
      liquidityIndex: Math.random() * 100,
    };
  }

  // Skill 4: Market Intel
  async getMarketIntel(symbol = 'BTCUSDT') {
    // Simulate on-chain data
    return {
      etfFlows: (Math.random() - 0.5) * 500, // million $
      whaleActivity: Math.random() > 0.7 ? 'high' : 'normal',
      defiTvl: 40000 + (Math.random() - 0.5) * 5000, // million $
      largeTransactions: Math.floor(Math.random() * 20) + 5,
      exchangeInflows: (Math.random() - 0.5) * 1000,
    };
  }

  // Skill 5: News Briefing
  async getNewsBriefing() {
    const headlines = [
      'Bitcoin ETF flows show institutional interest',
      'Fed signals potential rate cuts in 2026',
      'New DeFi protocol launches on Ethereum',
      'Regulatory clarity improves in Asia',
      'Whale accumulates $50M worth of BTC',
    ];

    const selectedHeadlines = [];
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 headlines

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

  // Get all market context for Qwen
  async getMarketContext(symbol = 'BTCUSDT') {
    const [
      sentiment,
      technical,
      macro,
      intel,
      news,
      price,
    ] = await Promise.all([
      this.getSentimentData(symbol),
      this.getTechnicalData(symbol),
      this.getMacroData(),
      this.getMarketIntel(symbol),
      this.getNewsBriefing(),
      this.api.getPrice(symbol),
    ]);

    return {
      symbol,
      price,
      timestamp: new Date().toISOString(),
      sentiment,
      technical,
      macro,
      intel,
      news,
      // Add current position if any
      position: await this.api.getPositions(symbol),
    };
  }

  // Helper: Calculate RSI
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length - 1; i++) {
      const diff = prices[i + 1] - prices[i];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Helper: Calculate MACD
  calculateMACD(prices) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const line = ema12 - ema26;
    const signal = this.calculateEMA([line], 9);
    return {
      line,
      signal,
      histogram: line - signal,
    };
  }

  // Helper: Calculate EMA
  calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
  }

  // Helper: Calculate Moving Average
  calculateMA(prices, period) {
    const validPrices = prices.slice(0, period);
    if (validPrices.length === 0) return 0;
    return validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
  }

  // Helper: Determine trend
  determineTrend(prices) {
    const ma20 = this.calculateMA(prices.slice(-20), 20);
    const ma50 = this.calculateMA(prices.slice(-50), 50);
    const currentPrice = prices[prices.length - 1];

    if (currentPrice > ma20 && ma20 > ma50) return 'bullish';
    if (currentPrice < ma20 && ma20 < ma50) return 'bearish';
    return 'neutral';
  }

  // Helper: Aggregate sentiment from news
  aggregateSentiment(headlines) {
    const positive = headlines.filter(h => h.sentiment === 'positive').length;
    const negative = headlines.filter(h => h.sentiment === 'negative').length;
    const neutral = headlines.length - positive - negative;

    if (positive > negative + neutral) return 'positive';
    if (negative > positive + neutral) return 'negative';
    return 'neutral';
  }
}

export default SkillHub;