// Phase 6.8: Student Progress Tracking Routes
import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/progress/overview - Get student's overall progress
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Get course enrollments
    const courseEnrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: student.id },
      include: {
        courseOffering: {
          include: {
            masterCourse: true,
            sessions: true
          }
        }
      }
    })

    // Get program enrollments
    const programEnrollments = await prisma.programOfferingEnrollment.findMany({
      where: { studentId: student.id },
      include: {
        programOffering: {
          include: {
            masterProgram: true
          }
        }
      }
    })

    // Calculate overall stats
    const totalCourses = courseEnrollments.length
    const completedCourses = courseEnrollments.filter(e => e.status === 'COMPLETED').length
    const totalPrograms = programEnrollments.length
    const completedPrograms = programEnrollments.filter(e => e.status === 'COMPLETED').length

    // Calculate attendance
    const attendanceRecords = await prisma.courseOfferingAttendance.findMany({
      where: {
        enrollment: { studentId: student.id }
      }
    })
    const totalSessions = attendanceRecords.length
    const attendedSessions = attendanceRecords.filter(a => a.status === 'PRESENT').length
    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0

    // Calculate average grade
    const gradesWithPoints = courseEnrollments.filter(e => e.gradePoints && e.gradePoints > 0)
    const averageGPA = gradesWithPoints.length > 0
      ? gradesWithPoints.reduce((sum, e) => sum + e.gradePoints, 0) / gradesWithPoints.length
      : 0

    // Get certificates count
    const certificatesCount = await prisma.certificate.count({
      where: { studentId: student.id }
    })

    // Calculate learning streak (days with activity)
    const streak = await calculateLearningStreak(student.id)

    res.json({
      overview: {
        totalCourses,
        completedCourses,
        courseCompletionRate: totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0,
        totalPrograms,
        completedPrograms,
        programCompletionRate: totalPrograms > 0 ? (completedPrograms / totalPrograms) * 100 : 0,
        attendanceRate,
        averageGPA,
        certificatesEarned: certificatesCount,
        currentStreak: streak.current,
        longestStreak: streak.longest
      }
    })
  } catch (error) {
    console.error('Get progress overview error:', error)
    res.status(500).json({ error: 'Failed to get progress overview' })
  }
})

// GET /api/progress/courses - Get detailed course progress
router.get('/courses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: student.id },
      include: {
        courseOffering: {
          include: {
            masterCourse: true,
            semester: true,
            sessions: true,
            exams: true
          }
        },
        attendances: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const courseProgress = enrollments.map(enrollment => {
      const totalSessions = enrollment.courseOffering?.sessions?.length || 0
      const attendedSessions = enrollment.attendances?.filter(a => a.status === 'PRESENT').length || 0
      const totalExams = enrollment.courseOffering?.exams?.length || 0

      return {
        id: enrollment.id,
        courseName: enrollment.courseOffering?.masterCourse?.name || 'Unknown',
        semester: enrollment.courseOffering?.semester?.name || 'N/A',
        status: enrollment.status,
        enrolledAt: enrollment.createdAt,
        progress: {
          sessionsAttended: attendedSessions,
          totalSessions,
          attendanceRate: totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0,
          totalExams,
          grade: enrollment.finalGrade,
          gradePoints: enrollment.gradePoints
        }
      }
    })

    res.json({ courses: courseProgress })
  } catch (error) {
    console.error('Get course progress error:', error)
    res.status(500).json({ error: 'Failed to get course progress' })
  }
})

// GET /api/progress/activity - Get recent learning activity
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    const { days = 30 } = req.query
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    // Get attendance records
    const attendances = await prisma.courseOfferingAttendance.findMany({
      where: {
        enrollment: { studentId: student.id },
        createdAt: { gte: startDate }
      },
      include: {
        session: true,
        enrollment: {
          include: {
            courseOffering: {
              include: { masterCourse: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Get exam attempts
    const examAttempts = await prisma.courseOfferingExamAttempt.findMany({
      where: {
        studentId: student.id,
        startedAt: { gte: startDate }
      },
      include: {
        exam: {
          include: {
            courseOffering: {
              include: { masterCourse: true }
            }
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    })

    // Combine and format activities
    const activities = [
      ...attendances.map(a => ({
        type: 'attendance',
        date: a.createdAt,
        title: `Attended ${a.enrollment?.courseOffering?.masterCourse?.name || 'class'}`,
        status: a.status,
        details: a.session?.title || 'Session'
      })),
      ...examAttempts.map(e => ({
        type: 'exam',
        date: e.startedAt,
        title: `${e.status === 'SUBMITTED' ? 'Completed' : 'Started'} ${e.exam?.title || 'exam'}`,
        status: e.status,
        details: `Score: ${e.score || 'Pending'}/${e.exam?.totalPoints || 100}`
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json({ activities: activities.slice(0, 50) })
  } catch (error) {
    console.error('Get activity error:', error)
    res.status(500).json({ error: 'Failed to get activity' })
  }
})

// GET /api/progress/trends - Get performance trends over time
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Get enrollments with grades by semester
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { 
        studentId: student.id,
        gradePoints: { not: null }
      },
      include: {
        courseOffering: {
          include: { semester: true }
        }
      },
      orderBy: {
        courseOffering: {
          semester: { startDate: 'asc' }
        }
      }
    })

    // Group by semester
    const semesterGrades = {}
    enrollments.forEach(e => {
      const semesterKey = e.courseOffering?.semester?.id || 'unknown'
      const semesterName = e.courseOffering?.semester 
        ? `${e.courseOffering.semester.name} ${e.courseOffering.semester.year}`
        : 'Unknown'
      
      if (!semesterGrades[semesterKey]) {
        semesterGrades[semesterKey] = {
          name: semesterName,
          grades: [],
          startDate: e.courseOffering?.semester?.startDate
        }
      }
      semesterGrades[semesterKey].grades.push(e.gradePoints)
    })

    // Calculate average GPA per semester
    const trends = Object.values(semesterGrades)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .map(s => ({
        semester: s.name,
        averageGPA: s.grades.reduce((sum, g) => sum + g, 0) / s.grades.length,
        coursesCompleted: s.grades.length
      }))

    res.json({ trends })
  } catch (error) {
    console.error('Get trends error:', error)
    res.status(500).json({ error: 'Failed to get trends' })
  }
})

// Helper function to calculate learning streak
async function calculateLearningStreak(studentId) {
  try {
    // Get all attendance dates
    const attendances = await prisma.courseOfferingAttendance.findMany({
      where: {
        enrollment: { studentId },
        status: 'PRESENT'
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' }
    })

    if (attendances.length === 0) {
      return { current: 0, longest: 0 }
    }

    // Get unique dates
    const dates = [...new Set(
      attendances.map(a => a.createdAt.toISOString().split('T')[0])
    )].sort().reverse()

    // Calculate current streak
    let currentStreak = 0
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1])
        const currDate = new Date(dates[i])
        const diffDays = (prevDate - currDate) / 86400000

        if (diffDays === 1) {
          currentStreak++
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 1
    let tempStreak = 1

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1])
      const currDate = new Date(dates[i])
      const diffDays = (prevDate - currDate) / 86400000

      if (diffDays === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    return { current: currentStreak, longest: longestStreak }
  } catch (error) {
    console.error('Calculate streak error:', error)
    return { current: 0, longest: 0 }
  }
}

export default router
