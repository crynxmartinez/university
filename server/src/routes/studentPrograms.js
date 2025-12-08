import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// All routes require STUDENT role
router.use(authenticate)
router.use(requireRole(['STUDENT']))

// GET /api/student-programs/enrolled - Get student's enrolled programs
router.get('/enrolled', async (req, res) => {
  try {
    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const enrollments = await prisma.programEnrollment.findMany({
      where: { studentId: req.user.id },
      include: {
        program: {
          include: {
            modules: {
              include: {
                lessons: { orderBy: { order: 'asc' } }
              },
              orderBy: { order: 'asc' }
            },
            sessions: {
              orderBy: { date: 'asc' }
            }
          }
        }
      }
    })

    res.json(enrollments.map(e => e.program))
  } catch (error) {
    console.error('Get enrolled programs error:', error)
    res.status(500).json({ error: 'Failed to fetch enrolled programs' })
  }
})

// GET /api/student-programs/:programId - Get program details for student
router.get('/:programId', async (req, res) => {
  try {
    const { programId } = req.params

    // Check enrollment
    const enrollment = await prisma.programEnrollment.findFirst({
      where: {
        programId,
        studentId: req.user.id,
        status: 'ACTIVE'
      }
    })

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this program' })
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        modules: {
          include: {
            lessons: { orderBy: { order: 'asc' } }
          },
          orderBy: { order: 'asc' }
        },
        sessions: {
          include: {
            lesson: true,
            exam: true,
            materials: true
          },
          orderBy: { date: 'asc' }
        },
        exams: {
          where: { isPublished: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    res.json(program)
  } catch (error) {
    console.error('Get program error:', error)
    res.status(500).json({ error: 'Failed to fetch program' })
  }
})

// GET /api/student-programs/:programId/sessions - Get upcoming sessions
router.get('/:programId/sessions', async (req, res) => {
  try {
    const { programId } = req.params

    const sessions = await prisma.programSession.findMany({
      where: { programId },
      include: {
        lesson: true,
        exam: true,
        materials: true
      },
      orderBy: { date: 'asc' }
    })

    res.json(sessions)
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

// GET /api/student-programs/:programId/exams/available - Get available exams
router.get('/:programId/exams/available', async (req, res) => {
  try {
    const { programId } = req.params

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const exams = await prisma.programExam.findMany({
      where: {
        programId,
        isPublished: true
      },
      include: {
        attempts: {
          where: { studentId: student.id },
          orderBy: { submittedAt: 'desc' }
        }
      }
    })

    // Format response
    const formattedExams = exams.map(exam => {
      const latestAttempt = exam.attempts[0]
      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        totalPoints: exam.totalPoints,
        timeLimit: exam.timeLimit,
        attemptCount: exam.attempts.length,
        latestScore: latestAttempt?.score || null,
        attempt: latestAttempt || null
      }
    })

    res.json(formattedExams)
  } catch (error) {
    console.error('Get available exams error:', error)
    res.status(500).json({ error: 'Failed to fetch exams' })
  }
})

// POST /api/student-programs/exams/:examId/start - Start exam attempt
router.post('/exams/:examId/start', async (req, res) => {
  try {
    const { examId } = req.params
    const { sessionId } = req.body

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const exam = await prisma.programExam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: { choices: { orderBy: { order: 'asc' } } },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!exam || !exam.isPublished) {
      return res.status(404).json({ error: 'Exam not found or not published' })
    }

    // Check for existing attempt in this session
    const existingAttempt = await prisma.programExamAttempt.findFirst({
      where: {
        examId,
        studentId: student.id,
        sessionId: sessionId || null
      }
    })

    if (existingAttempt) {
      if (existingAttempt.status === 'IN_PROGRESS') {
        // Return existing in-progress attempt
        return res.json({
          attemptId: existingAttempt.id,
          exam: {
            id: exam.id,
            title: exam.title,
            description: exam.description,
            timeLimit: exam.timeLimit,
            maxTabSwitch: exam.maxTabSwitch,
            questions: exam.questions.map(q => ({
              id: q.id,
              question: q.question,
              points: q.points,
              choices: q.choices.map(c => ({ id: c.id, text: c.text }))
            }))
          },
          startedAt: existingAttempt.startedAt,
          tabSwitchCount: existingAttempt.tabSwitchCount
        })
      } else {
        return res.status(400).json({ error: 'Already completed this exam in this session' })
      }
    }

    // Count previous attempts
    const attemptCount = await prisma.programExamAttempt.count({
      where: { examId, studentId: student.id }
    })

    // Create new attempt
    const attempt = await prisma.programExamAttempt.create({
      data: {
        examId,
        studentId: student.id,
        sessionId: sessionId || null,
        attemptNumber: attemptCount + 1,
        status: 'IN_PROGRESS'
      }
    })

    res.json({
      attemptId: attempt.id,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        timeLimit: exam.timeLimit,
        maxTabSwitch: exam.maxTabSwitch,
        questions: exam.questions.map(q => ({
          id: q.id,
          question: q.question,
          points: q.points,
          choices: q.choices.map(c => ({ id: c.id, text: c.text }))
        }))
      },
      startedAt: attempt.startedAt,
      tabSwitchCount: 0
    })
  } catch (error) {
    console.error('Start exam error:', error)
    res.status(500).json({ error: 'Failed to start exam' })
  }
})

// POST /api/student-programs/exams/attempt/:attemptId/answer - Save answer
router.post('/exams/attempt/:attemptId/answer', async (req, res) => {
  try {
    const { attemptId } = req.params
    const { questionId, choiceId } = req.body

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    })

    const attempt = await prisma.programExamAttempt.findFirst({
      where: {
        id: attemptId,
        studentId: student.id,
        status: 'IN_PROGRESS'
      }
    })

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found or already submitted' })
    }

    // Get correct answer
    const choice = choiceId ? await prisma.programExamChoice.findUnique({
      where: { id: choiceId }
    }) : null

    // Upsert answer
    await prisma.programExamAnswer.upsert({
      where: {
        attemptId_questionId: { attemptId, questionId }
      },
      update: {
        choiceId,
        isCorrect: choice?.isCorrect || false
      },
      create: {
        attemptId,
        questionId,
        choiceId,
        isCorrect: choice?.isCorrect || false
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Save answer error:', error)
    res.status(500).json({ error: 'Failed to save answer' })
  }
})

// POST /api/student-programs/exams/attempt/:attemptId/submit - Submit exam
router.post('/exams/attempt/:attemptId/submit', async (req, res) => {
  try {
    const { attemptId } = req.params

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    })

    const attempt = await prisma.programExamAttempt.findFirst({
      where: {
        id: attemptId,
        studentId: student.id
      },
      include: {
        exam: {
          include: {
            questions: true
          }
        },
        answers: true
      }
    })

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' })
    }

    if (attempt.status === 'SUBMITTED') {
      return res.status(400).json({ error: 'Already submitted' })
    }

    // Calculate score
    let score = 0
    for (const question of attempt.exam.questions) {
      const answer = attempt.answers.find(a => a.questionId === question.id)
      if (answer?.isCorrect) {
        score += question.points
      }
    }

    // Update attempt
    const updated = await prisma.programExamAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        score
      }
    })

    res.json({
      score,
      totalPoints: attempt.exam.totalPoints,
      percentage: (score / attempt.exam.totalPoints) * 100
    })
  } catch (error) {
    console.error('Submit exam error:', error)
    res.status(500).json({ error: 'Failed to submit exam' })
  }
})

// POST /api/student-programs/exams/attempt/:attemptId/tab-switch - Record tab switch
router.post('/exams/attempt/:attemptId/tab-switch', async (req, res) => {
  try {
    const { attemptId } = req.params

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    })

    const attempt = await prisma.programExamAttempt.findFirst({
      where: {
        id: attemptId,
        studentId: student.id,
        status: 'IN_PROGRESS'
      },
      include: { exam: true }
    })

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' })
    }

    const newCount = attempt.tabSwitchCount + 1
    const flagged = newCount >= attempt.exam.maxTabSwitch

    await prisma.programExamAttempt.update({
      where: { id: attemptId },
      data: {
        tabSwitchCount: newCount,
        status: flagged ? 'FLAGGED' : 'IN_PROGRESS'
      }
    })

    res.json({
      tabSwitchCount: newCount,
      maxTabSwitch: attempt.exam.maxTabSwitch,
      flagged
    })
  } catch (error) {
    console.error('Tab switch error:', error)
    res.status(500).json({ error: 'Failed to record tab switch' })
  }
})

// GET /api/student-programs/exams/attempt/:attemptId/result - Get exam result
router.get('/exams/attempt/:attemptId/result', async (req, res) => {
  try {
    const { attemptId } = req.params

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    })

    const attempt = await prisma.programExamAttempt.findFirst({
      where: {
        id: attemptId,
        studentId: student.id
      },
      include: {
        exam: {
          include: {
            questions: {
              include: { choices: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' }
            }
          }
        },
        answers: true
      }
    })

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' })
    }

    // Format questions with answers (hide correct answers for retakes)
    const questions = attempt.exam.questions.map(q => {
      const answer = attempt.answers.find(a => a.questionId === q.id)
      return {
        id: q.id,
        question: q.question,
        points: q.points,
        choices: q.choices.map(c => {
          const isSelected = answer?.choiceId === c.id
          return {
            id: c.id,
            text: c.text,
            isSelected,
            isCorrect: isSelected ? c.isCorrect : undefined
          }
        }),
        selectedChoiceId: answer?.choiceId,
        isCorrect: answer?.isCorrect || false,
        earnedPoints: answer?.isCorrect ? q.points : 0
      }
    })

    res.json({
      examId: attempt.examId,
      examTitle: attempt.exam.title,
      score: attempt.score,
      totalPoints: attempt.exam.totalPoints,
      percentage: attempt.score !== null ? (attempt.score / attempt.exam.totalPoints) * 100 : 0,
      passed: attempt.score !== null ? (attempt.score / attempt.exam.totalPoints) >= 0.75 : false,
      submittedAt: attempt.submittedAt,
      questions
    })
  } catch (error) {
    console.error('Get result error:', error)
    res.status(500).json({ error: 'Failed to fetch result' })
  }
})

// GET /api/student-programs/:programId/grade - Get student's grade for program
router.get('/:programId/grade', async (req, res) => {
  try {
    const { programId } = req.params

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        exams: {
          where: { isPublished: true },
          include: {
            attempts: {
              where: {
                studentId: student.id,
                status: 'SUBMITTED'
              },
              orderBy: { submittedAt: 'desc' }
            }
          }
        }
      }
    })

    if (!program) {
      return res.status(404).json({ error: 'Program not found' })
    }

    // Calculate grade using latest attempt
    let totalEarned = 0
    let totalPossible = 0
    const examScores = program.exams.map(exam => {
      const latestAttempt = exam.attempts[0]
      const score = latestAttempt?.score ?? null

      if (score !== null) {
        totalEarned += score
        totalPossible += exam.totalPoints
      }

      return {
        examId: exam.id,
        examTitle: exam.title,
        totalPoints: exam.totalPoints,
        score,
        attemptCount: exam.attempts.length
      }
    })

    const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null
    const passed = percentage !== null ? percentage >= 75 : null

    res.json({
      programId,
      programName: program.name,
      examScores,
      totalEarned,
      totalPossible,
      percentage,
      passed
    })
  } catch (error) {
    console.error('Get grade error:', error)
    res.status(500).json({ error: 'Failed to fetch grade' })
  }
})

// POST /api/student-programs/sessions/:sessionId/join - Mark attendance
router.post('/sessions/:sessionId/join', async (req, res) => {
  try {
    const { sessionId } = req.params

    const student = await prisma.student.findFirst({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    await prisma.programAttendance.upsert({
      where: {
        sessionId_studentId: { sessionId, studentId: student.id }
      },
      update: {
        status: 'PRESENT',
        joinedAt: new Date()
      },
      create: {
        sessionId,
        studentId: student.id,
        status: 'PRESENT',
        joinedAt: new Date(),
        markedBy: 'AUTO'
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Join session error:', error)
    res.status(500).json({ error: 'Failed to mark attendance' })
  }
})

export default router
