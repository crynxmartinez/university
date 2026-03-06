import rateLimit from 'express-rate-limit'

// Phase 5.1: Rate limiting middleware

// General API rate limiter - 100 requests per minute
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { 
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Strict limiter for auth endpoints - 5 requests per minute
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { 
    error: 'Too many login attempts, please try again after a minute.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
})

// Password change limiter - 3 requests per minute
export const passwordLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: { 
    error: 'Too many password change attempts, please try again later.',
    code: 'PASSWORD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Public endpoints limiter - 30 requests per minute per IP
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { 
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Signup limiter - 3 signups per hour per IP (prevent spam accounts)
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { 
    error: 'Too many accounts created, please try again later.',
    code: 'SIGNUP_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
})
