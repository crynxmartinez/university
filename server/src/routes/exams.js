import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

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
    console.error('Get exams error:', error)
    res.status(500).json({ error: 'Failed to get exams' })
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
    console.error('Create exam error:', error)
    res.status(500).json({ error: 'Failed to create exam' })
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

    // Get course with exams
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        exams: {
          orderBy: { order: 'asc' },
          include: {
            scores: {
              where: { studentId }
            }
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Calculate grade
    let totalEarned = 0
    let totalPossible = 0
    const examScores = course.exams.map(exam => {
      const scoreRecord = exam.scores[0] // Only one score per student per exam
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
        gradedAt: scoreRecord?.gradedAt
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

export default router
