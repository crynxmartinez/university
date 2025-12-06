import express from 'express'
import prisma from '../lib/prisma.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// GET /api/courses/public - Get all public courses (no auth required)
router.get('/public', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        teacher: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(courses)
  } catch (error) {
    console.error('Get public courses error:', error)
    res.status(500).json({ error: 'Failed to get courses' })
  }
})

// Middleware to verify token and get user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { teacher: true }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// GET /api/courses - Get all courses for the logged-in teacher
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can access courses' })
    }

    const courses = await prisma.course.findMany({
      where: { teacherId: req.user.teacher.id },
      include: {
        modules: {
          include: {
            lessons: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(courses)
  } catch (error) {
    console.error('Get courses error:', error)
    res.status(500).json({ error: 'Failed to get courses' })
  }
})

// GET /api/courses/:id - Get a single course
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        enrollments: true
      }
    })

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Check if user is the teacher of this course
    if (req.user.role === 'TEACHER' && course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized to view this course' })
    }

    res.json(course)
  } catch (error) {
    console.error('Get course error:', error)
    res.status(500).json({ error: 'Failed to get course' })
  }
})

// POST /api/courses - Create a new course
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can create courses' })
    }

    const { name, description, type } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Course name is required' })
    }

    const course = await prisma.course.create({
      data: {
        name,
        description: description || '',
        type: type || 'RECORDED',
        teacherId: req.user.teacher.id
      },
      include: {
        modules: true
      }
    })

    res.status(201).json(course)
  } catch (error) {
    console.error('Create course error:', error)
    res.status(500).json({ error: 'Failed to create course' })
  }
})

// PUT /api/courses/:id - Update a course
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, type } = req.body

    // Check ownership
    const existing = await prisma.course.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (existing.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized to update this course' })
    }

    const course = await prisma.course.update({
      where: { id },
      data: { name, description, type },
      include: { modules: true }
    })

    res.json(course)
  } catch (error) {
    console.error('Update course error:', error)
    res.status(500).json({ error: 'Failed to update course' })
  }
})

// DELETE /api/courses/:id - Delete a course
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Check ownership
    const existing = await prisma.course.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (existing.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized to delete this course' })
    }

    await prisma.course.delete({ where: { id } })

    res.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    res.status(500).json({ error: 'Failed to delete course' })
  }
})

export default router
