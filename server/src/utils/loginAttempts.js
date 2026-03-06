// Phase 5.4: Account lockout tracking
// In-memory store for failed login attempts
// Note: For production with multiple instances, use Redis instead

const failedAttempts = new Map()
const LOCKOUT_THRESHOLD = 5 // Lock after 5 failed attempts
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
const ATTEMPT_WINDOW = 15 * 60 * 1000 // Track attempts within 15 minutes

export function recordFailedAttempt(identifier) {
  const now = Date.now()
  const key = identifier.toLowerCase()
  
  if (!failedAttempts.has(key)) {
    failedAttempts.set(key, { attempts: [], lockedUntil: null })
  }
  
  const record = failedAttempts.get(key)
  
  // Filter out old attempts outside the window
  record.attempts = record.attempts.filter(time => now - time < ATTEMPT_WINDOW)
  
  // Add new attempt
  record.attempts.push(now)
  
  // Check if should lock
  if (record.attempts.length >= LOCKOUT_THRESHOLD) {
    record.lockedUntil = now + LOCKOUT_DURATION
    record.attempts = [] // Clear attempts after locking
  }
  
  failedAttempts.set(key, record)
  
  return {
    attemptsRemaining: Math.max(0, LOCKOUT_THRESHOLD - record.attempts.length),
    isLocked: record.lockedUntil && record.lockedUntil > now
  }
}

export function isAccountLocked(identifier) {
  const key = identifier.toLowerCase()
  const record = failedAttempts.get(key)
  
  if (!record || !record.lockedUntil) {
    return { locked: false, remainingMs: 0 }
  }
  
  const now = Date.now()
  if (record.lockedUntil > now) {
    return { 
      locked: true, 
      remainingMs: record.lockedUntil - now,
      remainingMinutes: Math.ceil((record.lockedUntil - now) / 60000)
    }
  }
  
  // Lock expired, clear it
  record.lockedUntil = null
  failedAttempts.set(key, record)
  return { locked: false, remainingMs: 0 }
}

export function clearFailedAttempts(identifier) {
  const key = identifier.toLowerCase()
  failedAttempts.delete(key)
}

export function getAttemptInfo(identifier) {
  const key = identifier.toLowerCase()
  const record = failedAttempts.get(key)
  
  if (!record) {
    return { attempts: 0, attemptsRemaining: LOCKOUT_THRESHOLD }
  }
  
  const now = Date.now()
  const recentAttempts = record.attempts.filter(time => now - time < ATTEMPT_WINDOW)
  
  return {
    attempts: recentAttempts.length,
    attemptsRemaining: Math.max(0, LOCKOUT_THRESHOLD - recentAttempts.length)
  }
}
