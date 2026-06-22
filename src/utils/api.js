const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'

export const API_URL = isLocalhost
  ? 'http://localhost:5000'
  : import.meta.env.VITE_API_URL || 'https://syntra-ubkl.onrender.com'

export const WS_URL = isLocalhost
  ? 'ws://localhost:5000'
  : 'wss://syntra-ubkl.onrender.com'
