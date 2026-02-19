import express from 'express'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET all master programs (all roles can view)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const masterPrograms = await prisma.masterProgram.findMany({
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
    res.json(masterPrograms)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET single master program
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const masterProgram = await prisma.masterProgram.findUnique({
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
    if (!masterProgram) return res.status(404).json({ error: 'Master program not found' })
    res.json(masterProgram)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create master program (admin only)
router.post('/', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { code, title, description, programType, duration, credits } = req.body
    if (!code || !title) return res.status(400).json({ error: 'Code and title are required' })

    const existing = await prisma.masterProgram.findUnique({ where: { code } })
    if (existing) return res.status(400).json({ error: 'Program code already exists' })

    const masterProgram = await prisma.masterProgram.create({
      data: {
        code: code.toUpperCase(),
        title,
        description,
        programType: programType || 'ONLINE',
        duration,
        credits: credits ? parseInt(credits) : 0,
        createdById: req.user.id
      },
      include: { createdBy: { include: { profile: true } } }
    })
    res.status(201).json(masterProgram)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update master program (admin only)
router.put('/:id', authenticateToken, authorizeRoles(['SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { title, description, programType, duration, credits } = req.body
    const masterProgram = await prisma.masterProgram.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        programType,
        duration,
        credits: credits ? parseInt(credits) : undefined
      }
    })
    res.json(masterProgram)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE master program (admin only)
router.delete('/:id', authenticateToken, authorizeRoles(['SUPER_ADMIN']), async (req, res) => {
  try {
    const offerings = await prisma.programOffering.count({ where: { masterProgramId: req.params.id } })
    if (offerings > 0) return res.status(400).json({ error: 'Cannot delete master program with existing offerings' })

    await prisma.masterProgram.delete({ where: { id: req.params.id } })
    res.json({ message: 'Master program deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
