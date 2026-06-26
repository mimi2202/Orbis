import crypto from 'crypto';
import fetch from 'node-fetch';

class BitgetApi {
  constructor(apiKey, secretKey, passphrase) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.passphrase = passphrase;
    this.baseUrl = 'https://hackathon.bitgetops.com/v1';
    this.isPaperTrading = true; // Set to false for real trading
  }

  // Generate signature for Bitget API
  signRequest(timestamp, method, requestPath, body = '') {
    const preHash = timestamp + method + requestPath + body;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(preHash)
      .digest('base64');
  }

  // Make authenticated request
  async request(method, endpoint, params = {}, body = null) {
    const timestamp = Date.now().toString();
    const requestPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const queryString = new URLSearchParams(params).toString();
    const fullPath = queryString ? `${requestPath}?${queryString}` : requestPath;

    // For GET requests, body should be empty string
    const bodyString = body ? JSON.stringify(body) : '';
    const signature = this.signRequest(timestamp, method, fullPath, bodyString);

    const headers = {
      'ACCESS-KEY': this.apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
    };

    const url = `${this.baseUrl}${fullPath}`;
    const options = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Bitget API Error: ${data.msg || response.statusText}`);
    }

    return data;
  }

  // Get account balance
  async getBalance(asset = 'USDT') {
    if (this.isPaperTrading) {
      // Paper trading: return mock balance
      return {
        asset,
        available: 10000,
        frozen: 0,
        total: 10000,
      };
    }

    const response = await this.request('GET', '/api/spot/v1/account/assets', {
      coin: asset,
    });
    return response.data;
  }

  // Get current price
  async getPrice(symbol = 'BTCUSDT') {
    if (this.isPaperTrading) {
      // Mock price with small random movement
      const basePrice = 65000;
      const variance = (Math.random() - 0.5) * 200;
      return basePrice + variance;
    }

    const response = await this.request('GET', '/api/spot/v1/market/ticker', {
      symbol,
    });
    return parseFloat(response.data.price);
  }

  // Place order
  async placeOrder(symbol, side, quantity, type = 'market') {
    if (this.isPaperTrading) {
      const price = await this.getPrice(symbol);
      return {
        orderId: `paper_${Date.now()}`,
        symbol,
        side,
        quantity,
        price,
        status: 'filled',
        timestamp: new Date().toISOString(),
      };
    }

    const body = {
      symbol,
      side, // 'buy' or 'sell'
      orderType: type,
      quantity,
    };

    const response = await this.request('POST', '/api/spot/v1/trade/order', {}, body);
    return response.data;
  }

  // Get open positions
  async getPositions(symbol = 'BTCUSDT') {
    if (this.isPaperTrading) {
      return []; // Paper trading: no positions
    }

    const response = await this.request('GET', '/api/mix/v1/position/allPosition', {
      symbol,
    });
    return response.data;
  }

  // Close position
  async closePosition(symbol) {
    if (this.isPaperTrading) {
      return {
        orderId: `close_${Date.now()}`,
        symbol,
        status: 'closed',
      };
    }

    const response = await this.request('POST', '/api/mix/v1/order/closePosition', {}, {
      symbol,
    });
    return response.data;
  }

  // Get funding rate
  async getFundingRate(symbol = 'BTCUSDT') {
    if (this.isPaperTrading) {
      // Mock funding rate: random between -0.05% and 0.05%
      return (Math.random() - 0.5) * 0.001;
    }

    const response = await this.request('GET', '/api/mix/v1/market/funding-rate', {
      symbol,
    });
    return parseFloat(response.data.fundingRate);
  }

  // Get klines/candlesticks
  async getKlines(symbol = 'BTCUSDT', interval = '1h', limit = 24) {
    if (this.isPaperTrading) {
      // Generate mock klines
      const klines = [];
      let price = 65000;
      for (let i = 0; i < limit; i++) {
        const change = (Math.random() - 0.5) * 1000;
        price += change;
        klines.push({
          timestamp: Date.now() - i * 3600000,
          open: price - change / 2,
          high: price + Math.abs(change) / 2,
          low: price - Math.abs(change) / 2,
          close: price,
          volume: Math.random() * 1000,
        });
      }
      return klines.reverse();
    }

    const response = await this.request('GET', '/api/spot/v1/market/candles', {
      symbol,
      interval,
      limit,
    });
    return response.data;
  }

  // Get 24h ticker
  async getTicker(symbol = 'BTCUSDT') {
    if (this.isPaperTrading) {
      const price = await this.getPrice(symbol);
      return {
        symbol,
        price,
        change24h: (Math.random() - 0.5) * 0.05,
        volume24h: Math.random() * 1000000000,
      };
    }

    const response = await this.request('GET', '/api/spot/v1/market/ticker', {
      symbol,
    });
    return response.data;
  }
}

export default BitgetApi;