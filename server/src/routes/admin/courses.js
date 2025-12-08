import express from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../../lib/prisma.js'
import { generateUniqueSlug } from '../../lib/slugify.js'

const router = express.Router()

// Middleware to verify token and require SUPER_ADMIN
const requireAdmin = async (req, res, next) => {
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

// ============ COURSE CRUD ============

// GET /api/admin/courses - Get all courses with details
router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        teacher: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        createdBy: {
          include: { profile: true }
        },
        modules: {
          include: {
            lessons: true
          },
          orderBy: { order: 'asc' }
        },
        sessions: {
          orderBy: { date: 'asc' }
        },
        enrollments: true,
        exams: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(courses)
  } catch (error) {
    console.error('Get courses error:', error)
    res.status(500).json({ error: 'Failed to fetch courses' })
  }
})

// GET /api/admin/courses/teachers - Get all teachers for assignment dropdown
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          include: { profile: true }
        }
      }
    })
    res.json(teachers)
  } catch (error) {
    console.error('Get teachers error:', error)
    res.status(500).json({ error: 'Failed to fetch teachers' })
  }
})

// GET /api/admin/courses/:id - Get single course with full details
router.get('/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        createdBy: {
          include: { profile: true }
        },
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        sessions: {
          include: {
            materials: true,
            lesson: true,
            exam: true
          },
          orderBy: { date: 'asc' }
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: { include: { profile: true } }
              }
            }
          }
        },
        exams: {
          include: {
            questions: {
              include: { choices: true },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    res.json(course)
  } catch (error) {
    console.error('Get course error:', error)
    res.status(500).json({ error: 'Failed to fetch course' })
  }
})

// POST /api/admin/courses - Create a new course
router.post('/', async (req, res) => {
  try {
    const { name, description, type, teacherId, price, priceType, startDate, endDate, enrollmentEnd } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Course name is required' })
    }

    // Generate unique slug from course name
    const slug = await generateUniqueSlug(name)

    const course = await prisma.course.create({
      data: {
        name,
        slug,
        description: description || '',
        type: type || 'RECORDED',
        price: price ? parseFloat(price) : 0,
        priceType: priceType || 'ONE_TIME',
        isActive: false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        enrollmentEnd: enrollmentEnd ? new Date(enrollmentEnd) : null,
        teacherId: teacherId || null,
        createdById: req.user.id  // Track who created the course (admin)
      },
      include: {
        teacher: {
          include: {
            user: { include: { profile: true } }
          }
        },
        createdBy: {
          include: { profile: true }
        },
        modules: true,
        sessions: true
      }
    })

    res.status(201).json(course)
  } catch (error) {
    console.error('Create course error:', error)
    res.status(500).json({ error: 'Failed to create course' })
  }
})

// PUT /api/admin/courses/:id - Update a course
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, type, teacherId, price, priceType, isActive, startDate, endDate, enrollmentEnd } = req.body

    const existing = await prisma.course.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Regenerate slug if name changed
    let slug = existing.slug
    if (name && name !== existing.name) {
      slug = await generateUniqueSlug(name, id)
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        name: name || existing.name,
        slug,
        description: description !== undefined ? description : existing.description,
        type: type || existing.type,
        teacherId: teacherId !== undefined ? teacherId : existing.teacherId,
        price: price !== undefined ? parseFloat(price) : existing.price,
        priceType: priceType || existing.priceType,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        enrollmentEnd: enrollmentEnd !== undefined ? (enrollmentEnd ? new Date(enrollmentEnd) : null) : existing.enrollmentEnd
      },
      include: {
        teacher: {
          include: {
            user: { include: { profile: true } }
          }
        },
        modules: true,
        sessions: true
      }
    })

    res.json(course)
  } catch (error) {
    console.error('Update course error:', error)
    res.status(500).json({ error: 'Failed to update course' })
  }
})

// PUT /api/admin/courses/:id/toggle-active - Toggle course active status
router.put('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.course.findUnique({
      where: { id },
      include: { sessions: true }
    })
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // For LIVE courses, require at least one session before activating
    if (!existing.isActive && existing.type === 'LIVE' && existing.sessions.length === 0) {
      return res.status(400).json({ error: 'LIVE courses need at least one session before activation' })
    }

    const course = await prisma.course.update({
      where: { id },
      data: { isActive: !existing.isActive },
      include: { modules: true, sessions: true }
    })

    res.json(course)
  } catch (error) {
    console.error('Toggle course active error:', error)
    res.status(500).json({ error: 'Failed to toggle course status' })
  }
})

// DELETE /api/admin/courses/:id - Delete a course
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.course.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' })
    }

    await prisma.course.delete({ where: { id } })

    res.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    res.status(500).json({ error: 'Failed to delete course' })
  }
})

// ============ MODULE CRUD ============

// POST /api/admin/courses/:courseId/modules - Create a module
router.post('/:courseId/modules', async (req, res) => {
  try {
    const { courseId } = req.params
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Module name is required' })
    }

    // Get max order
    const maxOrder = await prisma.module.aggregate({
      where: { courseId },
      _max: { order: true }
    })

    const module = await prisma.module.create({
      data: {
        name,
        courseId,
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

// PUT /api/admin/courses/modules/:moduleId - Update a module
router.put('/modules/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params
    const { name } = req.body

    const module = await prisma.module.update({
      where: { id: moduleId },
      data: { name },
      include: { lessons: true }
    })

    res.json(module)
  } catch (error) {
    console.error('Update module error:', error)
    res.status(500).json({ error: 'Failed to update module' })
  }
})

// DELETE /api/admin/courses/modules/:moduleId - Delete a module
router.delete('/modules/:moduleId', async (req, res) => {
  try {
    const { moduleId } = req.params

    await prisma.module.delete({ where: { id: moduleId } })

    res.json({ message: 'Module deleted successfully' })
  } catch (error) {
    console.error('Delete module error:', error)
    res.status(500).json({ error: 'Failed to delete module' })
  }
})

// PUT /api/admin/courses/:courseId/modules/reorder - Reorder modules
router.put('/:courseId/modules/reorder', async (req, res) => {
  try {
    const { moduleIds } = req.body

    await Promise.all(
      moduleIds.map((id, index) =>
        prisma.module.update({
          where: { id },
          data: { order: index + 1 }
        })
      )
    )

    res.json({ message: 'Modules reordered successfully' })
  } catch (error) {
    console.error('Reorder modules error:', error)
    res.status(500).json({ error: 'Failed to reorder modules' })
  }
})

// ============ LESSON CRUD ============

// POST /api/admin/courses/modules/:moduleId/lessons - Create a lesson
router.post('/modules/:moduleId/lessons', async (req, res) => {
  try {
    const { moduleId } = req.params
    const { name, description, materials, videoUrl } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Lesson name is required' })
    }

    // Get max order
    const maxOrder = await prisma.lesson.aggregate({
      where: { moduleId },
      _max: { order: true }
    })

    const lesson = await prisma.lesson.create({
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

// PUT /api/admin/courses/lessons/:lessonId - Update a lesson
router.put('/lessons/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params
    const { name, description, materials, videoUrl } = req.body

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { name, description, materials, videoUrl }
    })

    res.json(lesson)
  } catch (error) {
    console.error('Update lesson error:', error)
    res.status(500).json({ error: 'Failed to update lesson' })
  }
})

// DELETE /api/admin/courses/lessons/:lessonId - Delete a lesson
router.delete('/lessons/:lessonId', async (req, res) => {
  try {
    const { lessonId } = req.params

    await prisma.lesson.delete({ where: { id: lessonId } })

    res.json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    console.error('Delete lesson error:', error)
    res.status(500).json({ error: 'Failed to delete lesson' })
  }
})

// PUT /api/admin/courses/modules/:moduleId/lessons/reorder - Reorder lessons
router.put('/modules/:moduleId/lessons/reorder', async (req, res) => {
  try {
    const { lessonIds } = req.body

    await Promise.all(
      lessonIds.map((id, index) =>
        prisma.lesson.update({
          where: { id },
          data: { order: index + 1 }
        })
      )
    )

    res.json({ message: 'Lessons reordered successfully' })
  } catch (error) {
    console.error('Reorder lessons error:', error)
    res.status(500).json({ error: 'Failed to reorder lessons' })
  }
})

// ============ SESSION CRUD ============

// GET /api/admin/courses/:courseId/sessions - Get all sessions for a course
router.get('/:courseId/sessions', async (req, res) => {
  try {
    const sessions = await prisma.scheduledSession.findMany({
      where: { courseId: req.params.courseId },
      include: {
        materials: true,
        lesson: true,
        exam: true
      },
      orderBy: { date: 'asc' }
    })
    res.json(sessions)
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

// POST /api/admin/courses/:courseId/sessions - Create a session
router.post('/:courseId/sessions', async (req, res) => {
  try {
    const { courseId } = req.params
    const { lessonId, examId, date, startTime, endTime, type, meetingLink, notes } = req.body

    const session = await prisma.scheduledSession.create({
      data: {
        courseId,
        lessonId: lessonId || null,
        examId: examId || null,
        date: new Date(date),
        startTime,
        endTime,
        type: type || 'CLASS',
        meetingLink,
        notes
      },
      include: {
        materials: true,
        lesson: true,
        exam: true
      }
    })

    res.status(201).json(session)
  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// PUT /api/admin/courses/sessions/:sessionId - Update a session
router.put('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { lessonId, examId, date, startTime, endTime, type, meetingLink, notes } = req.body

    const session = await prisma.scheduledSession.update({
      where: { id: sessionId },
      data: {
        lessonId: lessonId || null,
        examId: examId || null,
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        type,
        meetingLink,
        notes
      },
      include: {
        materials: true,
        lesson: true,
        exam: true
      }
    })

    res.json(session)
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({ error: 'Failed to update session' })
  }
})

// DELETE /api/admin/courses/sessions/:sessionId - Delete a session
router.delete('/sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params

    await prisma.scheduledSession.delete({ where: { id: sessionId } })

    res.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

// ============ SESSION MATERIALS ============

// POST /api/admin/courses/sessions/:sessionId/materials - Add material
router.post('/sessions/:sessionId/materials', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { name, driveUrl } = req.body

    const material = await prisma.sessionMaterial.create({
      data: {
        sessionId,
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

// DELETE /api/admin/courses/materials/:materialId - Delete material
router.delete('/materials/:materialId', async (req, res) => {
  try {
    const { materialId } = req.params

    await prisma.sessionMaterial.delete({ where: { id: materialId } })

    res.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Delete material error:', error)
    res.status(500).json({ error: 'Failed to delete material' })
  }
})

// ============ ATTENDANCE ============

// GET /api/admin/courses/sessions/:sessionId/attendance - Get attendance for a session
router.get('/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const { sessionId } = req.params

    const session = await prisma.scheduledSession.findUnique({
      where: { id: sessionId },
      include: { course: true }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Get all enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: session.courseId },
      include: {
        student: {
          include: {
            user: { include: { profile: true } }
          }
        }
      }
    })

    // Get existing attendance records
    const attendanceRecords = await prisma.sessionAttendance.findMany({
      where: { sessionId }
    })

    // Map attendance to students
    const attendance = enrollments.map(enrollment => {
      const record = attendanceRecords.find(a => a.studentId === enrollment.student.id)
      return {
        studentId: enrollment.student.id,
        name: enrollment.student.user.profile?.fullName || 'Unknown',
        status: record?.status || 'ABSENT',
        joinedAt: record?.joinedAt
      }
    })

    res.json(attendance)
  } catch (error) {
    console.error('Get attendance error:', error)
    res.status(500).json({ error: 'Failed to fetch attendance' })
  }
})

// PUT /api/admin/courses/sessions/:sessionId/attendance - Update attendance
router.put('/sessions/:sessionId/attendance', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { attendance } = req.body // Array of { studentId, status }

    for (const record of attendance) {
      await prisma.sessionAttendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId,
            studentId: record.studentId
          }
        },
        update: {
          status: record.status,
          markedBy: 'ADMIN'
        },
        create: {
          sessionId,
          studentId: record.studentId,
          status: record.status,
          markedBy: 'ADMIN'
        }
      })
    }

    res.json({ message: 'Attendance updated successfully' })
  } catch (error) {
    console.error('Update attendance error:', error)
    res.status(500).json({ error: 'Failed to update attendance' })
  }
})

// ============ ENROLLED STUDENTS ============

// GET /api/admin/courses/:courseId/students - Get enrolled students
router.get('/:courseId/students', async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: req.params.courseId },
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

// POST /api/admin/courses/:courseId/students - Enroll a student
router.post('/:courseId/students', async (req, res) => {
  try {
    const { courseId } = req.params
    const { studentId } = req.body

    // Check if already enrolled
    const existing = await prisma.enrollment.findFirst({
      where: { courseId, studentId }
    })

    if (existing) {
      return res.status(400).json({ error: 'Student already enrolled' })
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        courseId,
        studentId
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

// DELETE /api/admin/courses/:courseId/students/:studentId - Remove student
router.delete('/:courseId/students/:studentId', async (req, res) => {
  try {
    const { courseId, studentId } = req.params

    await prisma.enrollment.deleteMany({
      where: { courseId, studentId }
    })

    res.json({ message: 'Student removed successfully' })
  } catch (error) {
    console.error('Remove student error:', error)
    res.status(500).json({ error: 'Failed to remove student' })
  }
})

// ============ ALL STUDENTS (for admin dashboard) ============

// GET /api/admin/courses/all-students - Get all students with their enrollments
router.get('/all-students', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { include: { profile: true } },
        enrollments: {
          include: { course: true }
        },
        programEnrollments: {
          include: { program: true }
        }
      }
    })
    res.json(students)
  } catch (error) {
    console.error('Get all students error:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

// ============ ALL SESSIONS (for admin schedule) ============

// GET /api/admin/courses/all-sessions - Get all sessions across all courses
router.get('/all-sessions', async (req, res) => {
  try {
    const courseSessions = await prisma.scheduledSession.findMany({
      include: {
        course: true,
        lesson: true,
        exam: true
      },
      orderBy: { date: 'asc' }
    })

    const programSessions = await prisma.programSession.findMany({
      include: {
        program: true,
        lesson: true,
        exam: true
      },
      orderBy: { date: 'asc' }
    })

    res.json({
      courseSessions,
      programSessions
    })
  } catch (error) {
    console.error('Get all sessions error:', error)
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

export default router
