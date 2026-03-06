import express from 'express'
import dotenv from 'dotenv'
import prisma from './lib/prisma.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import programRoutes from './routes/programs.js'
import programEnrollmentRoutes from './routes/programEnrollments.js'
// Legacy routes removed in Phase 4 cleanup:
// import courseRoutes from './routes/courses.js'
// import moduleRoutes from './routes/modules.js'
// import lessonRoutes from './routes/lessons.js'
import enrollmentRoutes from './routes/enrollments.js'
import sessionRoutes from './routes/sessions.js'
import noteRoutes from './routes/notes.js'
import attendanceRoutes from './routes/attendance.js'
import examRoutes from './routes/exams.js'
import adminRoutes from './routes/admin/index.js'
import studentProgramRoutes from './routes/studentPrograms.js'
import gradesRoutes from './routes/grades.js'
import certificatesRoutes from './routes/certificates.js'
import analyticsRoutes from './routes/analytics.js'
import messagesRoutes from './routes/messages.js'
import announcementsRoutes from './routes/announcements.js'
import masterCoursesRoutes from './routes/masterCourses.js'
import masterProgramsRoutes from './routes/masterPrograms.js'
import courseOfferingsRoutes from './routes/courseOfferings.js'
import programOfferingsRoutes from './routes/programOfferings.js'
import semestersRoutes from './routes/semesters.js'
import oneOnOneRoutes from './routes/oneOnOne.js'
import paymentsRoutes from './routes/payments.js'
import notificationsRoutes from './routes/notifications.js'
import reportsRoutes from './routes/reports.js'
import progressRoutes from './routes/progress.js'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger.js'
import { globalErrorHandler } from './utils/errorHandler.js'
import { runStartupValidations } from './utils/startupValidator.js'
import { generalLimiter } from './middleware/rateLimiter.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// CORS middleware - must be first, before any other middleware
// Allowed origins for CORS (add your frontend domains here)
const allowedOrigins = [
  'https://university-client.vercel.app',
  'https://university-client-theta.vercel.app',
  'https://university-client-git-main-crynxmartinez.vercel.app',
  process.env.FRONTEND_URL, // Allow custom frontend URL from env
  process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : null,
  process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null,
].filter(Boolean)

app.use((req, res, next) => {
  const origin = req.headers.origin
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
  } else if (process.env.NODE_ENV !== 'production') {
    // In development, allow all origins for easier testing
    res.header('Access-Control-Allow-Origin', origin || '*')
  }
  // In production with unknown origin, don't set the header (browser will block)
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
  res.header('Access-Control-Allow-Credentials', 'true')
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'OK' })
    return
  }
  
  next()
})

// Phase 5.3: Request body size limits to prevent large payload attacks
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// Phase 5.1: General rate limiting - 100 requests per minute per IP
app.use('/api', generalLimiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/programs', programRoutes)
app.use('/api/program-enrollments', programEnrollmentRoutes)
// Legacy routes removed in Phase 4 cleanup:
// app.use('/api/courses', courseRoutes)
// app.use('/api/modules', moduleRoutes)
// app.use('/api/lessons', lessonRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/student-programs', studentProgramRoutes)
app.use('/api/grades', gradesRoutes)
app.use('/api/certificates', certificatesRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/announcements', announcementsRoutes)
app.use('/api/master-courses', masterCoursesRoutes)
app.use('/api/master-programs', masterProgramsRoutes)
app.use('/api/course-offerings', courseOfferingsRoutes)
app.use('/api/program-offerings', programOfferingsRoutes)
app.use('/api/semesters', semestersRoutes)
app.use('/api/one-on-one', oneOnOneRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/progress', progressRoutes)

// Phase 6.9: Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ILM API Documentation'
}))
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Serve certificate PDFs
app.use('/certificates', express.static('certificates'))

// Phase 5.5: Health check with database connectivity verification
app.get('/api/health', async (req, res) => {
  const startTime = Date.now()
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime
    res.json({ 
      status: 'ok', 
      message: 'Assalaam University API',
      database: 'connected',
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    res.status(503).json({ 
      status: 'error', 
      message: 'Database connection failed',
      database: 'disconnected',
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString()
    })
  }
})

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found', code: 'NOT_FOUND' })
})

// Global error handler - MUST be last middleware
app.use(globalErrorHandler)

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  // Run startup validations before starting
  runStartupValidations().then(valid => {
    if (!valid) {
      console.error('Server startup aborted due to validation failures')
      process.exit(1)
    }
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
}

export default app;
