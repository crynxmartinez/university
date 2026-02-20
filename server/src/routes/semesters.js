import express from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET all semesters (all roles can view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const semesters = await prisma.semester.findMany({
      include: {
        _count: { select: { courseOfferings: true, programOfferings: true } }
      },
      orderBy: { startDate: 'desc' }
    })
    res.json(semesters)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single semester
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const semester = await prisma.semester.findUnique({
      where: { id: req.params.id },
      include: {
        courseOfferings: {
          include: {
            masterCourse: true,
            teacher: { include: { user: { include: { profile: true } } } },
            _count: { select: { enrollments: true } }
          }
        },
        programOfferings: {
          include: {
            masterProgram: true,
            teacher: { include: { user: { include: { profile: true } } } },
            _count: { select: { enrollments: true } }
          }
        }
      }
    })
    if (!semester) return res.status(404).json({ error: 'Semester not found' })
    res.json(semester)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create semester (admin only)
router.post('/', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { name, startDate, endDate, enrollmentStart, enrollmentEnd } = req.body
    if (!name || !startDate || !endDate) return res.status(400).json({ error: 'Name, start date, and end date are required' })

    const existing = await prisma.semester.findUnique({ where: { name } })
    if (existing) return res.status(400).json({ error: 'A semester with this name already exists' })

    const semester = await prisma.semester.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        enrollmentStart: enrollmentStart ? new Date(enrollmentStart) : null,
        enrollmentEnd: enrollmentEnd ? new Date(enrollmentEnd) : null,
        createdById: req.user.id
      }
    })
    res.status(201).json(semester)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update semester (admin only)
router.put('/:id', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { name, startDate, endDate, enrollmentStart, enrollmentEnd, status } = req.body
    const semester = await prisma.semester.update({
      where: { id: req.params.id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        enrollmentStart: enrollmentStart ? new Date(enrollmentStart) : null,
        enrollmentEnd: enrollmentEnd ? new Date(enrollmentEnd) : null,
        status: status || undefined
      }
    })
    res.json(semester)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE semester (admin only - only if no offerings)
router.delete('/:id', authenticateToken, authorizeRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    const courseCount = await prisma.courseOffering.count({ where: { semesterId: req.params.id } })
    const programCount = await prisma.programOffering.count({ where: { semesterId: req.params.id } })
    if (courseCount + programCount > 0) return res.status(400).json({ error: 'Cannot delete semester with existing offerings' })

    await prisma.semester.delete({ where: { id: req.params.id } })
    res.json({ message: 'Semester deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
