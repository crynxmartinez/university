import express from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../../lib/prisma.js'

const router = express.Router()

// Middleware to verify token and require SUPER_ADMIN
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

// All routes require SUPER_ADMIN role
router.use(requireAdmin)

// ============ EXAM CRUD ============

// GET /api/admin/course-exams/:courseId - Get all exams for a course
router.get('/:courseId', async (req, res) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { courseId: req.params.courseId },
      include: {
        questions: {
          include: { choices: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })
    res.json(exams)
  } catch (error) {
    console.error('Get exams error:', error)
    res.status(500).json({ error: 'Failed to fetch exams' })
  }
})

// GET /api/admin/course-exams/exam/:examId - Get single exam with questions
router.get('/exam/:examId', async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.examId },
      include: {
        questions: {
          include: { choices: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    res.json(exam)
  } catch (error) {
    console.error('Get exam error:', error)
    res.status(500).json({ error: 'Failed to fetch exam' })
  }
})

// POST /api/admin/course-exams/:courseId - Create an exam
router.post('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const { title, description, totalPoints, timeLimit } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Exam title is required' })
    }

    // Get max order
    const maxOrder = await prisma.exam.aggregate({
      where: { courseId },
      _max: { order: true }
    })

    const exam = await prisma.exam.create({
      data: {
        courseId,
        title,
        description,
        totalPoints: totalPoints || 100,
        timeLimit: timeLimit || null,
        order: (maxOrder._max.order || 0) + 1,
        isPublished: false
      },
      include: {
        questions: {
          include: { choices: true }
        }
      }
    })

    res.status(201).json(exam)
  } catch (error) {
    console.error('Create exam error:', error)
    res.status(500).json({ error: 'Failed to create exam' })
  }
})

// PUT /api/admin/course-exams/exam/:examId - Update an exam
router.put('/exam/:examId', async (req, res) => {
  try {
    const { examId } = req.params
    const { title, description, totalPoints, timeLimit, maxTabSwitch } = req.body

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: {
        title,
        description,
        totalPoints,
        timeLimit,
        maxTabSwitch
      },
      include: {
        questions: {
          include: { choices: true }
        }
      }
    })

    res.json(exam)
  } catch (error) {
    console.error('Update exam error:', error)
    res.status(500).json({ error: 'Failed to update exam' })
  }
})

// PUT /api/admin/course-exams/exam/:examId/publish - Toggle publish status
router.put('/exam/:examId/publish', async (req, res) => {
  try {
    const { examId } = req.params

    const existing = await prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: true }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    // Require at least one question to publish
    if (!existing.isPublished && existing.questions.length === 0) {
      return res.status(400).json({ error: 'Cannot publish exam without questions' })
    }

    const exam = await prisma.exam.update({
      where: { id: examId },
      data: { isPublished: !existing.isPublished }
    })

    res.json(exam)
  } catch (error) {
    console.error('Toggle publish error:', error)
    res.status(500).json({ error: 'Failed to toggle publish status' })
  }
})

// DELETE /api/admin/course-exams/exam/:examId - Delete an exam
router.delete('/exam/:examId', async (req, res) => {
  try {
    const { examId } = req.params

    await prisma.exam.delete({ where: { id: examId } })

    res.json({ message: 'Exam deleted successfully' })
  } catch (error) {
    console.error('Delete exam error:', error)
    res.status(500).json({ error: 'Failed to delete exam' })
  }
})

// ============ QUESTION CRUD ============

// POST /api/admin/course-exams/exam/:examId/questions - Add a question
router.post('/exam/:examId/questions', async (req, res) => {
  try {
    const { examId } = req.params
    const { question, points, choices } = req.body

    if (!question) {
      return res.status(400).json({ error: 'Question text is required' })
    }

    // Get max order
    const maxOrder = await prisma.examQuestion.aggregate({
      where: { examId },
      _max: { order: true }
    })

    const newQuestion = await prisma.examQuestion.create({
      data: {
        examId,
        question,
        points: points || 10,
        order: (maxOrder._max.order || 0) + 1,
        choices: {
          create: choices?.map((c, idx) => ({
            text: c.text,
            isCorrect: c.isCorrect || false,
            order: idx + 1
          })) || []
        }
      },
      include: { choices: true }
    })

    // Update exam total points
    await updateExamTotalPoints(examId)

    res.status(201).json(newQuestion)
  } catch (error) {
    console.error('Add question error:', error)
    res.status(500).json({ error: 'Failed to add question' })
  }
})

// PUT /api/admin/course-exams/questions/:questionId - Update a question
router.put('/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params
    const { question, points, choices } = req.body

    // Get existing question to find examId
    const existing = await prisma.examQuestion.findUnique({
      where: { id: questionId }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Question not found' })
    }

    // Delete existing choices and recreate
    await prisma.examChoice.deleteMany({
      where: { questionId }
    })

    const updated = await prisma.examQuestion.update({
      where: { id: questionId },
      data: {
        question,
        points,
        choices: {
          create: choices?.map((c, idx) => ({
            text: c.text,
            isCorrect: c.isCorrect || false,
            order: idx + 1
          })) || []
        }
      },
      include: { choices: true }
    })

    // Update exam total points
    await updateExamTotalPoints(existing.examId)

    res.json(updated)
  } catch (error) {
    console.error('Update question error:', error)
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// DELETE /api/admin/course-exams/questions/:questionId - Delete a question
router.delete('/questions/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params

    // Get examId before deleting
    const question = await prisma.examQuestion.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    await prisma.examQuestion.delete({ where: { id: questionId } })

    // Update exam total points
    await updateExamTotalPoints(question.examId)

    res.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Delete question error:', error)
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// PUT /api/admin/course-exams/exam/:examId/questions/reorder - Reorder questions
router.put('/exam/:examId/questions/reorder', async (req, res) => {
  try {
    const { questionIds } = req.body

    await Promise.all(
      questionIds.map((id, index) =>
        prisma.examQuestion.update({
          where: { id },
          data: { order: index + 1 }
        })
      )
    )

    res.json({ message: 'Questions reordered successfully' })
  } catch (error) {
    console.error('Reorder questions error:', error)
    res.status(500).json({ error: 'Failed to reorder questions' })
  }
})

// ============ GRADES ============

// GET /api/admin/course-exams/:courseId/grades - Get all student grades for a course
router.get('/:courseId/grades', async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: { include: { profile: true } }
              }
            }
          }
        },
        exams: {
          where: { isPublished: true },
          include: {
            attempts: {
              where: { status: 'SUBMITTED' },
              orderBy: { submittedAt: 'desc' }
            }
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Build grades for each student
    const grades = course.enrollments.map(enrollment => {
      const student = enrollment.student
      const studentId = student.id

      const examScores = course.exams.map(exam => {
        // Get latest attempt for this student
        const latestAttempt = exam.attempts.find(a => a.studentId === studentId)
        return {
          examId: exam.id,
          examTitle: exam.title,
          totalPoints: exam.totalPoints,
          score: latestAttempt?.score || null,
          submittedAt: latestAttempt?.submittedAt
        }
      })

      const totalEarned = examScores.reduce((sum, e) => sum + (e.score || 0), 0)
      const totalPossible = examScores.reduce((sum, e) => e.score !== null ? sum + e.totalPoints : sum, 0)
      const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null

      return {
        studentId: student.id,
        odId: enrollment.studentId,
        name: student.user?.profile?.fullName || 'Unknown',
        examScores,
        totalEarned,
        totalPossible,
        percentage,
        passed: percentage !== null ? percentage >= 75 : null
      }
    })

    res.json(grades)
  } catch (error) {
    console.error('Get grades error:', error)
    res.status(500).json({ error: 'Failed to fetch grades' })
  }
})

// ============ ALL GRADES (for admin dashboard) ============

// GET /api/admin/course-exams/all-grades - Get all grades across all courses and programs
router.get('/all-grades', async (req, res) => {
  try {
    // Get course grades
    const courseExams = await prisma.exam.findMany({
      where: { isPublished: true },
      include: {
        course: true,
        attempts: {
          where: { status: 'SUBMITTED' },
          include: {
            student: {
              include: {
                user: { include: { profile: true } }
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    // Get program grades
    const programExams = await prisma.programExam.findMany({
      where: { isPublished: true },
      include: {
        program: true,
        attempts: {
          where: { status: 'SUBMITTED' },
          include: {
            student: {
              include: {
                user: { include: { profile: true } }
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    res.json({
      courseExams,
      programExams
    })
  } catch (error) {
    console.error('Get all grades error:', error)
    res.status(500).json({ error: 'Failed to fetch grades' })
  }
})

// Helper function to update exam total points
async function updateExamTotalPoints(examId) {
  const questions = await prisma.examQuestion.findMany({
    where: { examId }
  })

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

  await prisma.exam.update({
    where: { id: examId },
    data: { totalPoints }
  })
}

export default router
