// Phase 6.2: Payment screenshot upload and management
import express from 'express'
import { put, del } from '@vercel/blob'
import prisma from '../lib/prisma.js'
import { authenticateToken, authorizeRoles } from '../middleware/auth.js'
import { uploadPaymentScreenshot, handleMulterError } from '../middleware/upload.js'
import { convertToWebP, validateImage } from '../utils/imageProcessor.js'

const router = express.Router()

// POST /api/payments/upload - Upload payment screenshot
router.post(
  '/upload',
  authenticateToken,
  uploadPaymentScreenshot.single('screenshot'),
  handleMulterError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' })
      }

      const { enrollmentType, enrollmentId } = req.body
      
      if (!enrollmentType || !enrollmentId) {
        return res.status(400).json({ error: 'enrollmentType and enrollmentId are required' })
      }

      if (!['course', 'program'].includes(enrollmentType)) {
        return res.status(400).json({ error: 'enrollmentType must be "course" or "program"' })
      }

      // Validate image
      const validation = await validateImage(req.file.buffer)
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error })
      }

      // Convert to WebP
      const webpBuffer = await convertToWebP(req.file.buffer, {
        quality: 85,
        maxWidth: 1200,
        maxHeight: 1600
      })

      // Generate unique filename
      const timestamp = Date.now()
      const filename = `payments/${enrollmentType}/${enrollmentId}/${timestamp}.webp`

      // Upload to Vercel Blob
      const blob = await put(filename, webpBuffer, {
        access: 'public',
        contentType: 'image/webp'
      })

      // Create payment record in database
      const payment = await prisma.paymentProof.create({
        data: {
          enrollmentType,
          enrollmentId,
          imageUrl: blob.url,
          blobPath: filename,
          originalFilename: req.file.originalname,
          fileSize: webpBuffer.length,
          uploadedById: req.user.id,
          status: 'PENDING'
        }
      })

      res.json({
        message: 'Payment screenshot uploaded successfully',
        payment: {
          id: payment.id,
          imageUrl: payment.imageUrl,
          status: payment.status,
          createdAt: payment.createdAt
        }
      })
    } catch (error) {
      console.error('Payment upload error:', error)
      res.status(500).json({ error: 'Failed to upload payment screenshot' })
    }
  }
)

// GET /api/payments/my - Get current user's payment proofs
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const payments = await prisma.paymentProof.findMany({
      where: { uploadedById: req.user.id },
      orderBy: { createdAt: 'desc' }
    })
    res.json(payments)
  } catch (error) {
    console.error('Get my payments error:', error)
    res.status(500).json({ error: 'Failed to get payments' })
  }
})

// GET /api/payments - Get all payment proofs (admin only)
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'SUPER_ADMIN', 'REGISTRAR'),
  async (req, res) => {
    try {
      const { status, enrollmentType } = req.query
      
      const where = {}
      if (status) where.status = status
      if (enrollmentType) where.enrollmentType = enrollmentType

      const payments = await prisma.paymentProof.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              userId: true,
              email: true,
              profile: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
      res.json(payments)
    } catch (error) {
      console.error('Get all payments error:', error)
      res.status(500).json({ error: 'Failed to get payments' })
    }
  }
)

// GET /api/payments/:id - Get single payment proof
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await prisma.paymentProof.findUnique({
      where: { id: req.params.id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            userId: true,
            email: true,
            profile: {
              select: { firstName: true, lastName: true }
            }
          }
        },
        reviewedBy: {
          select: {
            id: true,
            userId: true,
            profile: {
              select: { firstName: true, lastName: true }
            }
          }
        }
      }
    })

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    // Only allow owner or admin to view
    const isOwner = payment.uploadedById === req.user.id
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'REGISTRAR'].includes(req.user.role)
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    res.json(payment)
  } catch (error) {
    console.error('Get payment error:', error)
    res.status(500).json({ error: 'Failed to get payment' })
  }
})

// PUT /api/payments/:id/review - Approve or reject payment (admin only)
router.put(
  '/:id/review',
  authenticateToken,
  authorizeRoles('ADMIN', 'SUPER_ADMIN', 'REGISTRAR'),
  async (req, res) => {
    try {
      const { status, notes } = req.body
      
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' })
      }

      const payment = await prisma.paymentProof.findUnique({
        where: { id: req.params.id }
      })

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' })
      }

      if (payment.status !== 'PENDING') {
        return res.status(400).json({ error: 'Payment has already been reviewed' })
      }

      // Update payment status
      const updatedPayment = await prisma.paymentProof.update({
        where: { id: req.params.id },
        data: {
          status,
          reviewNotes: notes,
          reviewedById: req.user.id,
          reviewedAt: new Date()
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              userId: true,
              email: true,
              profile: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      })

      // If approved, update the enrollment status
      if (status === 'APPROVED') {
        if (payment.enrollmentType === 'course') {
          await prisma.courseEnrollment.updateMany({
            where: { id: payment.enrollmentId },
            data: { paymentStatus: 'PAID' }
          })
        } else if (payment.enrollmentType === 'program') {
          await prisma.programOfferingEnrollment.updateMany({
            where: { id: payment.enrollmentId },
            data: { paymentStatus: 'PAID' }
          })
        }
      }

      res.json({
        message: `Payment ${status.toLowerCase()}`,
        payment: updatedPayment
      })
    } catch (error) {
      console.error('Review payment error:', error)
      res.status(500).json({ error: 'Failed to review payment' })
    }
  }
)

// DELETE /api/payments/:id - Delete payment proof (owner or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const payment = await prisma.paymentProof.findUnique({
      where: { id: req.params.id }
    })

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    // Only allow owner or admin to delete
    const isOwner = payment.uploadedById === req.user.id
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Can only delete pending payments
    if (payment.status !== 'PENDING' && !isAdmin) {
      return res.status(400).json({ error: 'Cannot delete reviewed payment' })
    }

    // Delete from Vercel Blob
    try {
      await del(payment.imageUrl)
    } catch (blobError) {
      console.error('Failed to delete blob:', blobError)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await prisma.paymentProof.delete({
      where: { id: req.params.id }
    })

    res.json({ message: 'Payment proof deleted' })
  } catch (error) {
    console.error('Delete payment error:', error)
    res.status(500).json({ error: 'Failed to delete payment' })
  }
})

export default router
