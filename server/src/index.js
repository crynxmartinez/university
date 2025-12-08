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
app.use('/api/admin', adminRoutes)
app.use('/api/student-programs', studentProgramRoutes)

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
    try {
      await prisma.$executeRawUnsafe(`CREATE TYPE "ExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'FLAGGED')`)
    } catch (e) {
      // Enum might already exist, ignore error
      console.log('Enum creation skipped (may already exist):', e.message)
    }

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
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ExamAnswer" CASCADE`)
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ExamAttempt" CASCADE`)
    } catch (e) {
      console.log('Drop tables skipped:', e.message)
    }
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExamAttempt" (
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
      CREATE TABLE IF NOT EXISTS "ExamAnswer" (
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

// Fix enum and recreate ExamAttempt with correct type (supports retakes)
app.get('/api/debug/fix-exam-tables', async (req, res) => {
  const logs = []
  try {
    // Step 1: Create enum type
    try {
      await prisma.$executeRawUnsafe(`CREATE TYPE "ExamAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT', 'FLAGGED')`)
      logs.push('Enum created successfully')
    } catch (e) {
      logs.push('Enum exists or error: ' + e.message)
    }

    // Step 2: Drop existing tables (ignore if they don't exist)
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ExamAnswer"`)
      logs.push('Dropped ExamAnswer')
    } catch (e) {
      logs.push('ExamAnswer drop skipped: ' + e.message)
    }
    
    try {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "ExamAttempt"`)
      logs.push('Dropped ExamAttempt')
    } catch (e) {
      logs.push('ExamAttempt drop skipped: ' + e.message)
    }

    // Step 3: Create ExamAttempt with sessionId for retake support
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExamAttempt" (
        "id" TEXT NOT NULL,
        "examId" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        "sessionId" TEXT,
        "attemptNumber" INTEGER NOT NULL DEFAULT 1,
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "submittedAt" TIMESTAMP(3),
        "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
        "status" "ExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
        "score" DOUBLE PRECISION,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ExamAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ScheduledSession"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `)
    logs.push('Created ExamAttempt table with sessionId')

    // Step 4: Create ExamAnswer
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExamAnswer" (
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
    logs.push('Created ExamAnswer table')

    // Step 5: Create indexes - unique per session (allows retakes on different sessions)
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ExamAttempt_examId_studentId_sessionId_key" ON "ExamAttempt"("examId", "studentId", "sessionId")`)
      logs.push('Created ExamAttempt unique index (per session)')
    } catch (e) {
      logs.push('ExamAttempt index skipped: ' + e.message)
    }
    
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ExamAnswer_attemptId_questionId_key" ON "ExamAnswer"("attemptId", "questionId")`)
      logs.push('Created ExamAnswer index')
    } catch (e) {
      logs.push('ExamAnswer index skipped: ' + e.message)
    }

    res.json({ status: 'ok', message: 'Exam tables fixed with retake support!', logs })
  } catch (error) {
    console.error('Fix exam tables error:', error)
    res.status(500).json({ error: error.message, logs })
  }
})

// Create Program tables migration
app.get('/api/debug/create-program-tables', async (req, res) => {
  const logs = []
  try {
    // Add slug column to Program if not exists
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "slug" TEXT`)
      await prisma.$executeRawUnsafe(`UPDATE "Program" SET "slug" = id WHERE "slug" IS NULL`)
      await prisma.$executeRawUnsafe(`ALTER TABLE "Program" ALTER COLUMN "slug" SET NOT NULL`)
      logs.push('Added slug column to Program')
    } catch (e) {
      logs.push('Program slug: ' + e.message)
    }

    // Create ProgramModule table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramModule" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "order" INTEGER NOT NULL DEFAULT 0,
          "programId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProgramModule_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramModule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      logs.push('Created ProgramModule table')
    } catch (e) {
      logs.push('ProgramModule: ' + e.message)
    }

    // Create ProgramLesson table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramLesson" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "materials" TEXT,
          "videoUrl" TEXT,
          "order" INTEGER NOT NULL DEFAULT 0,
          "moduleId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProgramLesson_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramLesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "ProgramModule"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      logs.push('Created ProgramLesson table')
    } catch (e) {
      logs.push('ProgramLesson: ' + e.message)
    }

    // Create ProgramExam table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramExam" (
          "id" TEXT NOT NULL,
          "programId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "totalPoints" INTEGER NOT NULL DEFAULT 100,
          "order" INTEGER NOT NULL DEFAULT 0,
          "timeLimit" INTEGER,
          "maxTabSwitch" INTEGER NOT NULL DEFAULT 3,
          "isPublished" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProgramExam_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramExam_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      logs.push('Created ProgramExam table')
    } catch (e) {
      logs.push('ProgramExam: ' + e.message)
    }

    // Create ProgramSession table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramSession" (
          "id" TEXT NOT NULL,
          "programId" TEXT NOT NULL,
          "lessonId" TEXT,
          "examId" TEXT,
          "date" TIMESTAMP(3) NOT NULL,
          "startTime" TEXT NOT NULL,
          "endTime" TEXT NOT NULL,
          "type" "SessionType" NOT NULL DEFAULT 'CLASS',
          "meetingLink" TEXT,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProgramSession_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ProgramSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "ProgramLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ProgramSession_examId_fkey" FOREIGN KEY ("examId") REFERENCES "ProgramExam"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      logs.push('Created ProgramSession table')
    } catch (e) {
      logs.push('ProgramSession: ' + e.message)
    }

    // Create ProgramSessionMaterial table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramSessionMaterial" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "driveUrl" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProgramSessionMaterial_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramSessionMaterial_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ProgramSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      logs.push('Created ProgramSessionMaterial table')
    } catch (e) {
      logs.push('ProgramSessionMaterial: ' + e.message)
    }

    // Create ProgramAttendance table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramAttendance" (
          "id" TEXT NOT NULL,
          "sessionId" TEXT NOT NULL,
          "studentId" TEXT NOT NULL,
          "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
          "joinedAt" TIMESTAMP(3),
          "markedBy" TEXT NOT NULL DEFAULT 'AUTO',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProgramAttendance_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ProgramSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ProgramAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ProgramAttendance_sessionId_studentId_key" ON "ProgramAttendance"("sessionId", "studentId")`)
      logs.push('Created ProgramAttendance table')
    } catch (e) {
      logs.push('ProgramAttendance: ' + e.message)
    }

    // Create ProgramExamQuestion table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramExamQuestion" (
          "id" TEXT NOT NULL,
          "examId" TEXT NOT NULL,
          "question" TEXT NOT NULL,
          "points" INTEGER NOT NULL DEFAULT 10,
          "order" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "ProgramExamQuestion_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "ProgramExam"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      logs.push('Created ProgramExamQuestion table')
    } catch (e) {
      logs.push('ProgramExamQuestion: ' + e.message)
    }

    // Create ProgramExamChoice table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramExamChoice" (
          "id" TEXT NOT NULL,
          "questionId" TEXT NOT NULL,
          "text" TEXT NOT NULL,
          "isCorrect" BOOLEAN NOT NULL DEFAULT false,
          "order" INTEGER NOT NULL DEFAULT 0,
          CONSTRAINT "ProgramExamChoice_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramExamChoice_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ProgramExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      logs.push('Created ProgramExamChoice table')
    } catch (e) {
      logs.push('ProgramExamChoice: ' + e.message)
    }

    // Create ProgramExamAttempt table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramExamAttempt" (
          "id" TEXT NOT NULL,
          "examId" TEXT NOT NULL,
          "studentId" TEXT NOT NULL,
          "sessionId" TEXT,
          "attemptNumber" INTEGER NOT NULL DEFAULT 1,
          "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "submittedAt" TIMESTAMP(3),
          "tabSwitchCount" INTEGER NOT NULL DEFAULT 0,
          "status" "ExamAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
          "score" DOUBLE PRECISION,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProgramExamAttempt_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "ProgramExam"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ProgramExamAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ProgramExamAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ProgramSession"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ProgramExamAttempt_examId_studentId_sessionId_key" ON "ProgramExamAttempt"("examId", "studentId", "sessionId")`)
      logs.push('Created ProgramExamAttempt table')
    } catch (e) {
      logs.push('ProgramExamAttempt: ' + e.message)
    }

    // Create ProgramExamAnswer table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramExamAnswer" (
          "id" TEXT NOT NULL,
          "attemptId" TEXT NOT NULL,
          "questionId" TEXT NOT NULL,
          "choiceId" TEXT,
          "isCorrect" BOOLEAN NOT NULL DEFAULT false,
          CONSTRAINT "ProgramExamAnswer_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramExamAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ProgramExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ProgramExamAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ProgramExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ProgramExamAnswer_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "ProgramExamChoice"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ProgramExamAnswer_attemptId_questionId_key" ON "ProgramExamAnswer"("attemptId", "questionId")`)
      logs.push('Created ProgramExamAnswer table')
    } catch (e) {
      logs.push('ProgramExamAnswer: ' + e.message)
    }

    // Create ProgramStudentNote table
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ProgramStudentNote" (
          "id" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "studentId" TEXT NOT NULL,
          "sessionId" TEXT,
          "lessonId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ProgramStudentNote_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "ProgramStudentNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ProgramStudentNote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ProgramSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "ProgramStudentNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "ProgramLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ProgramStudentNote_studentId_sessionId_key" ON "ProgramStudentNote"("studentId", "sessionId")`)
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ProgramStudentNote_studentId_lessonId_key" ON "ProgramStudentNote"("studentId", "lessonId")`)
      logs.push('Created ProgramStudentNote table')
    } catch (e) {
      logs.push('ProgramStudentNote: ' + e.message)
    }

    res.json({ status: 'ok', message: 'Program tables created!', logs })
  } catch (error) {
    console.error('Create program tables error:', error)
    res.status(500).json({ error: error.message, logs })
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
