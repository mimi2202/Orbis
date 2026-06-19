// src/services/twak.js
import crypto from 'crypto'

const TWAK_API = 'https://api.trustwallet.com/v1'
const ACCESS_ID = process.env.TW_ACCESS_ID || process.env.TWAK_ACCESS_ID
const HMAC_SECRET = process.env.TW_HMAC_SECRET || process.env.TWAK_HMAC_SECRET

function generateSignature(method, path, timestamp, body = '') {
  const message = `${method}${path}${timestamp}${body}`
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(message)
    .digest('hex')
}

export async function getWalletBalance(address) {
  const timestamp = Date.now()
  const path = `/wallet/${address}/balance`
  
  const response = await fetch(`${TWAK_API}${path}`, {
    headers: {
      'X-Access-Id': ACCESS_ID,
      'X-Timestamp': timestamp.toString(),
      'X-Signature': generateSignature('GET', path, timestamp)
    }
  })
  
  return response.json()
}
