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

// POST /api/attendance/mark-join - Auto-mark attendance when student clicks join
router.post('/mark-join', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can mark attendance' })
    }

    const { sessionId } = req.body

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' })
    }

    // Verify session exists and student is enrolled in the course
    const session = await prisma.scheduledSession.findUnique({
      where: { id: sessionId },
      include: { course: true }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Check if student is enrolled in this course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.student.id,
          courseId: session.courseId
        }
      }
    })

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' })
    }

    // Create or update attendance record
    const attendance = await prisma.sessionAttendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: req.user.student.id
        }
      },
      update: {
        status: 'PRESENT',
        joinedAt: new Date(),
        markedBy: 'AUTO'
      },
      create: {
        sessionId,
        studentId: req.user.student.id,
        status: 'PRESENT',
        joinedAt: new Date(),
        markedBy: 'AUTO'
      }
    })

    res.json({ message: 'Attendance marked', attendance })
  } catch (error) {
    console.error('Mark attendance error:', error)
    res.status(500).json({ error: 'Failed to mark attendance' })
  }
})

// GET /api/attendance/session/:sessionId - Get attendance for a session (teacher only)
router.get('/session/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params

    // Verify session exists and teacher owns the course
    const session = await prisma.scheduledSession.findUnique({
      where: { id: sessionId },
      include: { course: true }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (req.user.role !== 'TEACHER' || session.course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Get all enrolled students with their attendance for this session
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: session.courseId },
      include: {
        student: {
          include: {
            user: { include: { profile: true } },
            attendance: {
              where: { sessionId }
            }
          }
        }
      }
    })

    // Format response
    const attendanceList = enrollments.map(enrollment => {
      const attendance = enrollment.student.attendance[0]
      return {
        studentId: enrollment.student.id,
        studentName: enrollment.student.user.profile?.fullName || enrollment.student.user.email,
        email: enrollment.student.user.email,
        status: attendance?.status || 'ABSENT',
        joinedAt: attendance?.joinedAt || null,
        markedBy: attendance?.markedBy || null,
        attendanceId: attendance?.id || null
      }
    })

    res.json(attendanceList)
  } catch (error) {
    console.error('Get session attendance error:', error)
    res.status(500).json({ error: 'Failed to get attendance' })
  }
})

// PUT /api/attendance/session/:sessionId - Update attendance for a session (teacher only)
router.put('/session/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params
    const { attendance } = req.body // Array of { studentId, status }

    if (!attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ error: 'Attendance array is required' })
    }

    // Verify session exists and teacher owns the course
    const session = await prisma.scheduledSession.findUnique({
      where: { id: sessionId },
      include: { course: true }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (req.user.role !== 'TEACHER' || session.course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Update or create attendance records
    const updates = attendance.map(({ studentId, status }) =>
      prisma.sessionAttendance.upsert({
        where: {
          sessionId_studentId: { sessionId, studentId }
        },
        update: {
          status,
          markedBy: 'TEACHER'
        },
        create: {
          sessionId,
          studentId,
          status,
          markedBy: 'TEACHER'
        }
      })
    )

    await prisma.$transaction(updates)

    res.json({ message: 'Attendance updated' })
  } catch (error) {
    console.error('Update attendance error:', error)
    res.status(500).json({ error: 'Failed to update attendance' })
  }
})

// GET /api/attendance/student/:courseId - Get student's own attendance for a course
router.get('/student/:courseId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    const { courseId } = req.params

    // Get all sessions for this course with student's attendance
    const sessions = await prisma.scheduledSession.findMany({
      where: { courseId },
      include: {
        lesson: true,
        attendance: {
          where: { studentId: req.user.student.id }
        }
      },
      orderBy: { date: 'asc' }
    })

    const attendanceList = sessions.map(session => ({
      sessionId: session.id,
      lessonName: session.lesson?.name || 'Untitled',
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.attendance[0]?.status || 'ABSENT',
      joinedAt: session.attendance[0]?.joinedAt || null
    }))

    res.json(attendanceList)
  } catch (error) {
    console.error('Get student attendance error:', error)
    res.status(500).json({ error: 'Failed to get attendance' })
  }
})

export default router
