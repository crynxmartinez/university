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

// GET /api/enrollments/my-courses - Get courses for logged-in student
router.get('/my-courses', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.student.id },
      include: {
        course: {
          include: {
            teacher: {
              include: {
                user: {
                  include: { profile: true }
                }
              }
            },
            modules: {
              include: {
                lessons: {
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(enrollments.map(e => e.course))
  } catch (error) {
    console.error('Get my courses error:', error)
    res.status(500).json({ error: 'Failed to get courses' })
  }
})

// GET /api/enrollments/course/:courseId/students - Get students enrolled in a course (for teachers)
router.get('/course/:courseId/students', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params

    // Verify teacher owns this course
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(enrollments)
  } catch (error) {
    console.error('Get enrolled students error:', error)
    res.status(500).json({ error: 'Failed to get students' })
  }
})

// POST /api/enrollments - Enroll a student in a course (teacher only)
router.post('/', authenticate, async (req, res) => {
  try {
    const { studentId, courseId } = req.body

    if (!studentId || !courseId) {
      return res.status(400).json({ error: 'Student ID and Course ID are required' })
    }

    // Verify teacher owns this course
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized to enroll students in this course' })
    }

    // Check if student exists
    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId }
      }
    })
    if (existing) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' })
    }

    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId },
      include: {
        student: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    })

    res.status(201).json(enrollment)
  } catch (error) {
    console.error('Enroll student error:', error)
    res.status(500).json({ error: 'Failed to enroll student' })
  }
})

// DELETE /api/enrollments/:id - Remove enrollment (teacher only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: { course: true }
    })

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' })
    }

    if (enrollment.course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.enrollment.delete({ where: { id } })

    res.json({ message: 'Student removed from course' })
  } catch (error) {
    console.error('Remove enrollment error:', error)
    res.status(500).json({ error: 'Failed to remove student' })
  }
})

// POST /api/enrollments/self - Student self-enroll in a course
router.post('/self', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT' || !req.user.student) {
      return res.status(403).json({ error: 'Only students can self-enroll' })
    }

    const { courseId } = req.body

    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' })
    }

    // Check if course exists and is active
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (!course.isActive) {
      return res.status(400).json({ error: 'This course is not available for enrollment' })
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: req.user.student.id, courseId }
      }
    })
    if (existing) {
      return res.status(400).json({ error: 'You are already enrolled in this course' })
    }

    const enrollment = await prisma.enrollment.create({
      data: { 
        studentId: req.user.student.id, 
        courseId 
      },
      include: {
        course: {
          include: {
            teacher: {
              include: {
                user: { include: { profile: true } }
              }
            },
            modules: {
              include: { lessons: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    res.status(201).json(enrollment.course)
  } catch (error) {
    console.error('Self-enroll error:', error)
    res.status(500).json({ error: 'Failed to enroll in course' })
  }
})

// GET /api/enrollments/students - Get all students (for teacher to enroll)
router.get('/students', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({ error: 'Only teachers can access this' })
    }

    const students = await prisma.student.findMany({
      include: {
        user: {
          include: { profile: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(students)
  } catch (error) {
    console.error('Get students error:', error)
    res.status(500).json({ error: 'Failed to get students' })
  }
})

export default router
