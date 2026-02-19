import express from 'express'
import { 
  calculateCourseGrade, 
  calculateProgramGrade, 
  calculateAllStudentGrades,
  getStudentGrades 
} from '../utils/gradeCalculator.js'
import prisma from '../lib/prisma.js'

const router = express.Router()

router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params
    const grades = await getStudentGrades(studentId)
    res.json(grades)
  } catch (error) {
    console.error('Error fetching student grades:', error)
    res.status(500).json({ error: 'Failed to fetch grades' })
  }
})

router.post('/calculate/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const { studentId } = req.body
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' })
    }
    
    const grade = await calculateCourseGrade(studentId, courseId)
    res.json(grade)
  } catch (error) {
    console.error('Error calculating course grade:', error)
    res.status(500).json({ error: 'Failed to calculate grade' })
  }
})

router.post('/calculate/program/:programId', async (req, res) => {
  try {
    const { programId } = req.params
    const { studentId } = req.body
    
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' })
    }
    
    const grade = await calculateProgramGrade(studentId, programId)
    res.json(grade)
  } catch (error) {
    console.error('Error calculating program grade:', error)
    res.status(500).json({ error: 'Failed to calculate grade' })
  }
})

router.post('/calculate/all/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params
    const result = await calculateAllStudentGrades(studentId)
    res.json(result)
  } catch (error) {
    console.error('Error calculating all grades:', error)
    res.status(500).json({ error: 'Failed to calculate grades' })
  }
})

router.get('/course/:courseId/students', async (req, res) => {
  try {
    const { courseId } = req.params
    
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            user: {
              include: {
                profile: true
              }
            },
            gradeCalculations: {
              where: { courseId }
            }
          }
        }
      }
    })
    
    const studentsWithGrades = enrollments.map(enrollment => {
      const grade = enrollment.student.gradeCalculations[0]
      return {
        studentId: enrollment.student.id,
        name: enrollment.student.user.profile 
          ? `${enrollment.student.user.profile.firstName} ${enrollment.student.user.profile.lastName}`
          : 'Unknown',
        email: enrollment.student.user.email,
        grade: grade || null,
        enrolledAt: enrollment.enrolledAt
      }
    })
    
    res.json(studentsWithGrades)
  } catch (error) {
    console.error('Error fetching course grades:', error)
    res.status(500).json({ error: 'Failed to fetch course grades' })
  }
})

router.get('/program/:programId/students', async (req, res) => {
  try {
    const { programId } = req.params
    
    const enrollments = await prisma.programEnrollment.findMany({
      where: { programId },
      include: {
        user: {
          include: {
            profile: true,
            student: {
              include: {
                gradeCalculations: {
                  where: { programId }
                }
              }
            }
          }
        }
      }
    })
    
    const studentsWithGrades = enrollments.map(enrollment => {
      const grade = enrollment.user.student?.gradeCalculations[0]
      return {
        studentId: enrollment.user.student?.id,
        name: enrollment.user.profile 
          ? `${enrollment.user.profile.firstName} ${enrollment.user.profile.lastName}`
          : 'Unknown',
        email: enrollment.user.email,
        grade: grade || null,
        enrolledAt: enrollment.enrolledAt
      }
    })
    
    res.json(studentsWithGrades)
  } catch (error) {
    console.error('Error fetching program grades:', error)
    res.status(500).json({ error: 'Failed to fetch program grades' })
  }
})

export default router
