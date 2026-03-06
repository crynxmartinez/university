import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { authLimiter, signupLimiter, passwordLimiter } from '../middleware/rateLimiter.js'
import { isAccountLocked, recordFailedAttempt, clearFailedAttempts } from '../utils/loginAttempts.js'
import { generateRefreshToken, validateRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/refreshTokens.js'

const router = express.Router()

// Helper function to generate student ID
async function generateStudentId() {
  const year = new Date().getFullYear()
  
  // Get or create sequence for this year
  let sequence = await prisma.idSequence.findUnique({
    where: { type_year: { type: 'STUDENT', year } }
  })
  
  if (!sequence) {
    sequence = await prisma.idSequence.create({
      data: { type: 'STUDENT', year, lastNumber: 0 }
    })
  }
  
  // Increment and get new number
  const updated = await prisma.idSequence.update({
    where: { type_year: { type: 'STUDENT', year } },
    data: { lastNumber: { increment: 1 } }
  })
  
  return `STU-${year}${String(updated.lastNumber).padStart(4, '0')}`
}

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Student self-registration
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Generate student ID
    const studentId = await generateStudentId()
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with student record
    const user = await prisma.user.create({
      data: {
        userId: studentId,
        email,
        password: hashedPassword,
        role: 'STUDENT',
        mustChangePassword: false,
        profileComplete: false,
        profile: {
          create: {
            firstName,
            lastName
          }
        },
        student: {
          create: {
            studentId,
            status: 'APPLICANT'
          }
        }
      },
      include: {
        profile: true,
        student: true
      }
    })

    res.status(201).json({
      message: 'Registration successful. Please wait for approval.',
      userId: user.userId
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       423:
 *         description: Account locked
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { userId, password } = req.body

    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password are required' })
    }

    // Phase 5.4: Check if account is locked
    const lockStatus = isAccountLocked(userId)
    if (lockStatus.locked) {
      return res.status(423).json({ 
        error: `Account temporarily locked. Try again in ${lockStatus.remainingMinutes} minute(s).`,
        code: 'ACCOUNT_LOCKED',
        remainingMinutes: lockStatus.remainingMinutes
      })
    }

    // Find user by userId
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        profile: true
      }
    })

    if (!user) {
      // Record failed attempt even for non-existent users (prevents enumeration)
      const attemptResult = recordFailedAttempt(userId)
      return res.status(401).json({ 
        error: 'Invalid credentials',
        attemptsRemaining: attemptResult.attemptsRemaining
      })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      // Phase 5.4: Record failed attempt
      const attemptResult = recordFailedAttempt(userId)
      if (attemptResult.isLocked) {
        return res.status(423).json({ 
          error: 'Account locked due to too many failed attempts. Try again in 15 minutes.',
          code: 'ACCOUNT_LOCKED'
        })
      }
      return res.status(401).json({ 
        error: 'Invalid credentials',
        attemptsRemaining: attemptResult.attemptsRemaining
      })
    }

    // Phase 5.4: Clear failed attempts on successful login
    clearFailedAttempts(userId)

    // Generate JWT access token (short-lived: 15 minutes)
    const token = jwt.sign(
      { id: user.id, userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    // Phase 5.2: Generate refresh token (long-lived: 7 days)
    const refreshTokenData = generateRefreshToken(user.id)

    res.json({
      token,
      refreshToken: refreshTokenData.token,
      expiresIn: 15 * 60, // 15 minutes in seconds
      user: {
        id: user.id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        profileComplete: user.profileComplete,
        profile: user.profile
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    res.json({
      id: user.id,
      userId: user.userId,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      profileComplete: user.profileComplete,
      profile: user.profile
    })
  } catch (error) {
    console.error('Auth check error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
})

// POST /api/auth/change-password - Change password (for first login)
// Phase 5.1: Rate limited to 3 attempts per minute per IP
router.post('/change-password', passwordLimiter, async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const { newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false
      },
      include: { profile: true }
    })

    res.json({
      message: 'Password changed successfully',
      user: {
        id: user.id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        profileComplete: user.profileComplete,
        profile: user.profile
      }
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
})

// POST /api/auth/seed - Initialize admin accounts (one-time use)
// SECURITY: This endpoint is disabled in production unless ALLOW_SEED=true
router.post('/seed', async (req, res) => {
  try {
    // Block seed endpoint in production unless explicitly allowed
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
      return res.status(403).json({ error: 'Seed endpoint is disabled in production' })
    }

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { userId: 'ADMIN-001' }
    })

    if (existingAdmin) {
      return res.json({ message: 'Database already seeded', alreadySeeded: true })
    }

    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create Super Admin (this is the main admin account)
    await prisma.user.create({
      data: {
        userId: 'ADMIN-001',
        email: 'admin@ilm.edu.ph',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        mustChangePassword: false,
        profileComplete: true,
        profile: {
          create: {
            firstName: 'Super',
            lastName: 'Admin'
          }
        }
      }
    })

    res.json({ 
      message: 'Database seeded successfully',
      accounts: [
        { userId: 'ADMIN-001', password: 'admin123', role: 'SUPER_ADMIN' }
      ]
    })
  } catch (error) {
    console.error('Seed error:', error)
    res.status(500).json({ error: 'Failed to seed database', details: error.message })
  }
})

// Phase 5.2: POST /api/auth/refresh - Exchange refresh token for new access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    // Validate refresh token
    const validation = validateRefreshToken(refreshToken)
    if (!validation.valid) {
      return res.status(401).json({ error: validation.error, code: 'INVALID_REFRESH_TOKEN' })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: validation.userId },
      include: { profile: true }
    })

    if (!user) {
      revokeRefreshToken(refreshToken)
      return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' })
    }

    // Generate new access token
    const token = jwt.sign(
      { id: user.id, userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    res.json({
      token,
      expiresIn: 15 * 60,
      user: {
        id: user.id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        profileComplete: user.profileComplete,
        profile: user.profile
      }
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(500).json({ error: 'Failed to refresh token' })
  }
})

// Phase 5.2: POST /api/auth/logout - Revoke refresh token
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      revokeRefreshToken(refreshToken)
    }

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
})

// Phase 5.2: POST /api/auth/logout-all - Revoke all refresh tokens for user
router.post('/logout-all', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const count = revokeAllUserTokens(decoded.id)

    res.json({ message: `Logged out from all devices. ${count} session(s) revoked.` })
  } catch (error) {
    console.error('Logout all error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
})

export default router
