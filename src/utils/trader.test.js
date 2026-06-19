import { traderDecision, executeTrade } from '../../utils/trader'

describe('Trader Utils', () => {
  test('traderDecision calculates conviction correctly', () => {
    const signals = {
      whale: { direction: 'bullish', confidence: 0.8, price: 0.01 },
      narrative: { direction: 'bullish', confidence: 0.7, price: 0.005 },
      derivatives: { direction: 'bullish', confidence: 0.6, price: 0.008 }
    }
    const decision = traderDecision(signals)
    expect(decision).toHaveProperty('conviction')
    expect(decision).toHaveProperty('decision')
    expect(decision).toHaveProperty('signals')
    expect(decision.conviction).toBeGreaterThan(65)
    expect(decision.decision).toBe('BUY')
  })

  test('executeTrade returns trade object with result', () => {
    const decision = { conviction: 80, decision: 'BUY', signals: {} }
    const trade = executeTrade(decision)
    expect(trade).toHaveProperty('result')
    expect(trade).toHaveProperty('profit')
    expect(trade).toHaveProperty('txHash')
    expect(trade).toHaveProperty('executedAt')
    expect(['WIN', 'LOSS']).toContain(trade.result)
  })
})
