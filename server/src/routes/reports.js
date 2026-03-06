// Phase 6.7: PDF Report Generation Routes
import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { generateTranscript, generateGradeReport, generateCertificatePDF } from '../utils/pdfGenerator.js'

const router = express.Router()

// GET /api/reports/transcript/:studentId - Generate student transcript PDF
router.get(
  '/transcript/:studentId',
  authenticateToken,
  async (req, res) => {
    try {
      const { studentId } = req.params
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'REGISTRAR'].includes(req.user.role)
      
      // Get student
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: {
            include: { profile: true }
          }
        }
      })

      if (!student) {
        return res.status(404).json({ error: 'Student not found' })
      }

      // Only allow student to view their own transcript, or admin
      if (!isAdmin && student.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      // Get grades from course enrollments
      const courseEnrollments = await prisma.courseEnrollment.findMany({
        where: { studentId },
        include: {
          courseOffering: {
            include: { masterCourse: true }
          }
        }
      })

      // Get grades from program enrollments
      const programEnrollments = await prisma.programOfferingEnrollment.findMany({
        where: { studentId },
        include: {
          programOffering: {
            include: { masterProgram: true }
          }
        }
      })

      // Compile grades
      const grades = [
        ...courseEnrollments.map(e => ({
          courseName: e.courseOffering?.masterCourse?.name || 'Unknown Course',
          type: 'Course',
          grade: e.finalGrade || '-',
          gradePoints: e.gradePoints || 0,
          status: e.status === 'COMPLETED' ? 'Completed' : 'In Progress'
        })),
        ...programEnrollments.map(e => ({
          programName: e.programOffering?.masterProgram?.name || 'Unknown Program',
          type: 'Program',
          grade: e.finalGrade || '-',
          gradePoints: e.gradePoints || 0,
          status: e.status === 'COMPLETED' ? 'Completed' : 'In Progress'
        }))
      ]

      // Calculate GPA
      const completedGrades = grades.filter(g => g.gradePoints > 0)
      const gpa = completedGrades.length > 0
        ? completedGrades.reduce((sum, g) => sum + g.gradePoints, 0) / completedGrades.length
        : 0

      // Generate PDF
      const studentData = {
        name: `${student.user.profile?.firstName || ''} ${student.user.profile?.lastName || ''}`.trim() || 'Unknown',
        studentId: student.studentId,
        email: student.user.email,
        grades,
        gpa
      }

      const pdfBuffer = await generateTranscript(studentData)

      // Send PDF
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="transcript-${student.studentId}.pdf"`)
      res.send(pdfBuffer)
    } catch (error) {
      console.error('Generate transcript error:', error)
      res.status(500).json({ error: 'Failed to generate transcript' })
    }
  }
)

// GET /api/reports/grade-report/:studentId - Generate grade report for current semester
router.get(
  '/grade-report/:studentId',
  authenticateToken,
  async (req, res) => {
    try {
      const { studentId } = req.params
      const { semesterId } = req.query
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'REGISTRAR'].includes(req.user.role)

      // Get student
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: {
            include: { profile: true }
          }
        }
      })

      if (!student) {
        return res.status(404).json({ error: 'Student not found' })
      }

      if (!isAdmin && student.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      // Get semester
      let semester = null
      if (semesterId) {
        semester = await prisma.semester.findUnique({ where: { id: semesterId } })
      } else {
        // Get current/latest semester
        semester = await prisma.semester.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { startDate: 'desc' }
        })
      }

      const semesterName = semester ? `${semester.name} ${semester.year}` : 'All Time'

      // Get grades for this semester
      const whereClause = { studentId }
      if (semester) {
        whereClause.courseOffering = { semesterId: semester.id }
      }

      const courseEnrollments = await prisma.courseEnrollment.findMany({
        where: whereClause,
        include: {
          courseOffering: {
            include: { masterCourse: true, semester: true }
          }
        }
      })

      const grades = courseEnrollments.map(e => ({
        courseName: e.courseOffering?.masterCourse?.name || 'Unknown Course',
        type: 'Course',
        grade: e.finalGrade || '-',
        gradePoints: e.gradePoints || 0,
        status: e.status === 'COMPLETED' ? 'Completed' : 'In Progress'
      }))

      // Generate PDF
      const studentData = {
        name: `${student.user.profile?.firstName || ''} ${student.user.profile?.lastName || ''}`.trim() || 'Unknown',
        studentId: student.studentId
      }

      const pdfBuffer = await generateGradeReport(studentData, semesterName, grades)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="grade-report-${student.studentId}.pdf"`)
      res.send(pdfBuffer)
    } catch (error) {
      console.error('Generate grade report error:', error)
      res.status(500).json({ error: 'Failed to generate grade report' })
    }
  }
)

// GET /api/reports/certificate/:certificateId - Generate certificate PDF
router.get(
  '/certificate/:certificateId',
  authenticateToken,
  async (req, res) => {
    try {
      const { certificateId } = req.params

      const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
          student: {
            include: {
              user: {
                include: { profile: true }
              }
            }
          },
          courseOffering: {
            include: { masterCourse: true }
          },
          programOffering: {
            include: { masterProgram: true }
          }
        }
      })

      if (!certificate) {
        return res.status(404).json({ error: 'Certificate not found' })
      }

      // Only allow certificate owner or admin to download
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'REGISTRAR'].includes(req.user.role)
      if (!isAdmin && certificate.student.userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' })
      }

      // Prepare certificate data
      const certData = {
        id: certificate.id,
        studentName: `${certificate.student.user.profile?.firstName || ''} ${certificate.student.user.profile?.lastName || ''}`.trim(),
        courseName: certificate.courseOffering?.masterCourse?.name,
        programName: certificate.programOffering?.masterProgram?.name,
        grade: certificate.grade,
        issuedAt: certificate.issuedAt
      }

      const pdfBuffer = await generateCertificatePDF(certData)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.id}.pdf"`)
      res.send(pdfBuffer)
    } catch (error) {
      console.error('Generate certificate error:', error)
      res.status(500).json({ error: 'Failed to generate certificate' })
    }
  }
)

// GET /api/reports/class-roster/:offeringId - Generate class roster PDF (teacher/admin)
router.get(
  '/class-roster/:offeringId',
  authenticateToken,
  authorizeRoles('TEACHER', 'ADMIN', 'SUPER_ADMIN', 'REGISTRAR'),
  async (req, res) => {
    try {
      const { offeringId } = req.params
      const { type = 'course' } = req.query

      let offering, students

      if (type === 'course') {
        offering = await prisma.courseOffering.findUnique({
          where: { id: offeringId },
          include: {
            masterCourse: true,
            semester: true,
            teacher: { include: { user: { include: { profile: true } } } },
            enrollments: {
              include: {
                student: {
                  include: {
                    user: { include: { profile: true } }
                  }
                }
              }
            }
          }
        })
        students = offering?.enrollments?.map(e => ({
          name: `${e.student.user.profile?.firstName || ''} ${e.student.user.profile?.lastName || ''}`.trim(),
          studentId: e.student.studentId,
          email: e.student.user.email,
          status: e.status
        })) || []
      } else {
        offering = await prisma.programOffering.findUnique({
          where: { id: offeringId },
          include: {
            masterProgram: true,
            teacher: { include: { user: { include: { profile: true } } } },
            enrollments: {
              include: {
                student: {
                  include: {
                    user: { include: { profile: true } }
                  }
                }
              }
            }
          }
        })
        students = offering?.enrollments?.map(e => ({
          name: `${e.student.user.profile?.firstName || ''} ${e.student.user.profile?.lastName || ''}`.trim(),
          studentId: e.student.studentId,
          email: e.student.user.email,
          status: e.status
        })) || []
      }

      if (!offering) {
        return res.status(404).json({ error: 'Offering not found' })
      }

      // For now, return JSON (PDF generation for roster can be added later)
      res.json({
        offering: {
          name: offering.masterCourse?.name || offering.masterProgram?.name,
          semester: offering.semester?.name,
          teacher: `${offering.teacher?.user?.profile?.firstName || ''} ${offering.teacher?.user?.profile?.lastName || ''}`.trim()
        },
        students,
        totalStudents: students.length
      })
    } catch (error) {
      console.error('Generate class roster error:', error)
      res.status(500).json({ error: 'Failed to generate class roster' })
    }
  }
)

export default router
