import express from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'

const router = express.Router()

// GET /api/users - Get all users with optional role filter
router.get('/', async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query
    
    const where = {}
    
    // Filter by role if provided
    if (role && role !== 'ALL') {
      where.role = role
    }
    
    // Exclude SUPER_ADMIN from list
    where.role = where.role ? where.role : { not: 'SUPER_ADMIN' }
    
    // Search by name or userId
    if (search) {
      where.OR = [
        { userId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } }
      ]
    }
    
    // Get total count for pagination
    const total = await prisma.user.count({ where })
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        student: true,
        teacher: true,
        registrar: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    })
    
    // Get counts by role
    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
      where: { role: { not: 'SUPER_ADMIN' } }
    })
    
    const stats = {
      total: counts.reduce((sum, c) => sum + c._count.role, 0),
      students: counts.find(c => c.role === 'STUDENT')?._count.role || 0,
      teachers: counts.find(c => c.role === 'TEACHER')?._count.role || 0,
      registrars: counts.find(c => c.role === 'REGISTRAR')?._count.role || 0
    }
    
    res.json({
      users: users.map(user => ({
        id: user.id,
        userId: user.userId,
        email: user.email,
        role: user.role,
        status: user.student?.status || 'ACTIVE',
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt,
        profile: user.profile ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName
        } : null
      })),
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// GET /api/users/:id - Get single user details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        student: true,
        teacher: true,
        registrar: true
      }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    res.json({
      id: user.id,
      userId: user.userId,
      email: user.email,
      role: user.role,
      status: user.student?.status || 'ACTIVE',
      mustChangePassword: user.mustChangePassword,
      profileComplete: user.profileComplete,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone,
        address: user.profile.address
      } : null
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// POST /api/users/create - Create a new account (Registrar, Teacher, or Student)
router.post('/create', async (req, res) => {
  try {
    const { firstName, lastName, role } = req.body

    if (!firstName || !lastName || !role) {
      return res.status(400).json({ error: 'First name, last name, and role are required' })
    }

    // Default password for all new accounts
    const defaultPassword = 'passwordtest123'

    const validRoles = ['REGISTRAR', 'TEACHER', 'STUDENT']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be REGISTRAR, TEACHER, or STUDENT' })
    }

    const currentYear = new Date().getFullYear()

    // Get or create sequence for this role and year
    let sequence = await prisma.idSequence.findUnique({
      where: {
        type_year: {
          type: role,
          year: currentYear
        }
      }
    })

    if (!sequence) {
      sequence = await prisma.idSequence.create({
        data: {
          type: role,
          year: currentYear,
          lastNumber: 0
        }
      })
    }

    // Increment sequence
    const newNumber = sequence.lastNumber + 1
    await prisma.idSequence.update({
      where: { id: sequence.id },
      data: { lastNumber: newNumber }
    })

    // Generate UID based on role
    // Format: role-yearXXX (e.g., student-2025001, teacher-2025001)
    const paddedNumber = String(newNumber).padStart(3, '0')
    const rolePrefix = role.toLowerCase()
    const userId = `${rolePrefix}-${currentYear}${paddedNumber}`

    // Generate email
    // Format: roleXXX_firstname@ilmlearningcenter.com
    const email = `${rolePrefix}${paddedNumber}_${firstName.toLowerCase()}@ilmlearningcenter.com`

    // Hash password
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        userId,
        email,
        password: hashedPassword,
        role,
        mustChangePassword: true,
        profileComplete: true,
        profile: {
          create: {
            firstName,
            lastName
          }
        },
        // Create role-specific record
        ...(role === 'STUDENT' && {
          student: {
            create: {
              studentId: userId
            }
          }
        }),
        ...(role === 'TEACHER' && {
          teacher: {
            create: {
              teacherId: userId
            }
          }
        }),
        ...(role === 'REGISTRAR' && {
          registrar: {
            create: {
              registrarId: userId
            }
          }
        })
      },
      include: {
        profile: true
      }
    })

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        profile: {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName
        }
      }
    })
  } catch (error) {
    console.error('Create user error:', error)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User already exists' })
    }
    res.status(500).json({ error: 'Failed to create account' })
  }
})

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, status } = req.body
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true, student: true }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Update profile if name provided
    if (firstName || lastName) {
      await prisma.profile.update({
        where: { userId: id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName })
        }
      })
    }
    
    // Update email if provided
    if (email) {
      await prisma.user.update({
        where: { id },
        data: { email }
      })
    }
    
    // Update student status if provided and user is a student
    if (status && user.student) {
      await prisma.student.update({
        where: { id: user.student.id },
        data: { status }
      })
    }
    
    // Fetch updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: { profile: true, student: true }
    })
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        userId: updatedUser.userId,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.student?.status || 'ACTIVE',
        profile: updatedUser.profile ? {
          firstName: updatedUser.profile.firstName,
          lastName: updatedUser.profile.lastName
        } : null
      }
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// POST /api/users/:id/reset-password - Reset user password to default
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params
    const defaultPassword = 'passwordtest123'
    
    const user = await prisma.user.findUnique({ where: { id } })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)
    
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        mustChangePassword: true
      }
    })
    
    res.json({
      message: 'Password reset successfully',
      defaultPassword
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Failed to reset password' })
  }
})

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: { student: true, teacher: true, registrar: true }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Prevent deleting super admin
    if (user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Cannot delete super admin' })
    }
    
    // Delete related records first (cascade)
    if (user.student) {
      await prisma.student.delete({ where: { id: user.student.id } })
    }
    if (user.teacher) {
      await prisma.teacher.delete({ where: { id: user.teacher.id } })
    }
    if (user.registrar) {
      await prisma.registrar.delete({ where: { id: user.registrar.id } })
    }
    
    // Delete profile
    await prisma.profile.deleteMany({ where: { userId: id } })
    
    // Delete user
    await prisma.user.delete({ where: { id } })
    
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
