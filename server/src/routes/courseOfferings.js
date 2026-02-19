import express from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET all course offerings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, masterCourseId } = req.query
    const user = req.user

    let where = {}
    if (status) where.status = status
    if (masterCourseId) where.masterCourseId = masterCourseId

    // Students only see ACTIVE offerings
    if (user.role === 'STUDENT') {
      where.status = 'ACTIVE'
    }

    // Teachers only see their own offerings + all ACTIVE ones
    if (user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
      if (!status) {
        where = {
          ...where,
          OR: [
            { teacherId: teacher?.id },
            { status: 'ACTIVE' }
          ]
        }
      }
    }

    const offerings = await prisma.courseOffering.findMany({
      where,
      include: {
        masterCourse: true,
        teacher: { include: { user: { include: { profile: true } } } },
        _count: { select: { enrollments: true, sessions: true } }
      },
      orderBy: { startDate: 'desc' }
    })
    res.json(offerings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single course offering
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const offering = await prisma.courseOffering.findUnique({
      where: { id: req.params.id },
      include: {
        masterCourse: true,
        teacher: { include: { user: { include: { profile: true } } } },
        enrollments: {
          include: { student: { include: { user: { include: { profile: true } } } } }
        },
        sessions: { orderBy: { date: 'asc' } },
        exams: true,
        _count: { select: { enrollments: true, sessions: true } }
      }
    })
    if (!offering) return res.status(404).json({ error: 'Course offering not found' })
    res.json(offering)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create course offering (teacher or admin)
router.post('/', authenticateToken, authorizeRoles(['TEACHER', 'SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const {
      masterCourseId, term, startDate, endDate,
      enrollmentStart, enrollmentEnd, maxStudents,
      price, priceType, meetingLink, location, image
    } = req.body

    if (!masterCourseId || !term || !startDate || !endDate) {
      return res.status(400).json({ error: 'masterCourseId, term, startDate, endDate are required' })
    }

    const masterCourse = await prisma.masterCourse.findUnique({ where: { id: masterCourseId } })
    if (!masterCourse) return res.status(404).json({ error: 'Master course not found' })

    let teacherId
    if (req.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } })
      if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' })
      teacherId = teacher.id
    } else {
      // Admin can specify teacherId or use their own
      teacherId = req.body.teacherId
      if (!teacherId) return res.status(400).json({ error: 'teacherId is required' })
    }

    const offering = await prisma.courseOffering.create({
      data: {
        masterCourseId,
        teacherId,
        term,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        enrollmentStart: enrollmentStart ? new Date(enrollmentStart) : null,
        enrollmentEnd: enrollmentEnd ? new Date(enrollmentEnd) : null,
        maxStudents: maxStudents ? parseInt(maxStudents) : null,
        price: price ? parseFloat(price) : 0,
        priceType: priceType || 'ONE_TIME',
        meetingLink,
        location,
        image,
        status: 'DRAFT'
      },
      include: {
        masterCourse: true,
        teacher: { include: { user: { include: { profile: true } } } }
      }
    })
    res.status(201).json(offering)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update course offering
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const offering = await prisma.courseOffering.findUnique({ where: { id: req.params.id } })
    if (!offering) return res.status(404).json({ error: 'Course offering not found' })

    // Teachers can only edit their own DRAFT offerings
    if (req.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } })
      if (offering.teacherId !== teacher?.id) return res.status(403).json({ error: 'Not your offering' })
      if (offering.status !== 'DRAFT') return res.status(403).json({ error: 'Can only edit DRAFT offerings' })
    }

    const {
      term, startDate, endDate, enrollmentStart, enrollmentEnd,
      maxStudents, price, priceType, meetingLink, location, image
    } = req.body

    const updated = await prisma.courseOffering.update({
      where: { id: req.params.id },
      data: {
        term,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        enrollmentStart: enrollmentStart ? new Date(enrollmentStart) : undefined,
        enrollmentEnd: enrollmentEnd ? new Date(enrollmentEnd) : undefined,
        maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        priceType,
        meetingLink,
        location,
        image
      },
      include: { masterCourse: true, teacher: { include: { user: { include: { profile: true } } } } }
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT activate offering (admin only)
router.put('/:id/activate', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const offering = await prisma.courseOffering.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
      include: { masterCourse: true }
    })
    res.json(offering)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT complete offering (admin only)
router.put('/:id/complete', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const offering = await prisma.courseOffering.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
      include: { masterCourse: true }
    })
    res.json(offering)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT archive offering (admin only)
router.put('/:id/archive', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const offering = await prisma.courseOffering.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
      include: { masterCourse: true }
    })
    res.json(offering)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE offering (admin only)
router.delete('/:id', authenticateToken, authorizeRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    await prisma.courseOffering.delete({ where: { id: req.params.id } })
    res.json({ message: 'Course offering deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST enroll student in offering
router.post('/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const offering = await prisma.courseOffering.findUnique({ where: { id: req.params.id } })
    if (!offering) return res.status(404).json({ error: 'Course offering not found' })
    if (offering.status !== 'ACTIVE') return res.status(400).json({ error: 'Enrollment not open' })

    // Check enrollment period
    const now = new Date()
    if (offering.enrollmentEnd && now > offering.enrollmentEnd) {
      return res.status(400).json({ error: 'Enrollment period has ended' })
    }
    if (offering.enrollmentStart && now < offering.enrollmentStart) {
      return res.status(400).json({ error: 'Enrollment period has not started' })
    }

    // Check max students
    if (offering.maxStudents) {
      const count = await prisma.courseEnrollment.count({ where: { courseOfferingId: req.params.id } })
      if (count >= offering.maxStudents) return res.status(400).json({ error: 'Course is full' })
    }

    let studentId = req.body.studentId
    if (!studentId) {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
      if (!student) return res.status(404).json({ error: 'Student profile not found' })
      studentId = student.id
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: { studentId, courseOfferingId: req.params.id }
    })
    res.status(201).json(enrollment)
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Already enrolled' })
    res.status(500).json({ error: error.message })
  }
})

export default router
