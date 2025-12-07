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
        lesson: true,  // Include the class template
        exam: true     // Include the exam if EXAM type
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
        exam: true,
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

// POST /api/sessions - Create a new scheduled session (attach class/exam to calendar)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can create sessions' })
    }

    const { courseId, lessonId, examId, date, startTime, endTime, type, meetingLink, notes } = req.body

    if (!courseId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Course ID, date, start time, and end time are required' })
    }

    // Validate: CLASS type requires lessonId, EXAM type requires examId
    const sessionType = type || 'CLASS'
    if (sessionType === 'CLASS' && !lessonId) {
      return res.status(400).json({ error: 'Lesson ID is required for CLASS sessions' })
    }
    if (sessionType === 'EXAM' && !examId) {
      return res.status(400).json({ error: 'Exam ID is required for EXAM sessions' })
    }

    // Verify teacher owns this course
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to add sessions to this course' })
    }

    // Verify lesson exists and belongs to this course (for CLASS type)
    if (sessionType === 'CLASS' && lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: true }
      })
      if (!lesson || lesson.module.courseId !== courseId) {
        return res.status(400).json({ error: 'Invalid lesson for this course' })
      }
    }

    // Verify exam exists, belongs to this course, and is published (for EXAM type)
    if (sessionType === 'EXAM' && examId) {
      const exam = await prisma.exam.findUnique({ where: { id: examId } })
      if (!exam || exam.courseId !== courseId) {
        return res.status(400).json({ error: 'Invalid exam for this course' })
      }
      if (!exam.isPublished) {
        return res.status(400).json({ error: 'Only published exams can be scheduled' })
      }
    }

    // Parse date as YYYY-MM-DD and store as noon UTC to avoid date boundary issues
    const sessionDate = new Date(`${date}T12:00:00.000Z`)

    const session = await prisma.scheduledSession.create({
      data: {
        courseId,
        lessonId: sessionType === 'CLASS' ? lessonId : null,
        examId: sessionType === 'EXAM' ? examId : null,
        date: sessionDate,
        startTime,
        endTime,
        type: sessionType,
        meetingLink,
        notes
      },
      include: {
        materials: true,
        lesson: true,
        exam: true
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
    const { lessonId, examId, date, startTime, endTime, type, meetingLink, notes } = req.body

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

    const sessionType = type || existing.type

    // If lessonId is being changed, verify it belongs to this course
    if (sessionType === 'CLASS' && lessonId && lessonId !== existing.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: true }
      })
      if (!lesson || lesson.module.courseId !== existing.courseId) {
        return res.status(400).json({ error: 'Invalid lesson for this course' })
      }
    }

    // If examId is being changed, verify it belongs to this course and is published
    if (sessionType === 'EXAM' && examId && examId !== existing.examId) {
      const exam = await prisma.exam.findUnique({ where: { id: examId } })
      if (!exam || exam.courseId !== existing.courseId) {
        return res.status(400).json({ error: 'Invalid exam for this course' })
      }
      if (!exam.isPublished) {
        return res.status(400).json({ error: 'Only published exams can be scheduled' })
      }
    }

    // Parse date as noon UTC to avoid timezone boundary issues
    const sessionDate = date ? new Date(`${date}T12:00:00.000Z`) : undefined

    const session = await prisma.scheduledSession.update({
      where: { id },
      data: {
        lessonId: sessionType === 'CLASS' ? (lessonId || existing.lessonId) : null,
        examId: sessionType === 'EXAM' ? (examId || existing.examId) : null,
        date: sessionDate,
        startTime,
        endTime,
        type: sessionType,
        meetingLink,
        notes
      },
      include: {
        materials: true,
        lesson: true,
        exam: true
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

// GET /api/sessions/teacher/schedule - Get all sessions for teacher's courses (for teacher dashboard)
router.get('/teacher/schedule', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can access this' })
    }

    const teacherId = req.user.teacher.id

    // Get all courses for this teacher
    const courses = await prisma.course.findMany({
      where: { teacherId },
      select: { id: true }
    })

    const courseIds = courses.map(c => c.id)

    // Get today's start (midnight)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get all sessions from today onwards
    const sessions = await prisma.scheduledSession.findMany({
      where: {
        courseId: { in: courseIds },
        date: { gte: today }
      },
      include: {
        lesson: { select: { name: true } },
        course: { select: { id: true, slug: true, name: true, type: true } }
      },
      orderBy: { date: 'asc' }
    })

    // Count sessions for today (for notification badge)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const todayCount = sessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= today && sessionDate <= todayEnd
    }).length

    res.json({
      sessions,
      todayCount
    })
  } catch (error) {
    console.error('Get teacher schedule error:', error)
    res.status(500).json({ error: 'Failed to get schedule' })
  }
})

export default router
