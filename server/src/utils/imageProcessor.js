// Phase 6.2: Image processing utilities
import sharp from 'sharp'

/**
 * Convert image buffer to WebP format
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Processing options
 * @returns {Promise<Buffer>} - WebP image buffer
 */
export async function convertToWebP(imageBuffer, options = {}) {
  const {
    quality = 80,
    maxWidth = 1200,
    maxHeight = 1200
  } = options

  return sharp(imageBuffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality })
    .toBuffer()
}

/**
 * Get image metadata
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} - Image metadata
 */
export async function getImageMetadata(imageBuffer) {
  return sharp(imageBuffer).metadata()
}

/**
 * Validate image file
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Validation options
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateImage(imageBuffer, options = {}) {
  const {
    maxSizeMB = 10,
    allowedFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif']
  } = options

  try {
    const metadata = await getImageMetadata(imageBuffer)
    
    // Check format
    if (!allowedFormats.includes(metadata.format)) {
      return { valid: false, error: `Invalid format. Allowed: ${allowedFormats.join(', ')}` }
    }

    // Check size (buffer length in bytes)
    const sizeMB = imageBuffer.length / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      return { valid: false, error: `File too large. Maximum: ${maxSizeMB}MB` }
    }

    return { valid: true, metadata }
  } catch (error) {
    return { valid: false, error: 'Invalid or corrupted image file' }
  }
}
