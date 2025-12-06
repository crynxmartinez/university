import express from 'express'
import prisma from '../lib/prisma.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

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

// POST /api/modules - Create a new module
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, courseId } = req.body

    if (!name || !courseId) {
      return res.status(400).json({ error: 'Module name and course ID are required' })
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Get next order number
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' }
    })
    const order = (lastModule?.order || 0) + 1

    const module = await prisma.module.create({
      data: {
        name,
        courseId,
        order
      },
      include: { lessons: true }
    })

    res.status(201).json(module)
  } catch (error) {
    console.error('Create module error:', error)
    res.status(500).json({ error: 'Failed to create module' })
  }
})

// PUT /api/modules/:id - Update a module
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { name } = req.body

    // Verify ownership
    const existing = await prisma.module.findUnique({
      where: { id },
      include: { course: true }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Module not found' })
    }
    if (existing.course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const module = await prisma.module.update({
      where: { id },
      data: { name },
      include: { lessons: true }
    })

    res.json(module)
  } catch (error) {
    console.error('Update module error:', error)
    res.status(500).json({ error: 'Failed to update module' })
  }
})

// DELETE /api/modules/:id - Delete a module
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Verify ownership
    const existing = await prisma.module.findUnique({
      where: { id },
      include: { course: true }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Module not found' })
    }
    if (existing.course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.module.delete({ where: { id } })

    res.json({ message: 'Module deleted successfully' })
  } catch (error) {
    console.error('Delete module error:', error)
    res.status(500).json({ error: 'Failed to delete module' })
  }
})

export default router
