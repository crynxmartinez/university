import prisma from '../lib/prisma.js'

/**
 * Validates that all required environment variables are present
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function validateEnvVariables() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET'
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.error('=== STARTUP ERROR ===')
    console.error('Missing required environment variables:')
    missing.forEach(key => console.error(`  - ${key}`))
    console.error('=====================')
  }

  return {
    valid: missing.length === 0,
    missing
  }
}

/**
 * Tests database connectivity
 * @returns {Promise<{ connected: boolean, error?: string }>}
 */
export async function testDatabaseConnection() {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`
    return { connected: true }
  } catch (error) {
    console.error('=== DATABASE CONNECTION ERROR ===')
    console.error('Failed to connect to database:', error.message)
    console.error('=================================')
    return { connected: false, error: error.message }
  }
}

/**
 * Runs all startup validations
 * Call this before starting the server
 * @returns {Promise<boolean>} - true if all validations pass
 */
export async function runStartupValidations() {
  console.log('Running startup validations...')

  // 1. Check environment variables
  const envCheck = validateEnvVariables()
  if (!envCheck.valid) {
    console.error('Startup validation failed: Missing environment variables')
    return false
  }
  console.log('✓ Environment variables validated')

  // 2. Test database connection
  const dbCheck = await testDatabaseConnection()
  if (!dbCheck.connected) {
    console.error('Startup validation failed: Cannot connect to database')
    return false
  }
  console.log('✓ Database connection verified')

  console.log('All startup validations passed!')
  return true
}

export default { validateEnvVariables, testDatabaseConnection, runStartupValidations }
