// src/utils/api.jsx - WITH named exports
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const api = {
  getStatus: async function() {
    const response = await fetch(API_URL + '/api/status');
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  },
  getWallet: async function() {
    const response = await fetch(API_URL + '/api/agent-wallet');
    if (!response.ok) throw new Error('Failed to fetch wallet');
    return response.json();
  },
  getSignals: async function() {
    const response = await fetch(API_URL + '/api/agent-signals');
    if (!response.ok) throw new Error('Failed to fetch signals');
    return response.json();
  },
  getSettings: async function() {
    const response = await fetch(API_URL + '/api/settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    return response.json();
  },
  startAgent: async function() {
    const response = await fetch(API_URL + '/api/start-auto-trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to start agent');
    return response.json();
  },
  stopAgent: async function() {
    const response = await fetch(API_URL + '/api/stop-auto-trade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to stop agent');
    return response.json();
  },
  connectWebSocket: function(onMessage) {
    const ws = new WebSocket('ws://localhost:5000');
    ws.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    };
    ws.onerror = function(error) {
      console.error('WebSocket error:', error);
    };
    return ws;
  }
};
