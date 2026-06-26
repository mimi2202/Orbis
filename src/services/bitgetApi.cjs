// src/services/bitgetApi.cjs - REAL API, SPOT MODE (Unified Account / v3)
const crypto = require('crypto');
const axios = require('axios');

class BitgetApi {
  constructor(apiKey, secretKey, passphrase) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.passphrase = passphrase;
    this.baseUrl = 'https://api.bitget.com';
    this.isPaperTrading = false;
    this.category = 'SPOT';
  }

  signRequest(timestamp, method, requestPath, body = '') {
    const preHash = timestamp + method.toUpperCase() + requestPath + body;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(preHash)
      .digest('base64');
  }

  async request(method, endpoint, params = {}, body = null) {
    const timestamp = Date.now().toString();
    const requestPath = endpoint.startsWith('/') ? endpoint : '/' + endpoint;

    const queryString = new URLSearchParams(params).toString();
    const fullPath = queryString ? requestPath + '?' + queryString : requestPath;

    const bodyString = body ? JSON.stringify(body) : '';
    const signature = this.signRequest(timestamp, method, fullPath, bodyString);

    const headers = {
      'ACCESS-KEY': this.apiKey,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp,
      'ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
      'locale': 'en-US',
    };

    const url = this.baseUrl + fullPath;
    const config = {
      method: method.toUpperCase(),
      url: url,
      headers: headers,
    };

    if (body) {
      config.data = body;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Bitget API error:', error.response?.status, error.response?.data || error.message);
      throw error;
    }
  }

  // ============ V2 PUBLIC ENDPOINTS (NO AUTH NEEDED) ============

  async getPrice(symbol = 'BTCUSDT') {
    const response = await axios({
      method: 'GET',
      url: 'https://api.bitget.com/api/v2/spot/market/tickers?symbol=' + symbol,
    });
    const data = response.data;
    if (data.code === '00000' && data.data && data.data.length > 0) {
      return parseFloat(data.data[0].lastPr);
    }
    throw new Error('No price data');
  }

  async getKlines(symbol = 'BTCUSDT', interval = '5min', limit = 100) {
    const response = await axios({
      method: 'GET',
      url: 'https://api.bitget.com/api/v2/spot/market/candles?symbol=' + symbol + '&granularity=' + interval + '&limit=' + limit,
    });
    const data = response.data;

    if (data.code !== '00000') {
      throw new Error(data.msg || 'Failed to get klines');
    }

    const klines = data.data || [];
    if (!Array.isArray(klines)) {
      throw new Error('Klines is not an array');
    }

    return klines.map(function (k) {
      return {
        timestamp: parseInt(k[0]),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
      };
    });
  }

  async getTicker(symbol = 'BTCUSDT') {
    const response = await axios({
      method: 'GET',
      url: 'https://api.bitget.com/api/v2/spot/market/tickers?symbol=' + symbol,
    });
    const data = response.data;
    if (data.code === '00000' && data.data && data.data.length > 0) {
      const ticker = data.data[0];
      return {
        symbol: symbol,
        price: parseFloat(ticker.lastPr),
        change24h: parseFloat(ticker.change24h) / 100,
        volume24h: parseFloat(ticker.baseVol),
      };
    }
    throw new Error('No ticker data');
  }

  // ============ V3 PRIVATE ENDPOINTS (UNIFIED ACCOUNT) ============

  async getBalance(asset = 'USDT') {
    const response = await this.request('GET', '/api/v3/account/assets', {}, null);

    if (response.code !== '00000') {
      throw new Error(response.msg || 'Failed to get balance');
    }

    // Defensive parsing — handles the common shapes the v3 assets endpoint
    // returns without crashing if a key name is slightly different.
    const data = response.data || {};
    let assets = [];
    if (Array.isArray(data)) assets = data;
    else if (Array.isArray(data.assets)) assets = data.assets;
    else if (Array.isArray(data.assetList)) assets = data.assetList;
    else if (Array.isArray(data.coinList)) assets = data.coinList;

    const found = assets.find(function (item) {
      return (item.coin || item.coinName || item.asset) === asset;
    });

    if (found) {
      const available = parseFloat(found.available ?? found.availableBalance ?? 0);
      const frozen = parseFloat(found.locked ?? found.frozen ?? 0);
      const total = parseFloat(found.equity ?? found.balance ?? found.total ?? (available + frozen));
      return { asset: asset, available, frozen, total };
    }

    // Not found = genuinely zero of this asset, OR the parse missed the field.
    // Check the RAW ASSETS log above to tell which.
    return { asset: asset, available: 0, frozen: 0, total: 0 };
  }

  // SPOT order via MARKETABLE LIMIT. We avoid market orders because a spot
  // market BUY's qty is ambiguous (base vs quote) and caused 25202. For a LIMIT
  // order, qty is ALWAYS the base amount (BTC), so it's unambiguous.
  //   - BUY:  pass `amount` = USDT to spend. We convert to base qty at a price
  //           just ABOVE market so it fills immediately.
  //   - SELL: pass `amount` = base qty (BTC) to sell, priced just BELOW market.
  // pricePrecision=2, quantityPrecision=6 for BTCUSDT (from /spot/public/symbols).
  async placeOrder(symbol, side, amount, type = 'market') {
    const price = await this.getPrice(symbol);
    let limitPrice, qty;

    if (side === 'buy') {
      limitPrice = (price * 1.005).toFixed(2);                 // 0.5% above market
      // floor to 6 dp so cost never exceeds the USDT we have
      qty = (Math.floor((amount / parseFloat(limitPrice)) * 1e6) / 1e6).toFixed(6);
    } else {
      limitPrice = (price * 0.995).toFixed(2);                 // 0.5% below market
      qty = (Math.floor(amount * 1e6) / 1e6).toFixed(6);
    }

    const body = {
      category: this.category,   // 'SPOT'
      symbol: symbol,            // 'BTCUSDT'
      orderType: 'limit',
      side: side,                // 'buy' | 'sell'
      qty: qty,                  // BASE amount (BTC) - unambiguous for limit
      price: limitPrice,
      timeInForce: 'gtc',
    };

    console.log('ORDER BODY:', JSON.stringify(body));
    const response = await this.request('POST', '/api/v3/trade/place-order', {}, body);
    console.log('RAW ORDER RESP:', JSON.stringify(response));

    if (response.code !== '00000') {
      throw new Error(response.msg || 'Failed to place order');
    }
    return response.data;
  }

  // ============ SPOT STUBS (no futures concepts) ============
  // Spot has no perpetual "positions" or "funding rate". These are kept as
  // safe no-ops so any existing caller won't break — they make NO API call,
  // which is what kills the 40404 errors. Position state for spot = which
  // asset you currently hold (tracked in the agent, not via this endpoint).

  async getPositions(symbol = 'BTCUSDT') {
    return [];
  }

  async closePosition(symbol) {
    // For spot, "closing" = selling the held base asset. The agent should
    // call placeOrder(symbol, 'sell', heldQty, 'market') instead.
    return { status: 'noop_spot', symbol: symbol };
  }

  async getFundingRate(symbol = 'BTCUSDT') {
    // Funding rate is a perps-only metric. Not applicable to SPOT.
    return 0;
  }
}

module.exports = BitgetApi;
