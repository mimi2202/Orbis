// src/agent/qwenAnalyst.cjs - SPOT accumulation: deploy idle capital, exit on signal
const axios = require('axios');

class QwenAnalyst {
  constructor(apiKey, skillHub) {
    this.apiKey = apiKey;
    this.skillHub = skillHub;
    this.baseUrl = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
    this.model = 'qwen3.6-plus';
    this.useMock = !apiKey || apiKey === 'mock_qwen_key' || apiKey === 'your_qwen_api_key_here' || apiKey === 'mock';
    this.OVERBOUGHT = 70; // only thing that blocks a flat entry

    if (this.useMock) {
      console.log('Using LOCAL technical analysis (no Qwen key)');
    } else {
      console.log('Qwen API URL:', this.baseUrl);
    }
  }

  async analyze(symbol = 'BTCUSDT', hasPosition = false) {
    const context = await this.skillHub.getMarketContext(symbol);
    context._hasPosition = hasPosition;
    const rsi = context.technical?.rsi ?? 50;

    if (this.useMock) {
      return this.getLocalDecision(context, hasPosition);
    }

    const systemPrompt =
      'You are a SPOT crypto accumulation agent (no leverage). You hold either USDT (FLAT) or the asset (HOLDING). ' +
      'This strategy keeps capital deployed. Rules: ' +
      'If FLAT: BUY to deploy capital. Trend does NOT block entry. Only HOLD if RSI > 70 (extremely overbought). ' +
      'If HOLDING: SELL when RSI > 58, OR trend is bearish, OR MACD histogram < 0. Otherwise HOLD. ' +
      'Never BUY while holding; never SELL while flat. ' +
      'Output ONLY valid JSON: { "decision": "BUY|SELL|HOLD", "confidence": 0-100, "reasoning": "one sentence" }';

    const userPrompt =
      'Position state: ' + (hasPosition ? 'HOLDING' : 'FLAT') + '\n' +
      'Symbol: ' + context.symbol + '\n' +
      'Price: $' + context.price.toFixed(2) + '\n' +
      '24h Change: ' + ((context.sentiment?.change || 0) * 100).toFixed(2) + '%\n' +
      'RSI: ' + rsi + '\n' +
      'Trend: ' + (context.technical?.trend || 'neutral') + '\n' +
      'MACD Histogram: ' + (context.technical?.macd?.histogram || 0).toFixed(4) + '\n' +
      'Price vs MA50: ' + (context.technical?.pricePosition || 'neutral') + '\n' +
      'What is your decision?';

    let decision;
    try {
      console.log('Calling Qwen API at:', this.baseUrl);
      const response = await axios({
        method: 'POST',
        url: this.baseUrl + '/chat/completions',
        headers: {
          'Authorization': 'Bearer ' + this.apiKey,
          'Content-Type': 'application/json',
        },
        data: {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 200,
        },
      });

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in Qwen response');
      decision = JSON.parse(jsonMatch[0]);
      if (!['BUY', 'SELL', 'HOLD'].includes(decision.decision)) {
        throw new Error('Invalid decision: ' + decision.decision);
      }
    } catch (error) {
      console.error('Qwen analysis failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data || {}, null, 2));
      }
      return this.getLocalDecision(context, hasPosition);
    }

    let safe = this.enforcePositionRules(decision, hasPosition);

    // Deploy idle capital: if flat and not extremely overbought, force the entry
    // even if the model hesitated on trend. Keeps the agent from sitting in cash.
    if (!hasPosition && safe.decision === 'HOLD' && rsi <= this.OVERBOUGHT) {
      safe = {
        decision: 'BUY',
        confidence: 66,
        reasoning: 'Deploying idle capital (spot accumulation); RSI ' + rsi + ' acceptable',
      };
    }

    return { ...safe, timestamp: new Date().toISOString(), marketData: context };
  }

  enforcePositionRules(decision, hasPosition) {
    if (decision.decision === 'BUY' && hasPosition) {
      return { decision: 'HOLD', confidence: 50, reasoning: 'Already holding; spot single position' };
    }
    if (decision.decision === 'SELL' && !hasPosition) {
      return { decision: 'HOLD', confidence: 50, reasoning: 'Flat; nothing to sell' };
    }
    return decision;
  }

  getLocalDecision(context, hasPosition) {
    const rsi = context.technical?.rsi ?? 50;
    const trend = context.technical?.trend || 'neutral';
    const hist = context.technical?.macd?.histogram ?? 0;
    const price = context.price || 0;

    let decision = 'HOLD';
    let confidence = 50;
    let reasoning = 'Holding pattern';

    if (!hasPosition) {
      if (rsi > this.OVERBOUGHT) {
        decision = 'HOLD';
        confidence = 55;
        reasoning = 'RSI ' + rsi + ' extremely overbought - wait';
      } else {
        decision = 'BUY';
        confidence = 68;
        reasoning = 'Deploying idle capital (spot accumulation); RSI ' + rsi + ', trend ' + trend;
      }
    } else {
      if (rsi > 58) {
        decision = 'SELL';
        confidence = 70;
        reasoning = 'RSI ' + rsi + ' - take the exit';
      } else if (trend === 'bearish' || hist < 0) {
        decision = 'SELL';
        confidence = 66;
        reasoning = 'Trend/MACD turning down - protect the position';
      } else {
        decision = 'HOLD';
        confidence = 55;
        reasoning = 'Position healthy - hold';
      }
    }

    confidence = Math.min(95, Math.max(40, confidence));

    return {
      decision,
      confidence: Math.round(confidence),
      reasoning,
      entryPrice: decision !== 'HOLD' ? price : undefined,
      stopLoss: decision === 'BUY' ? price * 0.99 : undefined,
      takeProfit: decision === 'BUY' ? price * 1.02 : undefined,
      timestamp: new Date().toISOString(),
      marketData: context,
      _local: true,
    };
  }

  async loadStrategy() {
    try {
      const fs = require('fs');
      const path = require('path');
      const strategyPath = path.join(process.cwd(), 'strategies', 'default.strategy.md');
      return fs.readFileSync(strategyPath, 'utf8');
    } catch (error) {
      return null;
    }
  }
}

module.exports = QwenAnalyst;
