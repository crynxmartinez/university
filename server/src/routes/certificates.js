import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { generateCertificateNumber } from '../utils/certificateGenerator.js'

const router = express.Router()
const prisma = new PrismaClient()

// Issue a certificate (Teacher/Admin only)
// Body: { studentId, courseOfferingId?, programOfferingId?, certificateUrl, completionDate? }
router.post('/issue', authenticateToken, authorizeRoles(['TEACHER', 'SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { studentId, courseOfferingId, programOfferingId, certificateUrl, completionDate } = req.body

    if (!studentId || (!courseOfferingId && !programOfferingId)) {
      return res.status(400).json({ error: 'studentId and either courseOfferingId or programOfferingId are required' })
    }
    if (!certificateUrl) {
      return res.status(400).json({ error: 'certificateUrl (download link) is required' })
    }

    // Check duplicate
    const existing = await prisma.certificate.findFirst({
      where: {
        studentId,
        ...(courseOfferingId ? { courseOfferingId } : { programOfferingId }),
        status: 'ACTIVE'
      }
    })
    if (existing) {
      return res.status(400).json({ error: 'Certificate already issued for this student and offering' })
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) return res.status(404).json({ error: 'Student not found' })

    const certificateNumber = generateCertificateNumber()

    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        studentId,
        courseOfferingId: courseOfferingId || null,
        programOfferingId: programOfferingId || null,
        completionDate: completionDate ? new Date(completionDate) : new Date(),
        certificateUrl,
        issuedById: req.user.id,
        status: 'ACTIVE'
      },
      include: {
        student: { include: { user: { include: { profile: true } } } },
        courseOffering: { include: { masterCourse: true, semester: true } },
        programOffering: { include: { masterProgram: true, semester: true } },
        issuedBy: { include: { profile: true } }
      }
    })

    res.json({ message: 'Certificate issued successfully', certificate })
  } catch (error) {
    console.error('Error issuing certificate:', error)
    res.status(500).json({ error: error.message })
  }
})

// GET my certificates (student calls this for themselves)
router.get('/mine', authenticateToken, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
    if (!student) return res.status(404).json({ error: 'Student profile not found' })

    const certificates = await prisma.certificate.findMany({
      where: { studentId: student.id, status: 'ACTIVE' },
      include: {
        courseOffering: { include: { masterCourse: true, semester: true } },
        programOffering: { include: { masterProgram: true, semester: true } },
        issuedBy: { include: { profile: true } }
      },
      orderBy: { issuedDate: 'desc' }
    })
    res.json(certificates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET certificates for a specific offering (teacher views who has certs in their offering)
router.get('/offering/:offeringId', authenticateToken, async (req, res) => {
  try {
    const { offeringId } = req.params
    const { type } = req.query // 'course' or 'program'

    const where = type === 'program'
      ? { programOfferingId: offeringId }
      : { courseOfferingId: offeringId }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        student: { include: { user: { include: { profile: true } } } },
        issuedBy: { include: { profile: true } }
      },
      orderBy: { issuedDate: 'desc' }
    })
    res.json(certificates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET student's certificates by studentId (admin/teacher)
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
      if (!student || student.id !== studentId) return res.status(403).json({ error: 'Unauthorized' })
    }

    const certificates = await prisma.certificate.findMany({
      where: { studentId, status: 'ACTIVE' },
      include: {
        courseOffering: { include: { masterCourse: true, semester: true } },
        programOffering: { include: { masterProgram: true, semester: true } },
        issuedBy: { include: { profile: true } }
      },
      orderBy: { issuedDate: 'desc' }
    })
    res.json(certificates)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET specific certificate
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.id },
      include: {
        student: { include: { user: { include: { profile: true } } } },
        courseOffering: { include: { masterCourse: true, semester: true } },
        programOffering: { include: { masterProgram: true, semester: true } },
        issuedBy: { include: { profile: true } }
      }
    })
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' })

    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
      if (!student || certificate.studentId !== student.id) return res.status(403).json({ error: 'Unauthorized' })
    }

    res.json(certificate)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE / revoke certificate (admin or issuing teacher)
router.delete('/:id', authenticateToken, authorizeRoles(['TEACHER', 'SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({ where: { id: req.params.id } })
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' })

    await prisma.certificate.update({
      where: { id: req.params.id },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: req.body.reason || 'Revoked by issuer' }
    })
    res.json({ message: 'Certificate revoked' })
  } catch (error) {
    res.status(500).json({ error: error.message })
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
