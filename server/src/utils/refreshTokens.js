// Phase 5.2: Refresh Token Management
// In-memory store for refresh tokens
// Note: For production with multiple instances, use Redis or database instead

import crypto from 'crypto'

const refreshTokens = new Map()
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export function generateRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString('hex')
  const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY
  
  // Store token with user info
  refreshTokens.set(token, {
    userId,
    expiresAt,
    createdAt: Date.now()
  })
  
  return { token, expiresAt }
}

export function validateRefreshToken(token) {
  const record = refreshTokens.get(token)
  
  if (!record) {
    return { valid: false, error: 'Invalid refresh token' }
  }
  
  if (Date.now() > record.expiresAt) {
    // Token expired, remove it
    refreshTokens.delete(token)
    return { valid: false, error: 'Refresh token expired' }
  }
  
  return { valid: true, userId: record.userId }
}

export function revokeRefreshToken(token) {
  return refreshTokens.delete(token)
}

export function revokeAllUserTokens(userId) {
  let count = 0
  for (const [token, record] of refreshTokens.entries()) {
    if (record.userId === userId) {
      refreshTokens.delete(token)
      count++
    }
  }
  return count
}

// Cleanup expired tokens periodically (call this on a schedule)
export function cleanupExpiredTokens() {
  const now = Date.now()
  let count = 0
  for (const [token, record] of refreshTokens.entries()) {
    if (now > record.expiresAt) {
      refreshTokens.delete(token)
      count++
    }
  }
  return count
}

// Run cleanup every hour
setInterval(cleanupExpiredTokens, 60 * 60 * 1000)
