class Analytics {
  constructor() {
    this.enabled = true
    this.events = []
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  track(event, data = {}) {
    if (!this.enabled) return

    const eventData = {
      event,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      timeSinceStart: Date.now() - this.startTime
    }

    this.events.push(eventData)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', eventData)
    }

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Would send to Google Analytics, Mixpanel, etc.
      this.sendToService(eventData)
    }
  }

  sendToService(eventData) {
    // Placeholder for actual analytics service
    // Example: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(eventData) })
  }

  getEvents() {
    return this.events
  }

  getSummary() {
    return {
      totalEvents: this.events.length,
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      eventsByType: this.events.reduce((acc, e) => {
        acc[e.event] = (acc[e.event] || 0) + 1
        return acc
      }, {})
    }
  }

  // Track specific events
  trackSignalGenerated(agent, signal) {
    this.track('signal_generated', { agent, ...signal })
  }

  trackTradeExecuted(trade) {
    this.track('trade_executed', {
      conviction: trade.conviction,
      decision: trade.decision,
      result: trade.result,
      profit: trade.profit
    })
  }

  trackSignalPurchased(agent, price) {
    this.track('signal_purchased', { agent, price })
  }

  trackPageView(page) {
    this.track('page_view', { page })
  }

  trackUserAction(action, details = {}) {
    this.track('user_action', { action, ...details })
  }
}

export const analytics = new Analytics()
