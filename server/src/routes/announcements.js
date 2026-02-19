import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// Get announcements for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { courseId, programId } = req.query

    // Build where clause based on user role and filters
    const whereClause = {
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      ]
    }

    // Filter by audience based on role
    if (req.user.role === 'STUDENT') {
      whereClause.AND.push({
        OR: [
          { targetAudience: 'ALL' },
          { targetAudience: 'STUDENTS' }
        ]
      })
    } else if (req.user.role === 'TEACHER') {
      whereClause.AND.push({
        OR: [
          { targetAudience: 'ALL' },
          { targetAudience: 'TEACHERS' }
        ]
      })
    }

    // Filter by course or program if specified
    if (courseId) {
      whereClause.AND.push({
        OR: [
          { courseId },
          { courseId: null }
        ]
      })
    }

    if (programId) {
      whereClause.AND.push({
        OR: [
          { programId },
          { programId: null }
        ]
      })
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: {
        author: {
          include: {
            profile: true
          }
        },
        course: true,
        program: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    res.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    res.status(500).json({ error: 'Failed to fetch announcements' })
  }
})

// Create announcement (Teacher/Admin)
router.post('/', authenticateToken, authorizeRoles(['TEACHER', 'SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { title, content, targetAudience, courseId, programId, priority, expiresAt } = req.body

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' })
    }

    // Teachers can only create announcements for their own courses/programs
    if (req.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.userId },
        include: {
          courses: true,
          programs: true
        }
      })

      if (courseId && !teacher.courses.some(c => c.id === courseId)) {
        return res.status(403).json({ error: 'Unauthorized - not your course' })
      }

      if (programId && !teacher.programs.some(p => p.id === programId)) {
        return res.status(403).json({ error: 'Unauthorized - not your program' })
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        authorId: req.user.userId,
        targetAudience: targetAudience || 'ALL',
        courseId: courseId || null,
        programId: programId || null,
        priority: priority || 'INFO',
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        author: {
          include: {
            profile: true
          }
        },
        course: true,
        program: true
      }
    })

    res.json(announcement)
  } catch (error) {
    console.error('Error creating announcement:', error)
    res.status(500).json({ error: 'Failed to create announcement' })
  }
})

// Update announcement
router.put('/:id', authenticateToken, authorizeRoles(['TEACHER', 'SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, targetAudience, priority, expiresAt } = req.body

    // Check if announcement exists and user is authorized
    const existing = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Only author or admin can update
    if (req.user.role === 'TEACHER' && existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(targetAudience && { targetAudience }),
        ...(priority && { priority }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null })
      },
      include: {
        author: {
          include: {
            profile: true
          }
        },
        course: true,
        program: true
      }
    })

    res.json(announcement)
  } catch (error) {
    console.error('Error updating announcement:', error)
    res.status(500).json({ error: 'Failed to update announcement' })
  }
})

// Delete announcement
router.delete('/:id', authenticateToken, authorizeRoles(['TEACHER', 'SUPER_ADMIN', 'REGISTRAR']), async (req, res) => {
  try {
    const { id } = req.params

    // Check if announcement exists and user is authorized
    const existing = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' })
    }

    // Only author or admin can delete
    if (req.user.role === 'TEACHER' && existing.authorId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    await prisma.announcement.delete({
      where: { id }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    res.status(500).json({ error: 'Failed to delete announcement' })
  }
})

export default router
