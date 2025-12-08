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
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
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

// GET /api/admin/program-exams/:programId - Get all exams for a program
router.get('/:programId', async (req, res) => {
  try {
    const exams = await prisma.programExam.findMany({
      where: { programId: req.params.programId },
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

// GET /api/admin/program-exams/exam/:examId - Get single exam with questions
router.get('/exam/:examId', async (req, res) => {
  try {
    const exam = await prisma.programExam.findUnique({
      where: { id: req.params.examId },
      include: {
        questions: {
          include: { choices: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' }
        },
        program: true
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

// POST /api/admin/program-exams/:programId - Create exam
router.post('/:programId', async (req, res) => {
  try {
    const { title, description, totalPoints, timeLimit, maxTabSwitch } = req.body
    const { programId } = req.params
    
    // Get max order
    const maxOrder = await prisma.programExam.aggregate({
      where: { programId },
      _max: { order: true }
    })
    
    const exam = await prisma.programExam.create({
      data: {
        programId,
        title,
        description,
        totalPoints: totalPoints || 100,
        timeLimit,
        maxTabSwitch: maxTabSwitch || 3,
        order: (maxOrder._max.order || 0) + 1
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

// PUT /api/admin/program-exams/exam/:examId - Update exam
router.put('/exam/:examId', async (req, res) => {
  try {
    const { title, description, totalPoints, timeLimit, maxTabSwitch, isPublished } = req.body
    
    const exam = await prisma.programExam.update({
      where: { id: req.params.examId },
      data: {
        title,
        description,
        totalPoints,
        timeLimit,
        maxTabSwitch,
        isPublished
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

// DELETE /api/admin/program-exams/exam/:examId - Delete exam
router.delete('/exam/:examId', async (req, res) => {
  try {
    await prisma.programExam.delete({
      where: { id: req.params.examId }
    })
    res.json({ message: 'Exam deleted' })
  } catch (error) {
    console.error('Delete exam error:', error)
    res.status(500).json({ error: 'Failed to delete exam' })
  }
})

// PUT /api/admin/program-exams/exam/:examId/publish - Toggle publish
router.put('/exam/:examId/publish', async (req, res) => {
  try {
    const exam = await prisma.programExam.findUnique({
      where: { id: req.params.examId }
    })
    
    const updated = await prisma.programExam.update({
      where: { id: req.params.examId },
      data: { isPublished: !exam.isPublished }
    })
    
    res.json(updated)
  } catch (error) {
    console.error('Toggle publish error:', error)
    res.status(500).json({ error: 'Failed to toggle publish' })
  }
})

// ============ QUESTION CRUD ============

// POST /api/admin/program-exams/exam/:examId/questions - Add question
router.post('/exam/:examId/questions', async (req, res) => {
  try {
    const { question, points, choices } = req.body
    const { examId } = req.params
    
    // Get max order
    const maxOrder = await prisma.programExamQuestion.aggregate({
      where: { examId },
      _max: { order: true }
    })
    
    const newQuestion = await prisma.programExamQuestion.create({
      data: {
        examId,
        question,
        points: points || 10,
        order: (maxOrder._max.order || 0) + 1,
        choices: {
          create: choices?.map((c, idx) => ({
            text: c.text,
            isCorrect: c.isCorrect || false,
            order: idx
          })) || []
        }
      },
      include: { choices: { orderBy: { order: 'asc' } } }
    })
    
    // Update exam total points
    await updateExamTotalPoints(examId)
    
    res.status(201).json(newQuestion)
  } catch (error) {
    console.error('Add question error:', error)
    res.status(500).json({ error: 'Failed to add question' })
  }
})

// PUT /api/admin/program-exams/questions/:questionId - Update question
router.put('/questions/:questionId', async (req, res) => {
  try {
    const { question, points, choices } = req.body
    const { questionId } = req.params
    
    // Get current question to find examId
    const current = await prisma.programExamQuestion.findUnique({
      where: { id: questionId }
    })
    
    // Delete existing choices
    await prisma.programExamChoice.deleteMany({
      where: { questionId }
    })
    
    // Update question and create new choices
    const updated = await prisma.programExamQuestion.update({
      where: { id: questionId },
      data: {
        question,
        points,
        choices: {
          create: choices?.map((c, idx) => ({
            text: c.text,
            isCorrect: c.isCorrect || false,
            order: idx
          })) || []
        }
      },
      include: { choices: { orderBy: { order: 'asc' } } }
    })
    
    // Update exam total points
    await updateExamTotalPoints(current.examId)
    
    res.json(updated)
  } catch (error) {
    console.error('Update question error:', error)
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// DELETE /api/admin/program-exams/questions/:questionId - Delete question
router.delete('/questions/:questionId', async (req, res) => {
  try {
    const question = await prisma.programExamQuestion.findUnique({
      where: { id: req.params.questionId }
    })
    
    await prisma.programExamQuestion.delete({
      where: { id: req.params.questionId }
    })
    
    // Update exam total points
    if (question) {
      await updateExamTotalPoints(question.examId)
    }
    
    res.json({ message: 'Question deleted' })
  } catch (error) {
    console.error('Delete question error:', error)
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// PUT /api/admin/program-exams/exam/:examId/questions/reorder - Reorder questions
router.put('/exam/:examId/questions/reorder', async (req, res) => {
  try {
    const { questionIds } = req.body
    
    await Promise.all(
      questionIds.map((id, index) =>
        prisma.programExamQuestion.update({
          where: { id },
          data: { order: index }
        })
      )
    )
    
    res.json({ message: 'Questions reordered' })
  } catch (error) {
    console.error('Reorder questions error:', error)
    res.status(500).json({ error: 'Failed to reorder questions' })
  }
})

// PUT /api/admin/program-exams/exam/:examId/questions/batch - Batch save all questions
router.put('/exam/:examId/questions/batch', async (req, res) => {
  try {
    const { examId } = req.params
    const { questions, deletedQuestionIds } = req.body

    // Verify exam exists
    const exam = await prisma.programExam.findUnique({
      where: { id: examId }
    })

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    // Delete removed questions
    if (deletedQuestionIds && deletedQuestionIds.length > 0) {
      await prisma.programExamQuestion.deleteMany({
        where: { id: { in: deletedQuestionIds } }
      })
    }

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      
      if (q.id) {
        // Update existing question
        // First delete old choices
        await prisma.programExamChoice.deleteMany({
          where: { questionId: q.id }
        })
        
        // Update question and create new choices
        await prisma.programExamQuestion.update({
          where: { id: q.id },
          data: {
            question: q.question,
            points: q.points,
            order: i + 1,
            choices: {
              create: q.choices.map((c, idx) => ({
                text: c.text,
                isCorrect: c.isCorrect,
                order: idx + 1
              }))
            }
          }
        })
      } else {
        // Create new question
        await prisma.programExamQuestion.create({
          data: {
            examId,
            question: q.question,
            points: q.points,
            order: i + 1,
            choices: {
              create: q.choices.map((c, idx) => ({
                text: c.text,
                isCorrect: c.isCorrect,
                order: idx + 1
              }))
            }
          }
        })
      }
    }

    // Update exam total points
    await updateExamTotalPoints(examId)

    // Return updated exam
    const updatedExam = await prisma.programExam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: { choices: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' }
        }
      }
    })

    res.json(updatedExam)
  } catch (error) {
    console.error('Batch save questions error:', error)
    res.status(500).json({ error: 'Failed to save questions' })
  }
})

// POST /api/admin/program-exams/exam/:examId/scores - Save scores for students
router.post('/exam/:examId/scores', async (req, res) => {
  try {
    const { examId } = req.params
    const { scores } = req.body // Array of { studentId, score, notes }

    // Verify exam exists
    const exam = await prisma.programExam.findUnique({
      where: { id: examId },
      include: { program: true }
    })

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    // Process each score
    for (const scoreData of scores) {
      // Check if attempt exists
      const existingAttempt = await prisma.programExamAttempt.findFirst({
        where: {
          examId,
          studentId: scoreData.studentId
        }
      })

      if (existingAttempt) {
        // Update existing attempt
        await prisma.programExamAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            score: scoreData.score,
            status: 'SUBMITTED',
            submittedAt: new Date()
          }
        })
      } else {
        // Create new attempt with score
        await prisma.programExamAttempt.create({
          data: {
            examId,
            studentId: scoreData.studentId,
            score: scoreData.score,
            status: 'SUBMITTED',
            submittedAt: new Date()
          }
        })
      }
    }

    res.json({ message: 'Scores saved successfully' })
  } catch (error) {
    console.error('Save scores error:', error)
    res.status(500).json({ error: 'Failed to save scores' })
  }
})

// ============ GRADES ============

// GET /api/admin/program-exams/:programId/grades - Get all grades for program
router.get('/:programId/grades', async (req, res) => {
  try {
    const { programId } = req.params
    
    // Get program with enrollments and exams
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
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
    
    if (!program) {
      return res.status(404).json({ error: 'Program not found' })
    }
    
    // Build grades for each student
    const grades = program.enrollments.map(enrollment => {
      const student = enrollment.student
      const studentId = student?.user?.student?.id
      
      const examScores = program.exams.map(exam => {
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
        odId: enrollment.studentId,
        name: student?.user?.profile?.fullName || 'Unknown',
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

// Helper function to update exam total points
async function updateExamTotalPoints(examId) {
  const questions = await prisma.programExamQuestion.findMany({
    where: { examId }
  })
  
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)
  
  await prisma.programExam.update({
    where: { id: examId },
    data: { totalPoints }
  })
}

export default router
