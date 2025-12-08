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

// ============ EXAM TEMPLATE ROUTES ============

// GET /api/exams/course/:courseId - Get all exams for a course
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params

    const exams = await prisma.exam.findMany({
      where: { courseId },
      include: {
        scores: {
          include: {
            student: {
              include: {
                user: {
                  include: { profile: true }
                }
              }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    res.json(exams)
  } catch (error) {
    console.error('Get exams error:', error.message, error.stack)
    res.status(500).json({ error: 'Failed to get exams', details: error.message })
  }
})

// POST /api/exams - Create a new exam
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can create exams' })
    }

    const { courseId, title, description, totalPoints } = req.body

    // Verify teacher owns this course
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to add exams to this course' })
    }

    // Get the next order number
    const lastExam = await prisma.exam.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' }
    })
    const nextOrder = (lastExam?.order ?? -1) + 1

    const exam = await prisma.exam.create({
      data: {
        courseId,
        title,
        description,
        totalPoints: totalPoints || 100,
        order: nextOrder
      }
    })

    res.status(201).json(exam)
  } catch (error) {
    console.error('Create exam error:', error.message, error.stack)
    res.status(500).json({ error: 'Failed to create exam', details: error.message })
  }
})

// PUT /api/exams/:id - Update an exam
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can update exams' })
    }

    const { id } = req.params
    const { title, description, totalPoints } = req.body

    // Verify exam exists and teacher owns the course
    const existing = await prisma.exam.findUnique({
      where: { id },
      include: { course: true }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    if (existing.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to update this exam' })
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        title,
        description,
        totalPoints
      }
    })

    res.json(exam)
  } catch (error) {
    console.error('Update exam error:', error)
    res.status(500).json({ error: 'Failed to update exam' })
  }
})

// DELETE /api/exams/:id - Delete an exam
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can delete exams' })
    }

    const { id } = req.params

    // Verify exam exists and teacher owns the course
    const existing = await prisma.exam.findUnique({
      where: { id },
      include: { course: true }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    if (existing.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to delete this exam' })
    }

    await prisma.exam.delete({ where: { id } })

    res.json({ message: 'Exam deleted' })
  } catch (error) {
    console.error('Delete exam error:', error)
    res.status(500).json({ error: 'Failed to delete exam' })
  }
})

// PUT /api/exams/reorder - Reorder exams
router.put('/reorder', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can reorder exams' })
    }

    const { courseId, examIds } = req.body

    // Verify teacher owns this course
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Update order for each exam
    await Promise.all(
      examIds.map((id, index) =>
        prisma.exam.update({
          where: { id },
          data: { order: index }
        })
      )
    )

    res.json({ message: 'Exams reordered' })
  } catch (error) {
    console.error('Reorder exams error:', error)
    res.status(500).json({ error: 'Failed to reorder exams' })
  }
})

// ============ EXAM SCORE ROUTES ============

// POST /api/exams/:examId/scores - Save scores for an exam (batch)
router.post('/:examId/scores', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can enter scores' })
    }

    const { examId } = req.params
    const { scores } = req.body // Array of { studentId, score, notes? }

    // Verify exam exists and teacher owns the course
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true }
    })

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    if (exam.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to enter scores for this exam' })
    }

    // Upsert scores for each student
    const results = await Promise.all(
      scores.map(({ studentId, score, notes }) =>
        prisma.examScore.upsert({
          where: {
            examId_studentId: { examId, studentId }
          },
          update: {
            score,
            notes,
            gradedAt: new Date()
          },
          create: {
            examId,
            studentId,
            score,
            notes
          }
        })
      )
    )

    res.json(results)
  } catch (error) {
    console.error('Save scores error:', error)
    res.status(500).json({ error: 'Failed to save scores' })
  }
})

// GET /api/exams/grades/:courseId - Get all grades for a course (gradebook view)
router.get('/grades/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params

    // Get course with exams and enrolled students
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        exams: {
          orderBy: { order: 'asc' },
          include: {
            scores: true
          }
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  include: { profile: true }
                }
              }
            }
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Calculate grades for each student
    const grades = course.enrollments.map(enrollment => {
      const student = enrollment.student
      
      // Get all scores for this student
      let totalEarned = 0
      let totalPossible = 0
      const examScores = course.exams.map(exam => {
        const scoreRecord = exam.scores.find(s => s.studentId === student.id)
        const score = scoreRecord?.score ?? null
        
        if (score !== null) {
          totalEarned += score
          totalPossible += exam.totalPoints
        }
        
        return {
          examId: exam.id,
          examTitle: exam.title,
          totalPoints: exam.totalPoints,
          score,
          notes: scoreRecord?.notes
        }
      })

      // Calculate percentage (only if there are graded exams)
      const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null
      const passed = percentage !== null ? percentage >= 75 : null

      return {
        studentId: student.id,
        studentName: student.user.profile?.fullName || student.user.email,
        email: student.user.email,
        examScores,
        totalEarned,
        totalPossible,
        percentage: percentage !== null ? Math.round(percentage * 10) / 10 : null,
        passed
      }
    })

    res.json({
      courseId: course.id,
      courseName: course.name,
      exams: course.exams.map(e => ({ id: e.id, title: e.title, totalPoints: e.totalPoints })),
      grades,
      passingGrade: 75
    })
  } catch (error) {
    console.error('Get grades error:', error)
    res.status(500).json({ error: 'Failed to get grades' })
  }
})

// GET /api/exams/student-grade/:courseId - Get grade for current student
router.get('/student-grade/:courseId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can view their own grades' })
    }

    const { courseId } = req.params
    const studentId = req.user.student.id

    // Get course with exams and attempts
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        exams: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          include: {
            scores: {
              where: { studentId }
            },
            attempts: {
              where: { studentId, status: 'SUBMITTED' },
              orderBy: { submittedAt: 'desc' } // Latest first
            }
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Calculate grade using LATEST attempt score (not ExamScore table)
    let totalEarned = 0
    let totalPossible = 0
    const examScores = course.exams.map(exam => {
      // Use latest attempt score (supports retakes)
      const latestAttempt = exam.attempts[0]
      const score = latestAttempt?.score ?? null
      const attemptCount = exam.attempts.length
      
      if (score !== null) {
        totalEarned += score
        totalPossible += exam.totalPoints
      }
      
      return {
        examId: exam.id,
        examTitle: exam.title,
        totalPoints: exam.totalPoints,
        score,
        attemptCount,
        attemptNumber: latestAttempt?.attemptNumber || 0,
        gradedAt: latestAttempt?.submittedAt,
        // Include attempt history for transparency
        attemptHistory: exam.attempts.map(a => ({
          attemptNumber: a.attemptNumber,
          score: a.score,
          submittedAt: a.submittedAt
        }))
      }
    })

    const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : null
    const passed = percentage !== null ? percentage >= 75 : null

    res.json({
      courseId: course.id,
      courseName: course.name,
      examScores,
      totalEarned,
      totalPossible,
      percentage: percentage !== null ? Math.round(percentage * 10) / 10 : null,
      passed,
      passingGrade: 75
    })
  } catch (error) {
    console.error('Get student grade error:', error)
    res.status(500).json({ error: 'Failed to get grade' })
  }
})

// ============ EXAM SETTINGS ROUTES ============

// PUT /api/exams/:id/settings - Update exam settings (time limit, publish, etc.)
router.put('/:id/settings', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can update exam settings' })
    }

    const { id } = req.params
    const { timeLimit, maxTabSwitch, isPublished } = req.body

    // Verify exam exists and teacher owns the course
    const existing = await prisma.exam.findUnique({
      where: { id },
      include: { course: true }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    if (existing.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized to update this exam' })
    }

    const exam = await prisma.exam.update({
      where: { id },
      data: {
        timeLimit: timeLimit !== undefined ? timeLimit : existing.timeLimit,
        maxTabSwitch: maxTabSwitch !== undefined ? maxTabSwitch : existing.maxTabSwitch,
        isPublished: isPublished !== undefined ? isPublished : existing.isPublished
      }
    })

    res.json(exam)
  } catch (error) {
    console.error('Update exam settings error:', error)
    res.status(500).json({ error: 'Failed to update exam settings' })
  }
})

// ============ EXAM QUESTION ROUTES ============

// GET /api/exams/:examId/questions - Get all questions for an exam
router.get('/:examId/questions', authenticate, async (req, res) => {
  try {
    const { examId } = req.params

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: true,
        questions: {
          orderBy: { order: 'asc' },
          include: {
            choices: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    // If student, hide correct answers
    if (req.user.role === 'STUDENT') {
      exam.questions = exam.questions.map(q => ({
        ...q,
        choices: q.choices.map(c => ({
          ...c,
          isCorrect: undefined // Hide correct answer from students
        }))
      }))
    }

    res.json(exam)
  } catch (error) {
    console.error('Get questions error:', error)
    res.status(500).json({ error: 'Failed to get questions' })
  }
})

// POST /api/exams/:examId/questions - Add a question to an exam
router.post('/:examId/questions', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can add questions' })
    }

    const { examId } = req.params
    const { question, points, choices } = req.body

    // Verify exam exists and teacher owns the course
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true }
    })

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    if (exam.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Get next order
    const lastQuestion = await prisma.examQuestion.findFirst({
      where: { examId },
      orderBy: { order: 'desc' }
    })
    const nextOrder = (lastQuestion?.order ?? -1) + 1

    // Create question with choices
    const newQuestion = await prisma.examQuestion.create({
      data: {
        examId,
        question,
        points: points || 10,
        order: nextOrder,
        choices: {
          create: (choices || []).map((c, idx) => ({
            text: c.text,
            isCorrect: c.isCorrect || false,
            order: idx
          }))
        }
      },
      include: {
        choices: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Update exam total points
    await updateExamTotalPoints(examId)

    res.status(201).json(newQuestion)
  } catch (error) {
    console.error('Add question error:', error)
    res.status(500).json({ error: 'Failed to add question' })
  }
})

// PUT /api/exams/questions/:questionId - Update a question
router.put('/questions/:questionId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can update questions' })
    }

    const { questionId } = req.params
    const { question, points, choices } = req.body

    // Verify question exists and teacher owns the course
    const existing = await prisma.examQuestion.findUnique({
      where: { id: questionId },
      include: { exam: { include: { course: true } } }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Question not found' })
    }

    if (existing.exam.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Update question
    const updatedQuestion = await prisma.examQuestion.update({
      where: { id: questionId },
      data: {
        question: question !== undefined ? question : existing.question,
        points: points !== undefined ? points : existing.points
      }
    })

    // If choices provided, delete old and create new
    if (choices) {
      await prisma.examChoice.deleteMany({ where: { questionId } })
      await prisma.examChoice.createMany({
        data: choices.map((c, idx) => ({
          questionId,
          text: c.text,
          isCorrect: c.isCorrect || false,
          order: idx
        }))
      })
    }

    // Get updated question with choices
    const result = await prisma.examQuestion.findUnique({
      where: { id: questionId },
      include: {
        choices: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Update exam total points
    await updateExamTotalPoints(existing.examId)

    res.json(result)
  } catch (error) {
    console.error('Update question error:', error)
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// DELETE /api/exams/questions/:questionId - Delete a question
router.delete('/questions/:questionId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can delete questions' })
    }

    const { questionId } = req.params

    // Verify question exists and teacher owns the course
    const existing = await prisma.examQuestion.findUnique({
      where: { id: questionId },
      include: { exam: { include: { course: true } } }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Question not found' })
    }

    if (existing.exam.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.examQuestion.delete({ where: { id: questionId } })

    // Update exam total points
    await updateExamTotalPoints(existing.examId)

    res.json({ message: 'Question deleted' })
  } catch (error) {
    console.error('Delete question error:', error)
    res.status(500).json({ error: 'Failed to delete question' })
  }
})

// PUT /api/exams/:examId/questions/reorder - Reorder questions
router.put('/:examId/questions/reorder', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can reorder questions' })
    }

    const { examId } = req.params
    const { questionIds } = req.body

    // Verify exam exists and teacher owns the course
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true }
    })

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    if (exam.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Update order for each question
    await Promise.all(
      questionIds.map((id, index) =>
        prisma.examQuestion.update({
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

// PUT /api/exams/:examId/questions/batch - Batch save all questions
router.put('/:examId/questions/batch', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can update questions' })
    }

    const { examId } = req.params
    const { questions, deletedQuestionIds } = req.body

    // Verify exam exists and teacher owns the course
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { course: true }
    })

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    if (exam.course.teacherId !== req.user.teacher.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Delete removed questions
    if (deletedQuestionIds && deletedQuestionIds.length > 0) {
      await prisma.examQuestion.deleteMany({
        where: { id: { in: deletedQuestionIds } }
      })
    }

    // Process each question
    for (const q of questions) {
      if (q.id) {
        // Update existing question
        await prisma.examQuestion.update({
          where: { id: q.id },
          data: {
            question: q.question,
            points: q.points,
            order: q.order
          }
        })

        // Delete old choices and create new ones
        await prisma.examChoice.deleteMany({ where: { questionId: q.id } })
        if (q.choices && q.choices.length > 0) {
          await prisma.examChoice.createMany({
            data: q.choices.map((c, idx) => ({
              questionId: q.id,
              text: c.text,
              isCorrect: c.isCorrect || false,
              order: c.order !== undefined ? c.order : idx
            }))
          })
        }
      } else {
        // Create new question
        const newQuestion = await prisma.examQuestion.create({
          data: {
            examId,
            question: q.question,
            points: q.points || 10,
            order: q.order
          }
        })

        // Create choices
        if (q.choices && q.choices.length > 0) {
          await prisma.examChoice.createMany({
            data: q.choices.map((c, idx) => ({
              questionId: newQuestion.id,
              text: c.text,
              isCorrect: c.isCorrect || false,
              order: c.order !== undefined ? c.order : idx
            }))
          })
        }
      }
    }

    // Update total points
    await updateExamTotalPoints(examId)

    // Return updated exam with questions
    const updatedExam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            choices: { orderBy: { order: 'asc' } }
          }
        }
      }
    })

    res.json(updatedExam)
  } catch (error) {
    console.error('Batch save questions error:', error)
    res.status(500).json({ error: 'Failed to save questions', details: error.message })
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
    data: { totalPoints: totalPoints || 100 }
  })
}

// ============ STUDENT EXAM TAKING ROUTES ============

// GET /api/exams/student/available/:courseId - Get available exams for student
router.get('/student/available/:courseId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    const { courseId } = req.params
    const studentId = req.user.student.id

    // Check if student is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId, studentId }
    })

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' })
    }

    // Get published exams with attempt status
    const exams = await prisma.exam.findMany({
      where: { 
        courseId,
        isPublished: true
      },
      include: {
        questions: {
          select: { id: true }
        },
        attempts: {
          where: { studentId },
          orderBy: { createdAt: 'desc' } // Get all attempts, newest first
        }
      },
      orderBy: { order: 'asc' }
    })

    const result = exams.map(exam => {
      // Get latest attempt (for current status)
      const latestAttempt = exam.attempts[0]
      // Get all completed attempts for history
      const completedAttempts = exam.attempts.filter(a => a.status === 'SUBMITTED')
      // Get latest score (what counts for grade)
      const latestScore = completedAttempts[0]?.score || null
      
      return {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        totalPoints: exam.totalPoints,
        timeLimit: exam.timeLimit,
        maxTabSwitch: exam.maxTabSwitch,
        questionCount: exam.questions.length,
        attemptCount: exam.attempts.length,
        // Latest attempt info
        attempt: latestAttempt ? {
          id: latestAttempt.id,
          status: latestAttempt.status,
          score: latestAttempt.score,
          attemptNumber: latestAttempt.attemptNumber,
          submittedAt: latestAttempt.submittedAt,
          sessionId: latestAttempt.sessionId
        } : null,
        // Latest score (what counts for grade)
        latestScore,
        // All attempts history
        attemptHistory: completedAttempts.map(a => ({
          attemptNumber: a.attemptNumber,
          score: a.score,
          submittedAt: a.submittedAt
        }))
      }
    })

    res.json(result)
  } catch (error) {
    console.error('Get available exams error:', error)
    res.status(500).json({ error: 'Failed to get available exams' })
  }
})

// POST /api/exams/:examId/start - Start an exam attempt
router.post('/:examId/start', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can take exams' })
    }

    const { examId } = req.params
    const { sessionId } = req.body // Optional: links attempt to specific scheduled session
    const studentId = req.user.student.id

    // Get exam with questions
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: true,
        questions: {
          orderBy: { order: 'asc' },
          include: {
            choices: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' })
    }

    if (!exam.isPublished) {
      return res.status(403).json({ error: 'Exam is not available' })
    }

    // Check if student is enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId: exam.courseId, studentId }
    })

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' })
    }

    // Check for existing attempt FOR THIS SESSION
    const existingAttempt = await prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId,
        sessionId: sessionId || null
      }
    })

    if (existingAttempt) {
      if (existingAttempt.status !== 'IN_PROGRESS') {
        return res.status(400).json({ error: 'You have already completed this exam for this session' })
      }
      // Return existing in-progress attempt
      return res.json({
        attempt: existingAttempt,
        exam: {
          ...exam,
          questions: exam.questions.map(q => ({
            ...q,
            choices: q.choices.map(c => ({
              id: c.id,
              text: c.text,
              order: c.order
              // Hide isCorrect
            }))
          }))
        }
      })
    }

    // Count previous attempts for this exam (for attemptNumber)
    const previousAttempts = await prisma.examAttempt.count({
      where: { examId, studentId }
    })

    // Get previous best score for warning
    const previousBest = await prisma.examAttempt.findFirst({
      where: { examId, studentId, status: 'SUBMITTED' },
      orderBy: { score: 'desc' }
    })

    // Create new attempt
    const attempt = await prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        sessionId: sessionId || null,
        attemptNumber: previousAttempts + 1,
        startedAt: new Date()
      }
    })

    // Return exam with questions (hide correct answers)
    res.json({
      attempt,
      previousScore: previousBest?.score || null,
      attemptNumber: previousAttempts + 1,
      exam: {
        ...exam,
        questions: exam.questions.map(q => ({
          ...q,
          choices: q.choices.map(c => ({
            id: c.id,
            text: c.text,
            order: c.order
            // Hide isCorrect
          }))
        }))
      }
    })
  } catch (error) {
    console.error('Start exam error:', error.message, error.code)
    res.status(500).json({ error: 'Failed to start exam', details: error.message })
  }
})

// PUT /api/exams/attempt/:attemptId/answer - Save an answer
router.put('/attempt/:attemptId/answer', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can answer questions' })
    }

    const { attemptId } = req.params
    const { questionId, choiceId } = req.body
    const studentId = req.user.student.id

    // Verify attempt belongs to student and is in progress
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId }
    })

    if (!attempt || attempt.studentId !== studentId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Exam already submitted' })
    }

    // Check if time expired
    if (attempt.startedAt) {
      const exam = await prisma.exam.findUnique({ where: { id: attempt.examId } })
      if (exam.timeLimit) {
        const elapsed = (Date.now() - new Date(attempt.startedAt).getTime()) / 1000 / 60
        if (elapsed > exam.timeLimit) {
          return res.status(400).json({ error: 'Time expired' })
        }
      }
    }

    // Upsert answer
    const answer = await prisma.examAnswer.upsert({
      where: {
        attemptId_questionId: { attemptId, questionId }
      },
      update: { choiceId },
      create: {
        attemptId,
        questionId,
        choiceId
      }
    })

    res.json(answer)
  } catch (error) {
    console.error('Save answer error:', error)
    res.status(500).json({ error: 'Failed to save answer' })
  }
})

// PUT /api/exams/attempt/:attemptId/tab-switch - Record a tab switch
router.put('/attempt/:attemptId/tab-switch', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    const { attemptId } = req.params
    const studentId = req.user.student.id

    // Verify attempt belongs to student
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: true }
    })

    if (!attempt || attempt.studentId !== studentId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Exam already submitted' })
    }

    // Increment tab switch count
    const newCount = attempt.tabSwitchCount + 1

    // Check if exceeded max
    if (newCount >= attempt.exam.maxTabSwitch) {
      // Auto-submit with FLAGGED status
      const result = await submitExam(attemptId, 'FLAGGED')
      return res.json({ 
        flagged: true, 
        message: 'Exam auto-submitted due to too many tab switches',
        result 
      })
    }

    // Update count
    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: { tabSwitchCount: newCount }
    })

    res.json({ 
      tabSwitchCount: newCount, 
      remaining: attempt.exam.maxTabSwitch - newCount 
    })
  } catch (error) {
    console.error('Tab switch error:', error)
    res.status(500).json({ error: 'Failed to record tab switch' })
  }
})

// POST /api/exams/attempt/:attemptId/submit - Submit an exam
router.post('/attempt/:attemptId/submit', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can submit exams' })
    }

    const { attemptId } = req.params
    const studentId = req.user.student.id

    // Verify attempt belongs to student
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId }
    })

    if (!attempt || attempt.studentId !== studentId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Exam already submitted' })
    }

    const result = await submitExam(attemptId, 'SUBMITTED')
    res.json(result)
  } catch (error) {
    console.error('Submit exam error:', error)
    res.status(500).json({ error: 'Failed to submit exam' })
  }
})

// Helper function to submit exam and calculate score
async function submitExam(attemptId, status) {
  // Get attempt with answers
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: {
            include: {
              choices: true
            }
          }
        }
      },
      answers: true
    }
  })

  // Calculate score
  let totalEarned = 0
  const totalPossible = attempt.exam.questions.reduce((sum, q) => sum + q.points, 0)

  // Grade each answer
  for (const question of attempt.exam.questions) {
    const answer = attempt.answers.find(a => a.questionId === question.id)
    const correctChoice = question.choices.find(c => c.isCorrect)
    
    const isCorrect = answer?.choiceId === correctChoice?.id
    
    if (isCorrect) {
      totalEarned += question.points
    }

    // Update answer with isCorrect
    if (answer) {
      await prisma.examAnswer.update({
        where: { id: answer.id },
        data: { isCorrect }
      })
    }
  }

  // Update attempt
  const updatedAttempt = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status,
      submittedAt: new Date(),
      score: totalEarned
    }
  })

  // Create/update ExamScore for gradebook
  await prisma.examScore.upsert({
    where: {
      examId_studentId: {
        examId: attempt.examId,
        studentId: attempt.studentId
      }
    },
    update: {
      score: totalEarned,
      gradedAt: new Date()
    },
    create: {
      examId: attempt.examId,
      studentId: attempt.studentId,
      score: totalEarned
    }
  })

  // Calculate percentage
  const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0

  return {
    attemptId,
    status,
    score: totalEarned,
    totalPossible,
    percentage: Math.round(percentage * 10) / 10,
    passed: percentage >= 75
  }
}

// GET /api/exams/attempt/:attemptId/result - Get exam result
router.get('/attempt/:attemptId/result', authenticate, async (req, res) => {
  try {
    const { attemptId } = req.params

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              include: {
                choices: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        answers: true,
        student: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      }
    })

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' })
    }

    // Check authorization
    if (req.user.role === 'STUDENT' && attempt.studentId !== req.user.student?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (attempt.status === 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Exam not yet submitted' })
    }

    // Build result with correct answers shown
    const questions = attempt.exam.questions.map(q => {
      const answer = attempt.answers.find(a => a.questionId === q.id)
      const correctChoice = q.choices.find(c => c.isCorrect)
      
      return {
        id: q.id,
        question: q.question,
        points: q.points,
        choices: q.choices.map(c => ({
          id: c.id,
          text: c.text,
          isCorrect: c.isCorrect,
          isSelected: answer?.choiceId === c.id
        })),
        selectedChoiceId: answer?.choiceId,
        correctChoiceId: correctChoice?.id,
        isCorrect: answer?.isCorrect || false,
        earnedPoints: answer?.isCorrect ? q.points : 0
      }
    })

    const totalPossible = attempt.exam.totalPoints

    res.json({
      attemptId: attempt.id,
      examTitle: attempt.exam.title,
      status: attempt.status,
      score: attempt.score,
      totalPossible,
      percentage: totalPossible > 0 ? Math.round((attempt.score / totalPossible) * 1000) / 10 : 0,
      passed: totalPossible > 0 ? (attempt.score / totalPossible) * 100 >= 75 : false,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      tabSwitchCount: attempt.tabSwitchCount,
      questions,
      studentName: attempt.student.user.profile?.fullName || attempt.student.user.email
    })
  } catch (error) {
    console.error('Get result error:', error)
    res.status(500).json({ error: 'Failed to get result' })
  }
})

export default router
