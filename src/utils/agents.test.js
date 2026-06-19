import { generateSignals, shouldUpdateSignals } from '../../utils/agents'

describe('Agents Utils', () => {
  test('generateSignals returns signals for all agents', () => {
    const signals = generateSignals()
    expect(signals).toHaveProperty('whale')
    expect(signals).toHaveProperty('narrative')
    expect(signals).toHaveProperty('derivatives')
  })

  test('generateSignals returns valid signal structure', () => {
    const signals = generateSignals()
    const whaleSignal = signals.whale
    expect(whaleSignal).toHaveProperty('direction')
    expect(whaleSignal).toHaveProperty('confidence')
    expect(whaleSignal).toHaveProperty('price')
    expect(whaleSignal).toHaveProperty('timestamp')
    expect(['bullish', 'bearish']).toContain(whaleSignal.direction)
    expect(whaleSignal.confidence).toBeGreaterThan(0.5)
    expect(whaleSignal.confidence).toBeLessThan(1)
  })

  test('shouldUpdateSignals returns true after 3 seconds', () => {
    const oldTimestamp = Date.now() - 4000
    expect(shouldUpdateSignals(oldTimestamp)).toBe(true)
  })

  test('shouldUpdateSignals returns false within 3 seconds', () => {
    const recentTimestamp = Date.now()
    expect(shouldUpdateSignals(recentTimestamp)).toBe(false)
  })
})
