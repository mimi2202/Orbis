const isLocalhost =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'

export const API_URL = isLocalhost
  ? 'http://localhost:5000'
  : import.meta.env.VITE_API_URL || 'https://orbis-467q.onrender.com'

export const WS_URL = isLocalhost
  ? 'ws://localhost:5000'
<<<<<<< HEAD
  : 'wss://orbis-467q.onrender.com'
=======
  : 'https://orbis-467q.onrender.com'
>>>>>>> 83cbaf0c968f62ce33046d4bbc36b4b67f16be8b
