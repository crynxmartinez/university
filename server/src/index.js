import express from 'express'
import dotenv from 'dotenv'
import prisma from './lib/prisma.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import programRoutes from './routes/programs.js'
import programEnrollmentRoutes from './routes/programEnrollments.js'
import courseRoutes from './routes/courses.js'
import moduleRoutes from './routes/modules.js'
import lessonRoutes from './routes/lessons.js'
import enrollmentRoutes from './routes/enrollments.js'
import sessionRoutes from './routes/sessions.js'
import noteRoutes from './routes/notes.js'
import attendanceRoutes from './routes/attendance.js'
import examRoutes from './routes/exams.js'
import adminRoutes from './routes/admin/index.js'
import studentProgramRoutes from './routes/studentPrograms.js'
import gradesRoutes from './routes/grades.js'
// import certificatesRoutes from './routes/certificates.js' // DISABLED: File system writes not supported in Vercel serverless
import analyticsRoutes from './routes/analytics.js'
import messagesRoutes from './routes/messages.js'
import announcementsRoutes from './routes/announcements.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// CORS middleware - must be first, before any other middleware
app.use((req, res, next) => {
  // Set CORS headers for all requests
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.status(200).json({ message: 'OK' })
    return
  }
  
  next()
})

app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/programs', programRoutes)
app.use('/api/program-enrollments', programEnrollmentRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/modules', moduleRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/notes', noteRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/student-programs', studentProgramRoutes)
app.use('/api/grades', gradesRoutes)
// app.use('/api/certificates', certificatesRoutes) // DISABLED: File system writes not supported in Vercel serverless
app.use('/api/analytics', analyticsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/announcements', announcementsRoutes)

// Serve certificate PDFs
app.use('/certificates', express.static('certificates'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Assalaam University API' })
})

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
