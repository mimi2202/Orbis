// test.js - Quick test for Syntra V2
const TradingAgent = require('./src/agent/tradingAgent.cjs');
async function test() {
  console.log('🧪 Testing Syntra V2...\n');
  const agent = new TradingAgent();
  // Test 1: Check API connection
  console.log('📡 Testing Bitget API...');
  try {
    const price = await agent.api.getPrice('BTCUSDT');
    console.log('✅ API connected. BTC Price: $' + price.toFixed(2));
  } catch (e) {
    console.log('❌ API error:', e.message);
  }
  // Test 2: Test Skill Hub
  console.log('\n📊 Testing Skill Hub...');
  try {
    const context = await agent.skillHub.getMarketContext('BTCUSDT');
    console.log('✅ Skills loaded. Fear & Greed:', context.sentiment.fearGreedIndex);
  } catch (e) {
    console.log('❌ Skill Hub error:', e.message);
  }
  // Test 3: Test Qwen
  console.log('\n🧠 Testing Qwen...');
  try {
    const decision = await agent.analyst.analyze('BTCUSDT');
    console.log('✅ Qwen decision:', decision.decision, '(', decision.confidence + '%)');
    console.log('💡', decision.reasoning);
  } catch (e) {
    console.log('❌ Qwen error:', e.message);
  }
  console.log('\n✅ Test complete!');
}
test();
