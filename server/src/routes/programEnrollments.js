import express from 'express'
import prisma from '../lib/prisma.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// Middleware to verify token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// POST /api/program-enrollments - Enroll in a program
router.post('/', authenticate, async (req, res) => {
  try {
    const { programId } = req.body
    const studentId = req.user.id

    if (!programId) {
      return res.status(400).json({ error: 'Program ID is required' })
    }

    // Check if program exists and is active
    const program = await prisma.program.findUnique({
      where: { id: programId }
    })

    if (!program) {
      return res.status(404).json({ error: 'Program not found' })
    }

    if (!program.isActive) {
      return res.status(400).json({ error: 'Program is not available for enrollment' })
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.programEnrollment.findUnique({
      where: {
        studentId_programId: {
          studentId,
          programId
        }
      }
    })

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this program' })
    }

    // Create enrollment
    const enrollment = await prisma.programEnrollment.create({
      data: {
        studentId,
        programId
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            programType: true,
            schedule: true,
            location: true,
            meetingLink: true,
            image: true
          }
        }
      }
    })

    res.status(201).json(enrollment)
  } catch (error) {
    console.error('Enroll in program error:', error)
    res.status(500).json({ error: 'Failed to enroll in program' })
  }
})

// GET /api/program-enrollments/my - Get my enrolled programs
router.get('/my', authenticate, async (req, res) => {
  try {
    const studentId = req.user.id

    const enrollments = await prisma.programEnrollment.findMany({
      where: { 
        studentId,
        status: 'ACTIVE'
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            priceType: true,
            programType: true,
            schedule: true,
            location: true,
            meetingLink: true,
            image: true,
            isActive: true
          }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })

    res.json(enrollments)
  } catch (error) {
    console.error('Get my program enrollments error:', error)
    res.status(500).json({ error: 'Failed to get enrollments' })
  }
})

// GET /api/program-enrollments/check/:programId - Check if enrolled in a program
router.get('/check/:programId', authenticate, async (req, res) => {
  try {
    const { programId } = req.params
    const studentId = req.user.id

    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        studentId_programId: {
          studentId,
          programId
        }
      }
    })

    res.json({ enrolled: !!enrollment, enrollment })
  } catch (error) {
    console.error('Check enrollment error:', error)
    res.status(500).json({ error: 'Failed to check enrollment' })
  }
})

// DELETE /api/program-enrollments/:programId - Unenroll from a program
router.delete('/:programId', authenticate, async (req, res) => {
  try {
    const { programId } = req.params
    const studentId = req.user.id

    const enrollment = await prisma.programEnrollment.findUnique({
      where: {
        studentId_programId: {
          studentId,
          programId
        }
      }
    })

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' })
    }

    await prisma.programEnrollment.delete({
      where: { id: enrollment.id }
    })

    res.json({ message: 'Successfully unenrolled from program' })
  } catch (error) {
    console.error('Unenroll from program error:', error)
    res.status(500).json({ error: 'Failed to unenroll from program' })
  }
})

export default router
