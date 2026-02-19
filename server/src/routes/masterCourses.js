import express from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET all master courses (all roles can view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const masterCourses = await prisma.masterCourse.findMany({
      include: {
        createdBy: { include: { profile: true } },
        offerings: {
          select: {
            id: true,
            term: true,
            status: true,
            startDate: true,
            endDate: true,
            _count: { select: { enrollments: true } }
          }
        },
        _count: { select: { offerings: true } }
      },
      orderBy: { code: 'asc' }
    })
    res.json(masterCourses)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single master course
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const masterCourse = await prisma.masterCourse.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { include: { profile: true } },
        offerings: {
          include: {
            teacher: { include: { user: { include: { profile: true } } } },
            _count: { select: { enrollments: true } }
          },
          orderBy: { startDate: 'desc' }
        }
      }
    })
    if (!masterCourse) return res.status(404).json({ error: 'Master course not found' })
    res.json(masterCourse)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create master course (admin only)
router.post('/', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { code, title, description, syllabus } = req.body
    if (!code || !title) return res.status(400).json({ error: 'Code and title are required' })

    const existing = await prisma.masterCourse.findUnique({ where: { code } })
    if (existing) return res.status(400).json({ error: 'Course code already exists' })

    const masterCourse = await prisma.masterCourse.create({
      data: {
        code: code.toUpperCase(),
        title,
        description,
        syllabus,
        createdById: req.user.id
      },
      include: { createdBy: { include: { profile: true } } }
    })
    res.status(201).json(masterCourse)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update master course (admin only)
router.put('/:id', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { title, description, syllabus } = req.body
    const masterCourse = await prisma.masterCourse.update({
      where: { id: req.params.id },
      data: { title, description, syllabus }
    })
    res.json(masterCourse)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE master course (admin only)
router.delete('/:id', authenticateToken, authorizeRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    const offerings = await prisma.courseOffering.count({ where: { masterCourseId: req.params.id } })
    if (offerings > 0) return res.status(400).json({ error: 'Cannot delete master course with existing offerings' })

    await prisma.masterCourse.delete({ where: { id: req.params.id } })
    res.json({ message: 'Master course deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
