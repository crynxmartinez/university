import { Prisma } from '@prisma/client'

/**
 * Translates Prisma error codes into user-friendly messages
 * @param {Error} error - The error to handle
 * @returns {{ statusCode: number, message: string, code?: string }}
 */
export function handlePrismaError(error) {
  // Prisma Client Known Request Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.target?.[0] || 'field'
        return {
          statusCode: 409,
          message: `A record with this ${field} already exists`,
          code: 'DUPLICATE_ENTRY'
        }
      
      case 'P2025':
        // Record not found
        return {
          statusCode: 404,
          message: 'Record not found',
          code: 'NOT_FOUND'
        }
      
      case 'P2003':
        // Foreign key constraint violation
        return {
          statusCode: 400,
          message: 'Cannot complete this action because related records exist',
          code: 'FOREIGN_KEY_VIOLATION'
        }
      
      case 'P2014':
        // Required relation violation
        return {
          statusCode: 400,
          message: 'This action would violate a required relationship',
          code: 'RELATION_VIOLATION'
        }
      
      case 'P2021':
        // Table does not exist
        return {
          statusCode: 500,
          message: 'Database configuration error',
          code: 'TABLE_NOT_FOUND'
        }
      
      case 'P2022':
        // Column does not exist
        return {
          statusCode: 500,
          message: 'Database configuration error',
          code: 'COLUMN_NOT_FOUND'
        }
      
      default:
        return {
          statusCode: 500,
          message: 'Database operation failed',
          code: error.code
        }
    }
  }

  // Prisma Client Validation Errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: 400,
      message: 'Invalid data provided',
      code: 'VALIDATION_ERROR'
    }
  }

  // Prisma Client Initialization Errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      statusCode: 503,
      message: 'Service temporarily unavailable',
      code: 'DATABASE_UNAVAILABLE'
    }
  }

  // Prisma Client Rust Panic Errors
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      statusCode: 500,
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    }
  }

  // Not a Prisma error
  return null
}

/**
 * Global error handler middleware for Express
 * Place this AFTER all routes in index.js
 */
export function globalErrorHandler(err, req, res, next) {
  // Log the full error for debugging
  console.error('=== ERROR ===')
  console.error('Timestamp:', new Date().toISOString())
  console.error('Method:', req.method)
  console.error('Path:', req.path)
  console.error('Body:', JSON.stringify(req.body, null, 2))
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)
  console.error('=============')

  // Check if it's a Prisma error
  const prismaError = handlePrismaError(err)
  if (prismaError) {
    return res.status(prismaError.statusCode).json({
      error: prismaError.message,
      code: prismaError.code
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token has expired',
      code: 'TOKEN_EXPIRED'
    })
  }

  // Validation errors (from express-validator or similar)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message || 'Validation failed',
      code: 'VALIDATION_ERROR'
    })
  }

  // Default error response
  // In production, don't expose internal error details
  const isProduction = process.env.NODE_ENV === 'production'
  
  res.status(err.statusCode || 500).json({
    error: isProduction ? 'An unexpected error occurred' : err.message,
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { stack: err.stack })
  })
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export default { handlePrismaError, globalErrorHandler, asyncHandler }
