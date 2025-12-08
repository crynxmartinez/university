import express from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../../lib/prisma.js'

const router = express.Router()

// Middleware to verify token and require SUPER_ADMIN
const requireAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

// All routes require SUPER_ADMIN role
router.use(requireAdmin)

// ============ PROGRAM CRUD ============

// GET /api/admin/programs - Get all programs with details
router.get('/', async (req, res) => {
  try {
    const programs = await prisma.program.findMany({
      include: {
        teacher: {
          include: {
            user: { include: { profile: true } }
          }
        },
        modules: {
          include: {
            lessons: true
          },
          orderBy: { order: 'asc' }
        },
        exams: {
          orderBy: { order: 'asc' }
        },
        sessions: {
          orderBy: { date: 'asc' }
        },
        enrollments: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(programs)
  } catch (error) {
    console.error('Get programs error:', error)
    res.status(500).json({ error: 'Failed to fetch programs' })
  }
})

// GET /api/admin/programs/:id - Get single program with full details
router.get('/:id', async (req, res) => {
  try {
    const program = await prisma.program.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: {
          include: {
            user: { include: { profile: true } }
          }
        },
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        exams: {
          include: {
            questions: {
              include: { choices: true },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        sessions: {
          include: {
            lesson: true,
            exam: true,
            materials: true
          },
          orderBy: { date: 'asc' }
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  include: { profile: true }
                }
              }
            }
          }
        }
      }
    })
    
    if (!program) {
      return res.status(404).json({ error: 'Program not found' })
    }
    
    res.json(program)
  } catch (error) {
    console.error('Get program error:', error)
    res.status(500).json({ error: 'Failed to fetch program' })
  }
})

// POST /api/admin/programs - Create program
router.post('/', async (req, res) => {
  try {
    const { name, description, programType, teacherId, startDate, endDate, enrollmentEnd, image } = req.body
    
    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
    
    const program = await prisma.program.create({
      data: {
        slug,
        name,
        description,
        programType: programType || 'ONLINE',
        teacherId: teacherId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        enrollmentEnd: enrollmentEnd ? new Date(enrollmentEnd) : null,
        image,
        isActive: false
      },
      include: {
        teacher: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    })
    
    res.status(201).json(program)
  } catch (error) {
    console.error('Create program error:', error)
    res.status(500).json({ error: 'Failed to create program' })
  }
})

// PUT /api/admin/programs/:id - Update program
router.put('/:id', async (req, res) => {
  try {
    const { name, description, programType, teacherId, startDate, endDate, enrollmentEnd, image, isActive } = req.body
    
    const program = await prisma.program.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        programType,
        teacherId: teacherId !== undefined ? teacherId : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        enrollmentEnd: enrollmentEnd !== undefined ? (enrollmentEnd ? new Date(enrollmentEnd) : null) : undefined,
        image,
        isActive
      },
      include: {
        teacher: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    })
    
    res.json(program)
  } catch (error) {
    console.error('Update program error:', error)
    res.status(500).json({ error: 'Failed to update program' })
  }
})

// PUT /api/admin/programs/:id/toggle-active - Toggle program active status
router.put('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.program.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ error: 'Program not found' })
    }

    const program = await prisma.program.update({
      where: { id },
      data: { isActive: !existing.isActive }
    })

    res.json(program)
  } catch (error) {
    console.error('Toggle program active error:', error)
    res.status(500).json({ error: 'Failed to toggle program status' })
  }
})

// DELETE /api/admin/programs/:id - Delete program
router.delete('/:id', async (req, res) => {
  try {
    await prisma.program.delete({
      where: { id: req.params.id }
    })
    res.json({ message: 'Program deleted' })
  } catch (error) {
    console.error('Delete program error:', error)
    res.status(500).json({ error: 'Failed to delete program' })
  }
})

// ============ MODULE CRUD ============

// POST /api/admin/programs/:programId/modules - Create module
router.post('/:programId/modules', async (req, res) => {
  try {
    const { name } = req.body
    const { programId } = req.params
    
    // Get max order
    const maxOrder = await prisma.programModule.aggregate({
      where: { programId },
      _max: { order: true }
    })
    
    const module = await prisma.programModule.create({
      data: {
        name,
        programId,
        order: (maxOrder._max.order || 0) + 1
      },
      include: { lessons: true }
    })
    
    res.status(201).json(module)
  } catch (error) {
    console.error('Create module error:', error)
    res.status(500).json({ error: 'Failed to create module' })
  }
})

// PUT /api/admin/programs/modules/:moduleId - Update module
router.put('/modules/:moduleId', async (req, res) => {
  try {
    const { name } = req.body
    
    const module = await prisma.programModule.update({
      where: { id: req.params.moduleId },
      data: { name },
      include: { lessons: true }
    })
    
    res.json(module)
  } catch (error) {
    console.error('Update module error:', error)
    res.status(500).json({ error: 'Failed to update module' })
  }
})

// DELETE /api/admin/programs/modules/:moduleId - Delete module
router.delete('/modules/:moduleId', async (req, res) => {
  try {
    await prisma.programModule.delete({
      where: { id: req.params.moduleId }
    })
    res.json({ message: 'Module deleted' })
  } catch (error) {
    console.error('Delete module error:', error)
    res.status(500).json({ error: 'Failed to delete module' })
  }
})

// PUT /api/admin/programs/:programId/modules/reorder - Reorder modules
router.put('/:programId/modules/reorder', async (req, res) => {
  try {
    const { moduleIds } = req.body
    
    await Promise.all(
      moduleIds.map((id, index) =>
        prisma.programModule.update({
          where: { id },
          data: { order: index }
        })
      )
    )
    
    res.json({ message: 'Modules reordered' })
  } catch (error) {
    console.error('Reorder modules error:', error)
    res.status(500).json({ error: 'Failed to reorder modules' })
  }
})

// ============ LESSON CRUD ============

// POST /api/admin/programs/modules/:moduleId/lessons - Create lesson
router.post('/modules/:moduleId/lessons', async (req, res) => {
  try {
    const { name, description, materials, videoUrl } = req.body
    const { moduleId } = req.params
    
    // Get max order
    const maxOrder = await prisma.programLesson.aggregate({
      where: { moduleId },
      _max: { order: true }
    })
    
    const lesson = await prisma.programLesson.create({
      data: {
        name,
        description,
        materials,
        videoUrl,
        moduleId,
        order: (maxOrder._max.order || 0) + 1
      }
    })
    
    res.status(201).json(lesson)
  } catch (error) {
    console.error('Create lesson error:', error)
    res.status(500).json({ error: 'Failed to create lesson' })
  }
})

// PUT /api/admin/programs/lessons/:lessonId - Update lesson
router.put('/lessons/:lessonId', async (req, res) => {
  try {
    const { name, description, materials, videoUrl } = req.body
    
    const lesson = await prisma.programLesson.update({
      where: { id: req.params.lessonId },
      data: { name, description, materials, videoUrl }
    })
    
    res.json(lesson)
  } catch (error) {
    console.error('Update lesson error:', error)
    res.status(500).json({ error: 'Failed to update lesson' })
  }
})

// DELETE /api/admin/programs/lessons/:lessonId - Delete lesson
router.delete('/lessons/:lessonId', async (req, res) => {
  try {
    await prisma.programLesson.delete({
      where: { id: req.params.lessonId }
    })
    res.json({ message: 'Lesson deleted' })
  } catch (error) {
    console.error('Delete lesson error:', error)
    res.status(500).json({ error: 'Failed to delete lesson' })
  }
})

// PUT /api/admin/programs/modules/:moduleId/lessons/reorder - Reorder lessons
router.put('/modules/:moduleId/lessons/reorder', async (req, res) => {
  try {
    const { lessonIds } = req.body
    
    await Promise.all(
      lessonIds.map((id, index) =>
        prisma.programLesson.update({
          where: { id },
          data: { order: index }
        })
      )
    )
    
    res.json({ message: 'Lessons reordered' })
  } catch (error) {
    console.error('Reorder lessons error:', error)
    res.status(500).json({ error: 'Failed to reorder lessons' })
  }
})

// ============ SESSION CRUD ============

// GET /api/admin/programs/:programId/sessions - Get program sessions
router.get('/:programId/sessions', async (req, res) => {
  try {
    const sessions = await prisma.programSession.findMany({
      where: { programId: req.params.programId },
      include: {
        lesson: true,
        exam: true,
        materials: true,
        attendance: {
          include: {
            student: {
              include: {
                user: { include: { profile: true } }
              }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    })
    res.json(sessions)
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

// POST /api/admin/programs/:programId/sessions - Create session
router.post('/:programId/sessions', async (req, res) => {
  try {
    const { date, startTime, endTime, type, lessonId, examId, meetingLink, notes } = req.body
    const { programId } = req.params
    
    const session = await prisma.programSession.create({
      data: {
        programId,
        date: new Date(date),
        startTime,
        endTime,
        type: type || 'CLASS',
        lessonId: lessonId || null,
        examId: examId || null,
        meetingLink,
        notes
      },
      include: {
        lesson: true,
        exam: true,
        materials: true
      }
    })
    
    res.status(201).json(session)
  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// PUT /api/admin/programs/sessions/:sessionId - Update session
router.put('/sessions/:sessionId', async (req, res) => {
  try {
    const { date, startTime, endTime, type, lessonId, examId, meetingLink, notes } = req.body
    
    const session = await prisma.programSession.update({
      where: { id: req.params.sessionId },
      data: {
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        type,
        lessonId: lessonId || null,
        examId: examId || null,
        meetingLink,
        notes
      },
      include: {
        lesson: true,
        exam: true,
        materials: true
      }
    })
    
    res.json(session)
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({ error: 'Failed to update session' })
  }
})

// DELETE /api/admin/programs/sessions/:sessionId - Delete session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    await prisma.programSession.delete({
      where: { id: req.params.sessionId }
    })
    res.json({ message: 'Session deleted' })
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

// POST /api/admin/programs/sessions/:sessionId/materials - Add material
router.post('/sessions/:sessionId/materials', async (req, res) => {
  try {
    const { name, driveUrl } = req.body
    
    const material = await prisma.programSessionMaterial.create({
      data: {
        sessionId: req.params.sessionId,
        name,
        driveUrl
      }
    })
    
    res.status(201).json(material)
  } catch (error) {
    console.error('Add material error:', error)
    res.status(500).json({ error: 'Failed to add material' })
  }
})

// DELETE /api/admin/programs/materials/:materialId - Delete material
router.delete('/materials/:materialId', async (req, res) => {
  try {
    await prisma.programSessionMaterial.delete({
      where: { id: req.params.materialId }
    })
    res.json({ message: 'Material deleted' })
  } catch (error) {
    console.error('Delete material error:', error)
    res.status(500).json({ error: 'Failed to delete material' })
  }
})

// ============ ATTENDANCE ============

// GET /api/admin/programs/sessions/:sessionId/attendance - Get attendance
router.get('/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const { sessionId } = req.params
    
    // Get session with program enrollments
    const session = await prisma.programSession.findUnique({
      where: { id: sessionId },
      include: {
        program: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              include: {
                student: {
                  include: {
                    user: { include: { profile: true } }
                  }
                }
              }
            }
          }
        },
        attendance: true
      }
    })
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }
    
    // Map enrollments to attendance status
    const attendanceList = session.program.enrollments.map(enrollment => {
      const record = session.attendance.find(a => a.studentId === enrollment.student?.user?.student?.id)
      return {
        odId: enrollment.studentId,
        name: enrollment.student?.user?.profile?.fullName || 'Unknown',
        status: record?.status || 'ABSENT',
        joinedAt: record?.joinedAt
      }
    })
    
    res.json(attendanceList)
  } catch (error) {
    console.error('Get attendance error:', error)
    res.status(500).json({ error: 'Failed to fetch attendance' })
  }
})

// PUT /api/admin/programs/sessions/:sessionId/attendance - Update attendance
router.put('/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { attendance } = req.body // Array of { odId, status }
    
    for (const record of attendance) {
      // Find student by odId (userId from ProgramEnrollment)
      const enrollment = await prisma.programEnrollment.findFirst({
        where: { studentId: record.odId },
        include: { student: true }
      })
      
      if (!enrollment) continue
      
      // Get actual student ID
      const student = await prisma.student.findFirst({
        where: { userId: record.odId }
      })
      
      if (!student) continue
      
      await prisma.programAttendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: student.id
          }
        },
        update: {
          status: record.status,
          markedBy: 'ADMIN'
        },
        create: {
          sessionId,
          studentId: student.id,
          status: record.status,
          markedBy: 'ADMIN'
        }
      })
    }
    
    res.json({ message: 'Attendance updated' })
  } catch (error) {
    console.error('Update attendance error:', error)
    res.status(500).json({ error: 'Failed to update attendance' })
  }
})

// ============ ENROLLED STUDENTS ============

// GET /api/admin/programs/:programId/students - Get enrolled students
router.get('/:programId/students', async (req, res) => {
  try {
    const enrollments = await prisma.programEnrollment.findMany({
      where: { programId: req.params.programId },
      include: {
        student: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    })
    
    res.json(enrollments)
  } catch (error) {
    console.error('Get students error:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

// POST /api/admin/programs/:programId/students - Enroll a student
router.post('/:programId/students', async (req, res) => {
  try {
    const { programId } = req.params
    const { studentId } = req.body

    // Check if already enrolled
    const existing = await prisma.programEnrollment.findFirst({
      where: { programId, studentId }
    })

    if (existing) {
      return res.status(400).json({ error: 'Student already enrolled' })
    }

    const enrollment = await prisma.programEnrollment.create({
      data: {
        programId,
        studentId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    })

    res.status(201).json(enrollment)
  } catch (error) {
    console.error('Enroll student error:', error)
    res.status(500).json({ error: 'Failed to enroll student' })
  }
})

// DELETE /api/admin/programs/:programId/students/:studentId - Remove student
router.delete('/:programId/students/:studentId', async (req, res) => {
  try {
    const { programId, studentId } = req.params

    await prisma.programEnrollment.deleteMany({
      where: { programId, studentId }
    })

    res.json({ message: 'Student removed successfully' })
  } catch (error) {
    console.error('Remove student error:', error)
    res.status(500).json({ error: 'Failed to remove student' })
  }
})

export default router
