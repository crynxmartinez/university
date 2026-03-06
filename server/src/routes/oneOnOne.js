import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()

// Student creates a 1-on-1 request
router.post('/request', authenticateToken, authorizeRoles(['STUDENT']), async (req, res) => {
  try {
    const { courseOfferingId, programOfferingId, topic, studentNote, requestedDate, requestedTime, duration } = req.body

    if (!topic || !duration) {
      return res.status(400).json({ error: 'Topic and duration are required' })
    }

    if (!courseOfferingId && !programOfferingId) {
      return res.status(400).json({ error: 'Either courseOfferingId or programOfferingId is required' })
    }

    if (![30, 60].includes(duration)) {
      return res.status(400).json({ error: 'Duration must be 30 or 60 minutes' })
    }

    // Get student
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
    if (!student) return res.status(404).json({ error: 'Student profile not found' })

    // Check enrollment
    if (courseOfferingId) {
      const enrollment = await prisma.courseEnrollment.findFirst({
        where: { studentId: student.id, courseOfferingId, status: 'ACTIVE' }
      })
      if (!enrollment) return res.status(403).json({ error: 'You must be enrolled in this course' })
    } else {
      const enrollment = await prisma.programOfferingEnrollment.findFirst({
        where: { studentId: student.id, programOfferingId, status: 'ACTIVE' }
      })
      if (!enrollment) return res.status(403).json({ error: 'You must be enrolled in this program' })
    }

    // Get teacher
    const offering = courseOfferingId
      ? await prisma.courseOffering.findUnique({ where: { id: courseOfferingId } })
      : await prisma.programOffering.findUnique({ where: { id: programOfferingId } })
    
    if (!offering) return res.status(404).json({ error: 'Offering not found' })

    // Check limits: max 3 pending + 3 scheduled
    const existingRequests = await prisma.oneOnOneRequest.findMany({
      where: {
        studentId: student.id,
        status: { in: ['PENDING', 'PROPOSAL_SENT', 'SCHEDULED'] }
      }
    })

    const pendingCount = existingRequests.filter(r => ['PENDING', 'PROPOSAL_SENT'].includes(r.status)).length
    const scheduledCount = existingRequests.filter(r => r.status === 'SCHEDULED').length

    if (pendingCount >= 3) {
      return res.status(400).json({ error: 'You have reached the maximum of 3 pending requests' })
    }
    if (scheduledCount >= 3) {
      return res.status(400).json({ error: 'You have reached the maximum of 3 scheduled sessions' })
    }

    // Create request
    const request = await prisma.oneOnOneRequest.create({
      data: {
        studentId: student.id,
        teacherId: offering.teacherId,
        courseOfferingId: courseOfferingId || null,
        programOfferingId: programOfferingId || null,
        topic,
        studentNote,
        requestedDate: requestedDate ? new Date(requestedDate) : null,
        requestedTime,
        duration,
        status: 'PENDING'
      },
      include: {
        student: { include: { user: { include: { profile: true } } } },
        teacher: { include: { user: { include: { profile: true } } } },
        courseOffering: { include: { masterCourse: true } },
        programOffering: { include: { masterProgram: true } }
      }
    })

    res.json({ message: 'Request created successfully', request })
  } catch (error) {
    console.error('Error creating request:', error)
    res.status(500).json({ error: error.message })
  }
})

// Student gets their requests/sessions
router.get('/my-requests', authenticateToken, authorizeRoles(['STUDENT']), async (req, res) => {
  try {
    const { status } = req.query
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
    if (!student) return res.status(404).json({ error: 'Student profile not found' })

    const where = { studentId: student.id }
    if (status) where.status = status

    const requests = await prisma.oneOnOneRequest.findMany({
      where,
      include: {
        teacher: { include: { user: { include: { profile: true } } } },
        courseOffering: { include: { masterCourse: true, semester: true } },
        programOffering: { include: { masterProgram: true, semester: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(requests)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Student cancels request or session
router.delete('/:id', authenticateToken, authorizeRoles(['STUDENT']), async (req, res) => {
  try {
    const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
    if (!student) return res.status(404).json({ error: 'Student profile not found' })

    const request = await prisma.oneOnOneRequest.findUnique({ where: { id: req.params.id } })
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.studentId !== student.id) return res.status(403).json({ error: 'Unauthorized' })

    // If scheduled, check 24hr notice
    if (request.status === 'SCHEDULED' && request.scheduledAt) {
      const hoursUntil = (new Date(request.scheduledAt) - new Date()) / (1000 * 60 * 60)
      if (hoursUntil < 24) {
        return res.status(400).json({ error: 'You must cancel at least 24 hours before the scheduled time' })
      }
    }

    await prisma.oneOnOneRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: 'STUDENT',
        cancellationReason: req.body.reason || 'Cancelled by student'
      }
    })

    res.json({ message: 'Request cancelled' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Teacher gets incoming requests
router.get('/incoming', authenticateToken, authorizeRoles(['TEACHER']), async (req, res) => {
  try {
    const { status } = req.query
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } })
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' })

    const where = { teacherId: teacher.id }
    if (status) where.status = status

    const requests = await prisma.oneOnOneRequest.findMany({
      where,
      include: {
        student: { include: { user: { include: { profile: true } } } },
        courseOffering: { include: { masterCourse: true, semester: true } },
        programOffering: { include: { masterProgram: true, semester: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(requests)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Teacher responds to request (accept/decline/propose)
router.put('/:id/respond', authenticateToken, authorizeRoles(['TEACHER']), async (req, res) => {
  try {
    const { action, finalDate, finalTime, meetingLink, teacherNote, proposedDate, proposedTime, proposalReason, declineReason } = req.body

    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } })
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' })

    const request = await prisma.oneOnOneRequest.findUnique({ where: { id: req.params.id } })
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.teacherId !== teacher.id) return res.status(403).json({ error: 'Unauthorized' })

    if (!['ACCEPT', 'DECLINE', 'PROPOSE'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' })
    }

    let updateData = { respondedAt: new Date() }

    if (action === 'ACCEPT') {
      if (!finalDate || !finalTime || !meetingLink) {
        return res.status(400).json({ error: 'finalDate, finalTime, and meetingLink are required' })
      }
      updateData = {
        ...updateData,
        status: 'SCHEDULED',
        finalDate: new Date(finalDate),
        finalTime,
        meetingLink,
        teacherNote,
        scheduledAt: new Date(`${finalDate}T${finalTime}`)
      }
    } else if (action === 'DECLINE') {
      updateData = {
        ...updateData,
        status: 'DECLINED',
        declineReason: declineReason || 'Declined by teacher'
      }
    } else if (action === 'PROPOSE') {
      if (!proposedDate || !proposedTime) {
        return res.status(400).json({ error: 'proposedDate and proposedTime are required' })
      }
      updateData = {
        ...updateData,
        status: 'PROPOSAL_SENT',
        proposedDate: new Date(proposedDate),
        proposedTime,
        proposalReason
      }
    }

    const updated = await prisma.oneOnOneRequest.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        student: { include: { user: { include: { profile: true } } } },
        teacher: { include: { user: { include: { profile: true } } } },
        courseOffering: { include: { masterCourse: true } },
        programOffering: { include: { masterProgram: true } }
      }
    })

    res.json({ message: 'Response sent', request: updated })
  } catch (error) {
    console.error('Error responding to request:', error)
    res.status(500).json({ error: error.message })
  }
})

// Student accepts/declines teacher's proposal
router.put('/:id/proposal-response', authenticateToken, authorizeRoles(['STUDENT']), async (req, res) => {
  try {
    const { accept, meetingLink } = req.body

    const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
    if (!student) return res.status(404).json({ error: 'Student profile not found' })

    const request = await prisma.oneOnOneRequest.findUnique({ where: { id: req.params.id } })
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.studentId !== student.id) return res.status(403).json({ error: 'Unauthorized' })
    if (request.status !== 'PROPOSAL_SENT') {
      return res.status(400).json({ error: 'No proposal to respond to' })
    }

    let updateData
    if (accept) {
      if (!meetingLink) {
        return res.status(400).json({ error: 'Meeting link is required when accepting proposal' })
      }
      updateData = {
        status: 'SCHEDULED',
        finalDate: request.proposedDate,
        finalTime: request.proposedTime,
        meetingLink,
        scheduledAt: new Date(`${request.proposedDate.toISOString().split('T')[0]}T${request.proposedTime}`)
      }
    } else {
      updateData = { status: 'PENDING', proposedDate: null, proposedTime: null, proposalReason: null }
    }

    const updated = await prisma.oneOnOneRequest.update({
      where: { id: req.params.id },
      data: updateData
    })

    res.json({ message: accept ? 'Proposal accepted' : 'Proposal declined', request: updated })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Teacher cancels scheduled session
router.put('/:id/cancel', authenticateToken, authorizeRoles(['TEACHER']), async (req, res) => {
  try {
    const { reason } = req.body

    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } })
    if (!teacher) return res.status(404).json({ error: 'Teacher profile not found' })

    const request = await prisma.oneOnOneRequest.findUnique({ where: { id: req.params.id } })
    if (!request) return res.status(404).json({ error: 'Request not found' })
    if (request.teacherId !== teacher.id) return res.status(403).json({ error: 'Unauthorized' })

    await prisma.oneOnOneRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: 'TEACHER',
        cancellationReason: reason || 'Cancelled by teacher'
      }
    })

    res.json({ message: 'Session cancelled' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark session as completed
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const request = await prisma.oneOnOneRequest.findUnique({ where: { id: req.params.id } })
    if (!request) return res.status(404).json({ error: 'Request not found' })

    // Check authorization
    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
      if (!student || request.studentId !== student.id) return res.status(403).json({ error: 'Unauthorized' })
    } else if (req.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } })
      if (!teacher || request.teacherId !== teacher.id) return res.status(403).json({ error: 'Unauthorized' })
    }

    await prisma.oneOnOneRequest.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt: new Date() }
    })

    res.json({ message: 'Session marked as completed' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Mark no-show
router.put('/:id/no-show', authenticateToken, async (req, res) => {
  try {
    const { who } = req.body // 'STUDENT' or 'TEACHER'

    const request = await prisma.oneOnOneRequest.findUnique({ where: { id: req.params.id } })
    if (!request) return res.status(404).json({ error: 'Request not found' })

    // Check authorization
    if (req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } })
      if (!student || request.studentId !== student.id) return res.status(403).json({ error: 'Unauthorized' })
    } else if (req.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } })
      if (!teacher || request.teacherId !== teacher.id) return res.status(403).json({ error: 'Unauthorized' })
    }

    const updateData = who === 'STUDENT' ? { studentNoShow: true } : { teacherNoShow: true }
    await prisma.oneOnOneRequest.update({
      where: { id: req.params.id },
      data: updateData
    })

    res.json({ message: 'No-show recorded' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
