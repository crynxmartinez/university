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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Assalaam University API' })
})

// Debug endpoint to test Prisma connection and schema
app.get('/api/debug/schema', async (req, res) => {
  try {
    // Test basic exam query
    const examCount = await prisma.exam.count()
    
    // Try to check if new fields exist by querying with them
    const testExam = await prisma.exam.findFirst({
      select: {
        id: true,
        title: true,
        timeLimit: true,
        maxTabSwitch: true,
        isPublished: true
      }
    })
    
    res.json({ 
      status: 'ok', 
      examCount,
      testExam,
      message: 'Schema looks good!'
    })
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      code: error.code,
      meta: error.meta
    })
  }
})

// One-time migration endpoint - run raw SQL to add missing columns
app.get('/api/debug/migrate', async (req, res) => {
  try {
    // Create ExamAttemptStatus enum if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "ExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'FLAGGED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    // Add missing columns to Exam table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Exam" 
      ADD COLUMN IF NOT EXISTS "timeLimit" INTEGER,
      ADD COLUMN IF NOT EXISTS "maxTabSwitch" INTEGER DEFAULT 3,
      ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN DEFAULT false
    `)

    // Create ExamQuestion table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExamQuestion" (
        "id" TEXT NOT NULL,
        "examId" TEXT NOT NULL,
        "question" TEXT NOT NULL,
        "points" INTEGER NOT NULL DEFAULT 10,
        "order" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)

    // Create ExamChoice table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExamChoice" (
        "id" TEXT NOT NULL,
        "questionId" TEXT NOT NULL,
        "text" TEXT NOT NULL,
        "isCorrect" BOOLEAN NOT NULL DEFAULT false,
        "order" INTEGER NOT NULL DEFAULT 0,
        CONSTRAINT "ExamChoice_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ExamChoice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)

    // Drop and recreate ExamAttempt table with proper enum type
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ExamAnswer" CASCADE`)
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ExamAttempt" CASCADE`)
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "ExamAttempt" (
        "id" TEXT NOT NULL,
        "examId" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "submittedAt" TIMESTAMP(3),
        "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
        "status" "ExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
        "score" DOUBLE PRECISION,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `)

    // Create ExamAnswer table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "ExamAnswer" (
        "id" TEXT NOT NULL,
        "attemptId" TEXT NOT NULL,
        "questionId" TEXT NOT NULL,
        "choiceId" TEXT,
        "isCorrect" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "ExamAnswer_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ExamAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ExamAnswer_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "ExamChoice"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `)

    // Add unique constraints
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ExamAttempt_examId_studentId_key" ON "ExamAttempt"("examId", "studentId")
    `)
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "ExamAnswer_attemptId_questionId_key" ON "ExamAnswer"("attemptId", "questionId")
    `)

    // Add examId column to ScheduledSession and make lessonId nullable
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ScheduledSession" 
      ADD COLUMN IF NOT EXISTS "examId" TEXT,
      ALTER COLUMN "lessonId" DROP NOT NULL
    `)

    // Add foreign key for examId if not exists
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'ScheduledSession_examId_fkey'
        ) THEN
          ALTER TABLE "ScheduledSession" 
          ADD CONSTRAINT "ScheduledSession_examId_fkey" 
          FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    res.json({ status: 'ok', message: 'Migration completed successfully!' })
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message,
      code: error.code
    })
  }
})

// Debug endpoint to check tables
app.get('/api/debug/check-tables', async (req, res) => {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    // Check if exam exists
    const exam = await prisma.exam.findFirst({
      include: {
        questions: {
          include: { choices: true }
        }
      }
    })
    
    res.json({ 
      tables: tables.map(t => t.table_name),
      sampleExam: exam ? {
        id: exam.id,
        title: exam.title,
        questionCount: exam.questions?.length || 0,
        isPublished: exam.isPublished
      } : null
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
