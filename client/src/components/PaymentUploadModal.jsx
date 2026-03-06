// Phase 6.2: Payment screenshot upload modal
import { useState, useRef } from 'react'
import { X, Upload, Image, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadPaymentScreenshot } from '../api/payments'

export default function PaymentUploadModal({ 
  isOpen, 
  onClose, 
  enrollmentType, 
  enrollmentId,
  onSuccess 
}) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please select an image file (JPEG, PNG, WebP, or GIF)')
      return
    }

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setUploading(true)
    setError(null)

    try {
      await uploadPaymentScreenshot(file, enrollmentType, enrollmentId)
      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      setError(err.message || 'Failed to upload payment screenshot')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (uploading) return
    setFile(null)
    setPreview(null)
    setError(null)
    setSuccess(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Upload Payment Screenshot</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Successful!</h3>
              <p className="text-gray-500">Your payment proof has been submitted for review.</p>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Payment Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Send payment via GCash to: <strong>09XX-XXX-XXXX</strong></li>
                  <li>Take a screenshot of the payment confirmation</li>
                  <li>Upload the screenshot below</li>
                  <li>Wait for admin approval (usually within 24 hours)</li>
                </ol>
              </div>

              {/* File Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                  preview 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-300 hover:border-[#f7941d] hover:bg-orange-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {preview ? (
                  <div>
                    <img 
                      src={preview} 
                      alt="Payment screenshot preview" 
                      className="max-h-48 mx-auto rounded-lg mb-3"
                    />
                    <p className="text-sm text-gray-600">{file?.name}</p>
                    <p className="text-xs text-gray-400 mt-1">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Click to upload screenshot</p>
                    <p className="text-sm text-gray-400 mt-1">JPEG, PNG, WebP, GIF (max 10MB)</p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-[#f7941d] hover:bg-[#e8850f] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Image className="w-5 h-5" />
                    Upload Payment Proof
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
