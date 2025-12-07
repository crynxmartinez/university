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
      include: { teacher: true, student: true }
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

// ============ SCHEDULED SESSION ROUTES ============

// GET /api/sessions/course/:courseId - Get all sessions for a course
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params

    const sessions = await prisma.scheduledSession.findMany({
      where: { courseId },
      include: {
        materials: true,
        lesson: true  // Include the class template
      },
      orderBy: { date: 'asc' }
    })

    res.json(sessions)
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ error: 'Failed to get sessions' })
  }
})

// GET /api/sessions/:id - Get a single session
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const session = await prisma.scheduledSession.findUnique({
      where: { id },
      include: {
        materials: true,
        lesson: true,
        course: true
      }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    res.json(session)
  } catch (error) {
    console.error('Get session error:', error)
    res.status(500).json({ error: 'Failed to get session' })
  }
})

// POST /api/sessions - Create a new scheduled session (attach class template to calendar)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can create sessions' })
    }

    const { courseId, lessonId, date, startTime, endTime, type, meetingLink, notes } = req.body

    if (!courseId || !lessonId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Course ID, lesson ID, date, start time, and end time are required' })
    }

    // Verify teacher owns this course
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to add sessions to this course' })
    }

    // Verify lesson exists and belongs to this course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: true }
    })
    if (!lesson || lesson.module.courseId !== courseId) {
      return res.status(400).json({ error: 'Invalid lesson for this course' })
    }

    const session = await prisma.scheduledSession.create({
      data: {
        courseId,
        lessonId,
        date: new Date(date),
        startTime,
        endTime,
        type: type || 'CLASS',
        meetingLink,
        notes
      },
      include: {
        materials: true,
        lesson: true
      }
    })

    res.status(201).json(session)
  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// PUT /api/sessions/:id - Update a scheduled session
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can update sessions' })
    }

    const { id } = req.params
    const { lessonId, date, startTime, endTime, type, meetingLink, notes } = req.body

    // Verify session exists and teacher owns the course
    const existing = await prisma.scheduledSession.findUnique({
      where: { id },
      include: { course: true }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (existing.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to update this session' })
    }

    // If lessonId is being changed, verify it belongs to this course
    if (lessonId && lessonId !== existing.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: true }
      })
      if (!lesson || lesson.module.courseId !== existing.courseId) {
        return res.status(400).json({ error: 'Invalid lesson for this course' })
      }
    }

    const session = await prisma.scheduledSession.update({
      where: { id },
      data: {
        lessonId: lessonId || undefined,
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        type,
        meetingLink,
        notes
      },
      include: {
        materials: true,
        lesson: true
      }
    })

    res.json(session)
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({ error: 'Failed to update session' })
  }
})

// DELETE /api/sessions/:id - Delete a scheduled session
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can delete sessions' })
    }

    const { id } = req.params

    // Verify session exists and teacher owns the course
    const existing = await prisma.scheduledSession.findUnique({
      where: { id },
      include: { course: true }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (existing.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to delete this session' })
    }

    await prisma.scheduledSession.delete({ where: { id } })

    res.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

// ============ SESSION MATERIAL ROUTES ============

// POST /api/sessions/:sessionId/materials - Add date-specific material to a session
router.post('/:sessionId/materials', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can add materials' })
    }

    const { sessionId } = req.params
    const { name, driveUrl } = req.body

    if (!name || !driveUrl) {
      return res.status(400).json({ error: 'Name and drive URL are required' })
    }

    // Verify session exists and teacher owns the course
    const session = await prisma.scheduledSession.findUnique({
      where: { id: sessionId },
      include: { course: true }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (session.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to add materials to this session' })
    }

    const material = await prisma.sessionMaterial.create({
      data: {
        sessionId,
        name,
        driveUrl
      }
    })

    res.status(201).json(material)
  } catch (error) {
    console.error('Add material error:', error)
    res.status(500).json({ error: 'Failed to add material' })
  }
})

// DELETE /api/sessions/materials/:materialId - Delete a material
router.delete('/materials/:materialId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can delete materials' })
    }

    const { materialId } = req.params

    // Verify material exists and teacher owns the course
    const material = await prisma.sessionMaterial.findUnique({
      where: { id: materialId },
      include: {
        session: {
          include: { course: true }
        }
      }
    })

    if (!material) {
      return res.status(404).json({ error: 'Material not found' })
    }

    if (material.session.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to delete this material' })
    }

    await prisma.sessionMaterial.delete({ where: { id: materialId } })

    res.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Delete material error:', error)
    res.status(500).json({ error: 'Failed to delete material' })
  }
})

// ============ STUDENT ROUTES ============

// GET /api/sessions/student/upcoming - Get upcoming sessions for enrolled courses
router.get('/student/upcoming', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    // Get all courses the student is enrolled in
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.student.id },
      select: { courseId: true }
    })

    const courseIds = enrollments.map(e => e.courseId)

    // Get upcoming sessions for those courses
    const sessions = await prisma.scheduledSession.findMany({
      where: {
        courseId: { in: courseIds },
        date: { gte: new Date() }
      },
      include: {
        materials: true,
        lesson: true,  // Include class template with its materials
        course: {
          select: { id: true, name: true, type: true }
        }
      },
      orderBy: { date: 'asc' },
      take: 20
    })

    res.json(sessions)
  } catch (error) {
    console.error('Get upcoming sessions error:', error)
    res.status(500).json({ error: 'Failed to get upcoming sessions' })
  }
})

export default router
