import express from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'

const router = express.Router()

// POST /api/users/create - Create a new account (Registrar, Teacher, or Student)
router.post('/create', async (req, res) => {
  try {
    const { firstName, lastName, password, role } = req.body

    if (!firstName || !lastName || !password || !role) {
      return res.status(400).json({ error: 'First name, last name, password, and role are required' })
    }

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
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        userId,
        email,
        password: hashedPassword,
        role,
        mustChangePassword: false,
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

export default router
