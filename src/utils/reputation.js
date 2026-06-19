export function updateReputation(agents, trade) {
  const updates = {}
  const pnl = trade.pnl || 0
  
  agents.forEach(agent => {
    // If trade was profitable, increase trust
    const trustDelta = pnl > 0 ? Math.min(10, pnl * 2) : Math.max(-10, pnl * 1.5)
    const accuracyDelta = pnl > 0 ? Math.min(5, pnl) : Math.max(-5, -pnl)
    
    updates[agent.type] = {
      trust: Math.max(0, Math.min(100, agent.trust + trustDelta)),
      accuracy: Math.max(0, Math.min(100, agent.accuracy + accuracyDelta))
    }
  })
  
  return updates
}
