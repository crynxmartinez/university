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
      include: { student: true }
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

// ============ STUDENT NOTE ROUTES ============

// GET /api/notes - Get all notes for the logged-in student
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can access notes' })
    }

    const notes = await prisma.studentNote.findMany({
      where: { studentId: req.user.student.id },
      include: {
        session: {
          include: {
            lesson: true,
            course: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: { id: true, name: true, type: true }
                }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    res.json(notes)
  } catch (error) {
    console.error('Get notes error:', error)
    res.status(500).json({ error: 'Failed to get notes' })
  }
})

// GET /api/notes/session/:sessionId - Get note for a specific session (LIVE courses)
router.get('/session/:sessionId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can access notes' })
    }

    const { sessionId } = req.params

    const note = await prisma.studentNote.findUnique({
      where: {
        studentId_sessionId: {
          studentId: req.user.student.id,
          sessionId
        }
      }
    })

    res.json(note || null)
  } catch (error) {
    console.error('Get note error:', error)
    res.status(500).json({ error: 'Failed to get note' })
  }
})

// GET /api/notes/lesson/:lessonId - Get note for a specific lesson (RECORDED courses)
router.get('/lesson/:lessonId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can access notes' })
    }

    const { lessonId } = req.params

    const note = await prisma.studentNote.findUnique({
      where: {
        studentId_lessonId: {
          studentId: req.user.student.id,
          lessonId
        }
      }
    })

    res.json(note || null)
  } catch (error) {
    console.error('Get note error:', error)
    res.status(500).json({ error: 'Failed to get note' })
  }
})

// POST /api/notes - Create or update a note for a session or lesson
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can create notes' })
    }

    const { sessionId, lessonId, content } = req.body

    if ((!sessionId && !lessonId) || !content) {
      return res.status(400).json({ error: 'Session ID or Lesson ID and content are required' })
    }

    let courseId = null

    // For session-based notes (LIVE courses)
    if (sessionId) {
      const session = await prisma.scheduledSession.findUnique({
        where: { id: sessionId },
        include: { course: true }
      })

      if (!session) {
        return res.status(404).json({ error: 'Session not found' })
      }
      courseId = session.courseId
    }

    // For lesson-based notes (RECORDED courses)
    if (lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { module: { include: { course: true } } }
      })

      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' })
      }
      courseId = lesson.module.course.id
    }

    // Check if student is enrolled in this course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.student.id,
          courseId
        }
      }
    })

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' })
    }

    let note

    // Upsert based on session or lesson
    if (sessionId) {
      note = await prisma.studentNote.upsert({
        where: {
          studentId_sessionId: {
            studentId: req.user.student.id,
            sessionId
          }
        },
        update: { content },
        create: {
          studentId: req.user.student.id,
          sessionId,
          content
        },
        include: {
          session: {
            include: {
              lesson: true,
              course: { select: { id: true, name: true, type: true } }
            }
          }
        }
      })
    } else {
      note = await prisma.studentNote.upsert({
        where: {
          studentId_lessonId: {
            studentId: req.user.student.id,
            lessonId
          }
        },
        update: { content },
        create: {
          studentId: req.user.student.id,
          lessonId,
          content
        },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: { select: { id: true, name: true, type: true } }
                }
              }
            }
          }
        }
      })
    }

    res.status(201).json(note)
  } catch (error) {
    console.error('Create/update note error:', error)
    res.status(500).json({ error: 'Failed to save note' })
  }
})

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can delete notes' })
    }

    const { id } = req.params

    // Verify note exists and belongs to this student
    const note = await prisma.studentNote.findUnique({
      where: { id }
    })

    if (!note) {
      return res.status(404).json({ error: 'Note not found' })
    }

    if (note.studentId !== req.user.student.id) {
      return res.status(403).json({ error: 'Not authorized to delete this note' })
    }

    await prisma.studentNote.delete({ where: { id } })

    res.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Delete note error:', error)
    res.status(500).json({ error: 'Failed to delete note' })
  }
})

export default router
