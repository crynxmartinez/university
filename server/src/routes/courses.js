import express from 'express'
import prisma from '../lib/prisma.js'
import jwt from 'jsonwebtoken'
import { generateUniqueSlug } from '../lib/slugify.js'

const router = express.Router()

// Helper function to auto-deactivate expired courses
const deactivateExpiredCourses = async () => {
  try {
    const now = new Date()
    await prisma.course.updateMany({
      where: {
        isActive: true,
        endDate: {
          lt: now
        }
      },
      data: {
        isActive: false
      }
    })
  } catch (error) {
    console.error('Failed to deactivate expired courses:', error)
  }
}

// GET /api/courses/public - Get all public courses (no auth required)
// Only returns ACTIVE courses that haven't ended
router.get('/public', async (req, res) => {
  try {
    // Auto-deactivate any expired courses first
    await deactivateExpiredCourses()
    
    const now = new Date()
    
    const courses = await prisma.course.findMany({
      where: { 
        isActive: true,
        // Exclude courses that have ended
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ]
      },
      include: {
        teacher: {
          include: {
            user: {
              include: { profile: true }
            }
          }
        },
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Add enrollment status info to each course
    const coursesWithStatus = courses.map(course => {
      const enrollmentOpen = !course.enrollmentEnd || new Date(course.enrollmentEnd) >= now
      const courseStarted = course.startDate ? new Date(course.startDate) <= now : true
      const isUpcoming = course.startDate ? new Date(course.startDate) > now : false
      
      return {
        ...course,
        enrollmentOpen,
        courseStarted,
        isUpcoming
      }
    })

    res.json(coursesWithStatus)
  } catch (error) {
    console.error('Get public courses error:', error)
    res.status(500).json({ error: 'Failed to get courses' })
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
      where: { id: decoded.id },
      include: { teacher: true }
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

// GET /api/courses - Get all courses for the logged-in teacher
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can access courses' })
    }

    const courses = await prisma.course.findMany({
      where: { teacherId: req.user.teacher.id },
      include: {
        modules: {
          include: {
            lessons: true
          },
          orderBy: { order: 'asc' }
        },
        sessions: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(courses)
  } catch (error) {
    console.error('Get courses error:', error)
    res.status(500).json({ error: 'Failed to get courses' })
  }
})

// GET /api/courses/:idOrSlug - Get a single course by ID or slug
router.get('/:idOrSlug', authenticate, async (req, res) => {
  try {
    const { idOrSlug } = req.params

    const includeOptions = {
      teacher: {
        include: {
          user: {
            include: { profile: true }
          }
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
      sessions: {
        include: {
          materials: true
        },
        orderBy: { date: 'asc' }
      },
      enrollments: true
    }

    // Try to find by slug first (more common with new URLs), then by ID
    let course = await prisma.course.findUnique({
      where: { slug: idOrSlug },
      include: includeOptions
    })

    // If not found by slug, try by ID
    if (!course) {
      try {
        course = await prisma.course.findUnique({
          where: { id: idOrSlug },
          include: includeOptions
        })
      } catch (e) {
        // Invalid ID format, course stays null
      }
    }

    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Check if user is the teacher of this course
    if (req.user.role === 'TEACHER' && course.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized to view this course' })
    }

    res.json(course)
  } catch (error) {
    console.error('Get course error:', error)
    res.status(500).json({ error: 'Failed to get course' })
  }
})

// POST /api/courses - Create a new course
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can create courses' })
    }

    const { name, description, type, startDate, endDate, enrollmentEnd } = req.body

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
        isActive: false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        enrollmentEnd: enrollmentEnd ? new Date(enrollmentEnd) : null,
        teacherId: req.user.teacher.id,
        createdById: req.user.id  // Track who created the course
      },
      include: {
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

// PUT /api/courses/:idOrSlug - Update a course
router.put('/:idOrSlug', authenticate, async (req, res) => {
  try {
    const { idOrSlug } = req.params
    const { name, description, type, isActive, startDate, endDate, enrollmentEnd } = req.body

    // Check ownership - support both id and slug
    let existing = await prisma.course.findUnique({ where: { id: idOrSlug } })
    if (!existing) {
      existing = await prisma.course.findUnique({ where: { slug: idOrSlug } })
    }
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (existing.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized to update this course' })
    }

    // Regenerate slug if name changed
    let slug = existing.slug
    if (name && name !== existing.name) {
      slug = await generateUniqueSlug(name, existing.id)
    }

    const course = await prisma.course.update({
      where: { id: existing.id },
      data: { 
        name, 
        slug,
        description, 
        type,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        enrollmentEnd: enrollmentEnd !== undefined ? (enrollmentEnd ? new Date(enrollmentEnd) : null) : existing.enrollmentEnd
      },
      include: { modules: true, sessions: true }
    })

    res.json(course)
  } catch (error) {
    console.error('Update course error:', error)
    res.status(500).json({ error: 'Failed to update course' })
  }
})

// PUT /api/courses/:idOrSlug/toggle-active - Toggle course active status
router.put('/:idOrSlug/toggle-active', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'TEACHER' || !req.user.teacher) {
      return res.status(403).json({ error: 'Only teachers can update courses' })
    }

    const { idOrSlug } = req.params

    // Check ownership - support both id and slug
    let existing = await prisma.course.findUnique({ 
      where: { id: idOrSlug },
      include: { sessions: true }
    })
    if (!existing) {
      existing = await prisma.course.findUnique({ 
        where: { slug: idOrSlug },
        include: { sessions: true }
      })
    }
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (existing.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized to update this course' })
    }

    // For LIVE courses, require at least one session before activating
    if (!existing.isActive && existing.type === 'LIVE' && existing.sessions.length === 0) {
      return res.status(400).json({ error: 'LIVE courses need at least one session before activation' })
    }

    const course = await prisma.course.update({
      where: { id: existing.id },
      data: { isActive: !existing.isActive },
      include: { modules: true, sessions: true }
    })

    res.json(course)
  } catch (error) {
    console.error('Toggle course active error:', error)
    res.status(500).json({ error: 'Failed to toggle course status' })
  }
})

// DELETE /api/courses/:idOrSlug - Delete a course
router.delete('/:idOrSlug', authenticate, async (req, res) => {
  try {
    const { idOrSlug } = req.params

    // Check ownership - support both id and slug
    let existing = await prisma.course.findUnique({ where: { id: idOrSlug } })
    if (!existing) {
      existing = await prisma.course.findUnique({ where: { slug: idOrSlug } })
    }
    if (!existing) {
      return res.status(404).json({ error: 'Course not found' })
    }
    if (existing.teacherId !== req.user.teacher?.id) {
      return res.status(403).json({ error: 'Not authorized to delete this course' })
    }

    await prisma.course.delete({ where: { id: existing.id } })

    res.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    res.status(500).json({ error: 'Failed to delete course' })
  }
})

export default router
