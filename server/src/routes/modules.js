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

    // Verify course ownership - support both id and slug
    let course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      // Try finding by slug
      course = await prisma.course.findUnique({ where: { slug: courseId } })
    }
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Get next order number - use actual course.id
    const lastModule = await prisma.module.findFirst({
      where: { courseId: course.id },
      orderBy: { order: 'desc' }
    })
    const order = (lastModule?.order || 0) + 1

    const module = await prisma.module.create({
      data: {
        name,
        courseId: course.id,
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

// PUT /api/modules/reorder - Reorder modules within a course
// NOTE: This must be BEFORE /:id routes to avoid "reorder" being treated as an ID
router.put('/reorder', authenticate, async (req, res) => {
  try {
    const { courseId, moduleIds } = req.body

    if (!courseId || !moduleIds || !Array.isArray(moduleIds)) {
      return res.status(400).json({ error: 'Course ID and module IDs array are required' })
    }

    // Verify course ownership - support both id and slug
    let course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      course = await prisma.course.findUnique({ where: { slug: courseId } })
    }
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Update order for each module
    const updates = moduleIds.map((moduleId, index) =>
      prisma.module.update({
        where: { id: moduleId },
        data: { order: index + 1 }
      })
    )

    await prisma.$transaction(updates)

    res.json({ message: 'Modules reordered successfully' })
  } catch (error) {
    console.error('Reorder modules error:', error)
    res.status(500).json({ error: 'Failed to reorder modules' })
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

// GET /api/modules/:id/delete-info - Get info about what will be deleted
router.get('/:id/delete-info', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        course: true,
        lessons: {
          include: {
            sessions: true
          }
        }
      }
    })

    if (!module) {
      return res.status(404).json({ error: 'Module not found' })
    }
    if (module.course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Count sessions linked to lessons in this module
    const lessonsWithSessions = module.lessons.map(lesson => ({
      id: lesson.id,
      name: lesson.name,
      sessionCount: lesson.sessions.length
    })).filter(l => l.sessionCount > 0)

    const totalSessions = lessonsWithSessions.reduce((sum, l) => sum + l.sessionCount, 0)

    res.json({
      moduleName: module.name,
      lessonCount: module.lessons.length,
      lessonsWithSessions,
      totalSessions
    })
  } catch (error) {
    console.error('Get module delete info error:', error)
    res.status(500).json({ error: 'Failed to get delete info' })
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
