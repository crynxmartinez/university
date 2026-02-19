import express from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { 
  trackEvent, 
  getSystemAnalytics, 
  getCourseAnalytics, 
  getStudentAnalytics,
  getTeacherAnalytics 
} from '../utils/analyticsEngine.js'

const router = express.Router()

// Track an analytics event
router.post('/track', authenticateToken, async (req, res) => {
  try {
    const { eventType, metadata } = req.body
    await trackEvent(eventType, req.user.userId, metadata)
    res.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    res.status(500).json({ error: 'Failed to track event' })
  }
})

// Get system-wide analytics (Admin only)
router.get('/overview', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null
    const analytics = await getSystemAnalytics(dateRange)
    res.json(analytics)
  } catch (error) {
    console.error('Error fetching system analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

// Get course analytics (Teacher/Admin)
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params

    // Check authorization - teachers can only view their own courses
    if (req.user.role === 'TEACHER') {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
        include: { courses: true }
      })
      
      if (!teacher || !teacher.courses.some(c => c.id === courseId)) {
        return res.status(403).json({ error: 'Unauthorized' })
      }
    } else if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'REGISTRAR') {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const analytics = await getCourseAnalytics(courseId)
    res.json(analytics)
  } catch (error) {
    console.error('Error fetching course analytics:', error)
    res.status(500).json({ error: 'Failed to fetch course analytics' })
  }
})

// Get student analytics (Student/Teacher/Admin)
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params

    // Check authorization - students can only view their own analytics
    if (req.user.role === 'STUDENT') {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      const student = await prisma.student.findUnique({
        where: { userId: req.user.userId }
      })
      
      if (!student || student.id !== studentId) {
        return res.status(403).json({ error: 'Unauthorized' })
      }
    }

    const analytics = await getStudentAnalytics(studentId)
    res.json(analytics)
  } catch (error) {
    console.error('Error fetching student analytics:', error)
    res.status(500).json({ error: 'Failed to fetch student analytics' })
  }
})

// Get teacher analytics (Admin only)
router.get('/teacher/:teacherId', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { teacherId } = req.params
    const analytics = await getTeacherAnalytics(teacherId)
    res.json(analytics)
  } catch (error) {
    console.error('Error fetching teacher analytics:', error)
    res.status(500).json({ error: 'Failed to fetch teacher analytics' })
  }
})

// Export analytics data (Admin only)
router.get('/export', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { format, type, startDate, endDate } = req.query
    
    if (format === 'csv') {
      const dateRange = startDate && endDate ? { start: startDate, end: endDate } : null
      const analytics = await getSystemAnalytics(dateRange)
      
      // Convert to CSV format
      let csv = ''
      
      if (type === 'enrollments') {
        csv = 'Date,Course Enrollments,Program Enrollments,Total\n'
        analytics.enrollmentTrends.forEach(trend => {
          csv += `${trend.date},${trend.courses},${trend.programs},${trend.total}\n`
        })
      } else if (type === 'users') {
        csv = 'Role,Count\n'
        Object.entries(analytics.userStats).forEach(([role, count]) => {
          csv += `${role},${count}\n`
        })
      } else {
        csv = 'Metric,Value\n'
        csv += `Total Course Enrollments,${analytics.enrollments.courses}\n`
        csv += `Total Program Enrollments,${analytics.enrollments.programs}\n`
        csv += `Active Courses,${analytics.activeContent.courses}\n`
        csv += `Active Programs,${analytics.activeContent.programs}\n`
        csv += `Certificates Issued,${analytics.certificatesIssued}\n`
        csv += `Daily Active Users,${analytics.dailyActiveUsers}\n`
      }
      
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${type || 'overview'}-${new Date().toISOString().split('T')[0]}.csv`)
      res.send(csv)
    } else {
      res.status(400).json({ error: 'Unsupported export format' })
    }
  } catch (error) {
    console.error('Error exporting analytics:', error)
    res.status(500).json({ error: 'Failed to export analytics' })
  }
})

export default router
