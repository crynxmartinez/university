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

    // Verify teacher owns this course - support both id and slug
    let course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      course = await prisma.course.findUnique({ where: { slug: courseId } })
    }
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Get total sessions for this course (only past sessions count for attendance)
    const now = new Date()
    const totalSessions = await prisma.scheduledSession.count({
      where: { 
        courseId: course.id,
        date: { lte: now }
      }
    })

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: course.id },
      include: {
        student: {
          include: {
            user: {
              include: { profile: true }
            },
            attendance: {
              where: {
                session: { courseId: course.id },
                status: 'PRESENT'
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Add attendance stats to each enrollment
    const enrollmentsWithStats = enrollments.map(enrollment => ({
      ...enrollment,
      attendanceStats: {
        attended: enrollment.student.attendance.length,
        total: totalSessions,
        percentage: totalSessions > 0 
          ? Math.round((enrollment.student.attendance.length / totalSessions) * 100) 
          : 0
      }
    }))

    res.json(enrollmentsWithStats)
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

    // Verify teacher owns this course - support both id and slug
    let course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      course = await prisma.course.findUnique({ where: { slug: courseId } })
    }
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
        studentId_courseId: { studentId, courseId: course.id }
      }
    })
    if (existing) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' })
    }

    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId: course.id },
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

    // Check if course exists and is active - support both id and slug
    let course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) {
      course = await prisma.course.findUnique({ where: { slug: courseId } })
    }
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (!course.isActive) {
      return res.status(400).json({ error: 'This course is not available for enrollment' })
    }

    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId: req.user.student.id, courseId: course.id }
      }
    })
    if (existing) {
      return res.status(400).json({ error: 'You are already enrolled in this course' })
    }

    const enrollment = await prisma.enrollment.create({
      data: { 
        studentId: req.user.student.id, 
        courseId: course.id 
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

// GET /api/enrollments/teacher/analytics - Get all students analytics for teacher dashboard
router.get('/teacher/analytics', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can access this' })
    }

    const teacherId = req.user.teacher.id

    // Get all courses for this teacher
    const courses = await prisma.course.findMany({
      where: { teacherId },
      select: { id: true, name: true, type: true }
    })

    const courseIds = courses.map(c => c.id)

    // Get total past sessions for each course (for attendance calculation)
    const now = new Date()
    const sessionsPerCourse = await prisma.scheduledSession.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseIds },
        date: { lte: now }
      },
      _count: { id: true }
    })

    const sessionCountMap = {}
    sessionsPerCourse.forEach(s => {
      sessionCountMap[s.courseId] = s._count.id
    })

    // Get all enrollments with student info and attendance
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        course: { select: { id: true, name: true, type: true } },
        student: {
          include: {
            user: { include: { profile: true } },
            attendance: {
              where: {
                session: { courseId: { in: courseIds } },
                status: 'PRESENT'
              },
              include: {
                session: { select: { courseId: true } }
              }
            }
          }
        }
      }
    })

    // Aggregate by student
    const studentMap = new Map()

    enrollments.forEach(enrollment => {
      const studentId = enrollment.student.id
      const courseId = enrollment.courseId
      const totalSessions = sessionCountMap[courseId] || 0
      
      // Count attendance for this specific course
      const attendedInCourse = enrollment.student.attendance.filter(
        a => a.session.courseId === courseId
      ).length

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: studentId,
          userId: enrollment.student.userId,
          name: enrollment.student.user.profile?.fullName || enrollment.student.user.email?.split('@')[0] || 'Unknown',
          email: enrollment.student.user.email,
          courses: [],
          totalEnrollments: 0,
          totalAttended: 0,
          totalSessions: 0
        })
      }

      const student = studentMap.get(studentId)
      student.courses.push({
        id: courseId,
        name: enrollment.course.name,
        type: enrollment.course.type,
        attended: attendedInCourse,
        total: totalSessions,
        percentage: totalSessions > 0 ? Math.round((attendedInCourse / totalSessions) * 100) : 0,
        enrolledAt: enrollment.createdAt
      })
      student.totalEnrollments++
      student.totalAttended += attendedInCourse
      student.totalSessions += totalSessions
    })

    // Calculate overall attendance and status for each student
    const students = Array.from(studentMap.values()).map(student => {
      const overallPercentage = student.totalSessions > 0 
        ? Math.round((student.totalAttended / student.totalSessions) * 100) 
        : 0
      
      let status = 'good'
      if (overallPercentage < 50) status = 'at_risk'
      else if (overallPercentage < 80) status = 'warning'

      return {
        ...student,
        overallAttendance: overallPercentage,
        status
      }
    })

    // Calculate summary stats
    const totalStudents = students.length
    const totalEnrollments = enrollments.length
    const avgAttendance = students.length > 0 
      ? Math.round(students.reduce((sum, s) => sum + s.overallAttendance, 0) / students.length)
      : 0
    const atRiskCount = students.filter(s => s.status === 'at_risk').length

    res.json({
      summary: {
        totalStudents,
        totalEnrollments,
        avgAttendance,
        atRiskCount,
        totalCourses: courses.length
      },
      students,
      courses
    })
  } catch (error) {
    console.error('Get teacher analytics error:', error)
    res.status(500).json({ error: 'Failed to get analytics' })
  }
})

export default router
