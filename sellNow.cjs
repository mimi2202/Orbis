// sellNow.cjs - sell the BTC you currently hold, back to USDT. Run: node sellNow.cjs
require('dotenv').config();
const BitgetApi = require('./src/services/bitgetApi.cjs');

(async () => {
  const api = new BitgetApi(
    process.env.BITGET_API_KEY,
    process.env.BITGET_SECRET_KEY,
    process.env.BITGET_PASSPHRASE
  );
  try {
    const btc = await api.getBalance('BTC');
    console.log('BTC held:', btc.available);
    if (btc.available <= 0) { console.log('No BTC to sell.'); return; }

    // sell slightly less than held to avoid precision/fee rejection, floor to 6dp
    const qty = Math.floor(btc.available * 0.999 * 1e6) / 1e6;
    console.log('Selling', qty, 'BTC at market...');
    const order = await api.placeOrder('BTCUSDT', 'sell', qty, 'market');
    console.log('ORDER RESP:', JSON.stringify(order));

    const after = await api.getBalance('USDT');
    console.log('USDT after sell:', after.available);
    console.log('DONE - you are now flat. Restart the agent to record a clean BUY -> SELL.');
  } catch (e) {
    console.error('SELL FAILED:', e.message);
  }
})();
