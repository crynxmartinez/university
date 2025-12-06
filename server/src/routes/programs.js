import express from 'express'
import prisma from '../lib/prisma.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// GET /api/programs/public - Get all public programs (no auth required)
// Returns programs WITHOUT price for public display
router.get('/public', async (req, res) => {
  try {
    const programs = await prisma.program.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        image: true,
        isActive: true,
        createdAt: true
        // price is NOT included for public view
      }
    })

    res.json(programs)
  } catch (error) {
    console.error('Get public programs error:', error)
    res.json([])
  }
})

// GET /api/programs/student - Get all programs with price (for students)
router.get('/student', async (req, res) => {
  try {
    // Verify token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user || user.role !== 'STUDENT') {
      return res.status(403).json({ error: 'Only students can access this' })
    }

    const programs = await prisma.program.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true, // Include price for students
        duration: true,
        image: true,
        isActive: true,
        createdAt: true
      }
    })

    res.json(programs)
  } catch (error) {
    console.error('Get student programs error:', error)
    res.status(500).json({ error: 'Failed to get programs' })
  }
})

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
      where: { id: decoded.id }
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

// GET /api/programs - Get all programs (admin only)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only admins can access programs' })
    }

    const programs = await prisma.program.findMany({
      orderBy: { createdAt: 'desc' }
    })

    res.json(programs)
  } catch (error) {
    console.error('Get programs error:', error)
    res.status(500).json({ error: 'Failed to get programs' })
  }
})

// POST /api/programs - Create a new program (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only admins can create programs' })
    }

    const { name, description, price, duration, image, isActive } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Program name is required' })
    }

    const program = await prisma.program.create({
      data: {
        name,
        description: description || '',
        price: parseFloat(price) || 0,
        duration: duration || null,
        image: image || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    res.status(201).json(program)
  } catch (error) {
    console.error('Create program error:', error)
    res.status(500).json({ error: 'Failed to create program' })
  }
})

// PUT /api/programs/:id - Update a program (admin only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only admins can update programs' })
    }

    const { id } = req.params
    const { name, description, price, duration, image, isActive } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (duration !== undefined) updateData.duration = duration
    if (image !== undefined) updateData.image = image
    if (isActive !== undefined) updateData.isActive = isActive

    const program = await prisma.program.update({
      where: { id },
      data: updateData
    })

    res.json(program)
  } catch (error) {
    console.error('Update program error:', error)
    res.status(500).json({ error: 'Failed to update program' })
  }
})

// DELETE /api/programs/:id - Delete a program (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete programs' })
    }

    const { id } = req.params

    await prisma.program.delete({ where: { id } })

    res.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Delete program error:', error)
    res.status(500).json({ error: 'Failed to delete program' })
  }
})

export default router
