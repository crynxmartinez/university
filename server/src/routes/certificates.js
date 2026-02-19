import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { generateCertificateNumber, generateCertificatePDF, deleteCertificateFile } from '../utils/certificateGenerator.js'

const router = express.Router()
const prisma = new PrismaClient()

// Issue a certificate (Teacher/Admin only)
router.post('/issue', authenticateToken, authorizeRoles(['TEACHER', 'SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { studentId, courseId, programId, completionDate, grade, gpa } = req.body

    // Validate input
    if (!studentId || (!courseId && !programId)) {
      return res.status(400).json({ error: 'Student ID and either Course ID or Program ID are required' })
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        studentId,
        ...(courseId ? { courseId } : { programId }),
        status: 'ACTIVE'
      }
    })

    if (existingCertificate) {
      return res.status(400).json({ error: 'Certificate already issued for this student and course/program' })
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!student) {
      return res.status(404).json({ error: 'Student not found' })
    }

    // Get course or program details
    let courseName = null
    let programName = null

    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      })
      if (!course) {
        return res.status(404).json({ error: 'Course not found' })
      }
      courseName = course.name
    }

    if (programId) {
      const program = await prisma.program.findUnique({
        where: { id: programId }
      })
      if (!program) {
        return res.status(404).json({ error: 'Program not found' })
      }
      programName = program.name
    }

    // Generate certificate number
    const certificateNumber = generateCertificateNumber()

    // Get issuer details
    const issuer = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { profile: true }
    })

    const issuerName = issuer.profile 
      ? `${issuer.profile.firstName} ${issuer.profile.lastName}`
      : issuer.email

    const studentName = student.user.profile
      ? `${student.user.profile.firstName} ${student.user.profile.lastName}`
      : student.user.email

    // Generate verification URL
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-certificate/${certificateNumber}`

    // Generate PDF
    const pdfResult = await generateCertificatePDF({
      certificateNumber,
      studentName,
      courseName,
      programName,
      completionDate: completionDate || new Date(),
      grade,
      gpa,
      issuedBy: issuerName,
      verificationUrl
    })

    // Create certificate record
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        studentId,
        courseId: courseId || null,
        programId: programId || null,
        completionDate: completionDate ? new Date(completionDate) : new Date(),
        grade: grade || null,
        gpa: gpa || null,
        certificateUrl: pdfResult.relativePath,
        issuedById: req.user.userId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        course: true,
        program: true,
        issuedBy: {
          include: {
            profile: true
          }
        }
      }
    })

    res.json({
      message: 'Certificate issued successfully',
      certificate
    })

  } catch (error) {
    console.error('Error issuing certificate:', error)
    res.status(500).json({ error: 'Failed to issue certificate' })
  }
})

// Get student's certificates
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params

    // Check authorization - students can only view their own certificates
    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user.userId }
      })
      if (!student || student.id !== studentId) {
        return res.status(403).json({ error: 'Unauthorized' })
      }
    }

    const certificates = await prisma.certificate.findMany({
      where: {
        studentId,
        status: 'ACTIVE'
      },
      include: {
        course: true,
        program: true,
        issuedBy: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        issuedDate: 'desc'
      }
    })

    res.json(certificates)

  } catch (error) {
    console.error('Error fetching certificates:', error)
    res.status(500).json({ error: 'Failed to fetch certificates' })
  }
})

// Get specific certificate
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        course: true,
        program: true,
        issuedBy: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' })
    }

    // Check authorization
    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user.userId }
      })
      if (!student || certificate.studentId !== student.id) {
        return res.status(403).json({ error: 'Unauthorized' })
      }
    }

    res.json(certificate)

  } catch (error) {
    console.error('Error fetching certificate:', error)
    res.status(500).json({ error: 'Failed to fetch certificate' })
  }
})

// Verify certificate by certificate number (public endpoint)
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const { certificateNumber } = req.params

    const certificate = await prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        student: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        course: true,
        program: true,
        issuedBy: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!certificate) {
      return res.status(404).json({ 
        valid: false,
        error: 'Certificate not found' 
      })
    }

    if (certificate.status !== 'ACTIVE') {
      return res.status(200).json({
        valid: false,
        status: certificate.status,
        revokedAt: certificate.revokedAt,
        revokedReason: certificate.revokedReason
      })
    }

    const studentName = certificate.student.user.profile
      ? `${certificate.student.user.profile.firstName} ${certificate.student.user.profile.lastName}`
      : certificate.student.user.email

    const issuerName = certificate.issuedBy.profile
      ? `${certificate.issuedBy.profile.firstName} ${certificate.issuedBy.profile.lastName}`
      : certificate.issuedBy.email

    res.json({
      valid: true,
      certificateNumber: certificate.certificateNumber,
      studentName,
      courseName: certificate.course?.name,
      programName: certificate.program?.name,
      completionDate: certificate.completionDate,
      issuedDate: certificate.issuedDate,
      grade: certificate.grade,
      gpa: certificate.gpa,
      issuedBy: issuerName
    })

  } catch (error) {
    console.error('Error verifying certificate:', error)
    res.status(500).json({ error: 'Failed to verify certificate' })
  }
})

// Revoke certificate (Admin only)
router.put('/:id/revoke', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { id } = req.params
    const { reason } = req.body

    const certificate = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedReason: reason || 'No reason provided'
      },
      include: {
        student: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        course: true,
        program: true
      }
    })

    res.json({
      message: 'Certificate revoked successfully',
      certificate
    })

  } catch (error) {
    console.error('Error revoking certificate:', error)
    res.status(500).json({ error: 'Failed to revoke certificate' })
  }
})

// Get all certificates (Admin only)
router.get('/', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { status, courseId, programId } = req.query

    const certificates = await prisma.certificate.findMany({
      where: {
        ...(status && { status }),
        ...(courseId && { courseId }),
        ...(programId && { programId })
      },
      include: {
        student: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        course: true,
        program: true,
        issuedBy: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        issuedDate: 'desc'
      }
    })

    res.json(certificates)

  } catch (error) {
    console.error('Error fetching certificates:', error)
    res.status(500).json({ error: 'Failed to fetch certificates' })
  }
})

export default router
