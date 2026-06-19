// src/services/websocket.js

class WebSocketService {
  constructor() {
    this.ws = null
    this.subscribers = []
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.isConnected = false
  }

  connect() {
    try {
      // Use individual streams instead of combined
      const wsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@trade'
      
      this.ws = new WebSocket(wsUrl)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket connected to Binance')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.notifySubscribers({ type: 'connected' })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.e === 'trade') {
            this.notifySubscribers({ 
              type: 'trade', 
              data: {
                symbol: data.s,
                price: parseFloat(data.p),
                quantity: parseFloat(data.q),
                timestamp: data.T
              }
            })
          }
        } catch (error) {
          // Silent fail
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.isConnected = false
        setTimeout(() => this.reconnect(), 2000)
      }

      this.ws.onerror = () => {
        // Silent fail - let onclose handle reconnect
      }
    } catch (error) {
      console.error('WebSocket error:', error)
      setTimeout(() => this.reconnect(), 2000)
    }
  }

  reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return
    this.reconnectAttempts++
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`)
    this.connect()
  }

  subscribe(callback) {
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }

  notifySubscribers(data) {
    this.subscribers.forEach(callback => {
      try { callback(data) } catch (e) {}
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.isConnected = false
    }
  }

  getStatus() {
    return { connected: this.isConnected, attempts: this.reconnectAttempts }
  }
}

export const wsService = new WebSocketService()
