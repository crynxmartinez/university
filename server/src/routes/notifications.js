// Phase 6.3: Real-time notifications (polling-based for Vercel compatibility)
import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/notifications - Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { unreadOnly, limit = 20, offset = 0 } = req.query

    const where = { userId: req.user.id }
    if (unreadOnly === 'true') {
      where.isRead = false
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
    ])

    res.json({
      notifications,
      total,
      unreadCount,
      hasMore: parseInt(offset) + notifications.length < total
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Failed to get notifications' })
  }
})

// GET /api/notifications/unread-count - Quick check for unread count (for polling)
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    })
    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
})

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    })

    res.json(updated)
  } catch (error) {
    console.error('Mark read error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
})

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    })

    res.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark all read error:', error)
    res.status(500).json({ error: 'Failed to mark notifications as read' })
  }
})

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id }
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await prisma.notification.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Notification deleted' })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

// DELETE /api/notifications - Delete all read notifications
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: { userId: req.user.id, isRead: true }
    })

    res.json({ message: `${result.count} notifications deleted` })
  } catch (error) {
    console.error('Delete all error:', error)
    res.status(500).json({ error: 'Failed to delete notifications' })
  }
})

export default router

// Helper function to create notifications (used by other routes)
export async function createNotification(userId, type, title, message, options = {}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        courseId: options.courseId || null,
        sessionId: options.sessionId || null,
        scheduledFor: options.scheduledFor || new Date()
      }
    })
  } catch (error) {
    console.error('Create notification error:', error)
    return null
  }
}

// Notification types
export const NotificationTypes = {
  ENROLLMENT_APPROVED: 'enrollment_approved',
  ENROLLMENT_REJECTED: 'enrollment_rejected',
  PAYMENT_APPROVED: 'payment_approved',
  PAYMENT_REJECTED: 'payment_rejected',
  SESSION_REMINDER: 'session_reminder',
  SESSION_CANCELLED: 'session_cancelled',
  EXAM_AVAILABLE: 'exam_available',
  GRADE_POSTED: 'grade_posted',
  CERTIFICATE_ISSUED: 'certificate_issued',
  ONE_ON_ONE_APPROVED: 'one_on_one_approved',
  ONE_ON_ONE_REJECTED: 'one_on_one_rejected',
  ANNOUNCEMENT: 'announcement',
  MESSAGE: 'message'
}
