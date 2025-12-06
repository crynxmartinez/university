import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

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

// POST /api/auth/signup - Student self-registration
router.post('/signup', async (req, res) => {
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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body

    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password are required' })
    }

    // Find user by userId
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        profile: true
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, userId: user.userId, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
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
router.post('/change-password', async (req, res) => {
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

export default router
