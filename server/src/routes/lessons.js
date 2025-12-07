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

// GET /api/lessons/:id - Get a single lesson
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' })
    }

    res.json(lesson)
  } catch (error) {
    console.error('Get lesson error:', error)
    res.status(500).json({ error: 'Failed to get lesson' })
  }
})

// POST /api/lessons - Create a new lesson (class template)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, materials, videoUrl, moduleId } = req.body

    if (!name || !moduleId) {
      return res.status(400).json({ error: 'Lesson name and module ID are required' })
    }

    // Verify module ownership
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true }
    })
    if (!module) {
      return res.status(404).json({ error: 'Module not found' })
    }
    if (module.course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Get next order number
    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' }
    })
    const order = (lastLesson?.order || 0) + 1

    const lesson = await prisma.lesson.create({
      data: {
        name,
        description: description || '',
        materials: materials || '',
        videoUrl: videoUrl || null,
        moduleId,
        order
      }
    })

    res.status(201).json(lesson)
  } catch (error) {
    console.error('Create lesson error:', error)
    res.status(500).json({ error: 'Failed to create lesson' })
  }
})

// PUT /api/lessons/:id - Update a lesson (class template)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, materials, videoUrl } = req.body

    // Verify ownership
    const existing = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: { course: true }
        }
      }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Lesson not found' })
    }
    if (existing.module.course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        name,
        description,
        materials,
        videoUrl: videoUrl || null
      }
    })

    res.json(lesson)
  } catch (error) {
    console.error('Update lesson error:', error)
    res.status(500).json({ error: 'Failed to update lesson' })
  }
})

// DELETE /api/lessons/:id - Delete a lesson
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    // Verify ownership
    const existing = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: { course: true }
        }
      }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Lesson not found' })
    }
    if (existing.module.course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.lesson.delete({ where: { id } })

    res.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Delete lesson error:', error)
    res.status(500).json({ error: 'Failed to delete lesson' })
  }
})

export default router
