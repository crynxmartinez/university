// Phase 6.2: Payment view modal for admin review
import { useState } from 'react'
import { X, CheckCircle, XCircle, Clock, User, Calendar, FileImage, AlertCircle } from 'lucide-react'
import { reviewPayment } from '../api/payments'

export default function PaymentViewModal({ 
  isOpen, 
  onClose, 
  payment,
  onReviewComplete 
}) {
  const [reviewing, setReviewing] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [error, setError] = useState(null)

  if (!isOpen || !payment) return null

  const handleReview = async (status) => {
    setReviewing(true)
    setError(null)

    try {
      await reviewPayment(payment.id, status, reviewNotes)
      onReviewComplete?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to review payment')
    } finally {
      setReviewing(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Approved
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle className="w-4 h-4" />
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            Pending Review
          </span>
        )
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Payment Proof</h2>
            {getStatusBadge(payment.status)}
          </div>
          <button
            onClick={onClose}
            disabled={reviewing}
            className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Payment Image */}
          <div className="bg-gray-100 rounded-lg p-2">
            <img 
              src={payment.imageUrl} 
              alt="Payment screenshot" 
              className="max-w-full max-h-96 mx-auto rounded-lg"
            />
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">
                  Uploaded by: <strong>
                    {payment.uploadedBy?.profile?.firstName} {payment.uploadedBy?.profile?.lastName}
                  </strong>
                  <span className="text-gray-400 ml-1">({payment.uploadedBy?.userId})</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Uploaded: {formatDate(payment.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FileImage className="w-4 h-4" />
                <span className="text-sm">
                  {payment.originalFilename || 'screenshot.webp'} ({formatFileSize(payment.fileSize)})
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <strong>Enrollment Type:</strong> {payment.enrollmentType === 'course' ? 'Course' : 'Program'}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Enrollment ID:</strong> <code className="bg-gray-100 px-1 rounded">{payment.enrollmentId}</code>
              </div>
              {payment.reviewedBy && (
                <div className="text-sm text-gray-600">
                  <strong>Reviewed by:</strong> {payment.reviewedBy?.profile?.firstName} {payment.reviewedBy?.profile?.lastName}
                  <span className="text-gray-400 ml-1">on {formatDate(payment.reviewedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Review Notes (if any) */}
          {payment.reviewNotes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Review Notes:</p>
              <p className="text-sm text-gray-600">{payment.reviewNotes}</p>
            </div>
          )}

          {/* Review Section (only for pending payments) */}
          {payment.status === 'PENDING' && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium text-gray-900">Review Payment</h3>
              
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes (optional)..."
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#f7941d] focus:border-transparent"
                rows={2}
              />

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleReview('APPROVED')}
                  disabled={reviewing}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {reviewing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Approve Payment
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleReview('REJECTED')}
                  disabled={reviewing}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {reviewing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Reject Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
