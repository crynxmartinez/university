# Assalaam University - Server (Backend)

Express.js REST API backend for the Assalaam University Learning Management System.

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express 4.18** - Web framework
- **Prisma 6.1** - ORM and database toolkit
- **PostgreSQL** - Relational database
- **JWT (jsonwebtoken 9.0)** - Authentication
- **bcryptjs 2.4** - Password hashing
- **dotenv 16.3** - Environment variable management

## 📁 Project Structure

```
server/
├── prisma/
│   ├── migrations/      # Database migrations
│   ├── schema.prisma    # Database schema (674 lines)
│   └── seed.js          # Database seeding script
├── scripts/             # Utility scripts
├── src/
│   ├── lib/
│   │   └── prisma.js    # Prisma client instance
│   ├── routes/
│   │   ├── admin/       # Admin-specific routes (5 files)
│   │   ├── attendance.js
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── enrollments.js
│   │   ├── exams.js
│   │   ├── lessons.js
│   │   ├── modules.js
│   │   ├── notes.js
│   │   ├── programEnrollments.js
│   │   ├── programs.js
│   │   ├── sessions.js
│   │   ├── studentPrograms.js
│   │   └── users.js
│   └── index.js         # Express app entry point
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
└── vercel.json          # Vercel serverless config
```

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL="postgresql://user:password@host:5432/database_name"
JWT_SECRET="your-secret-key-here-change-this-in-production"
PORT=5000
NODE_ENV="development"
```

**Important**: Use a strong random string for `JWT_SECRET` in production.

### 3. Database Setup

Generate Prisma client:
```bash
npx prisma generate
```

Push schema to database:
```bash
npx prisma db push
```

Seed database (optional):
```bash
npm run db:seed
```

### 4. Build

```bash
npm run build
```

This runs `prisma generate && prisma db push`.

## 📦 Available Scripts

- `npm run dev` - Start server with auto-reload (Node --watch)
- `npm start` - Start production server
- `npm run build` - Generate Prisma client and push schema
- `npm run postinstall` - Auto-run after npm install (generates Prisma client)
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with initial data

## 🗄️ Database Schema

### User Roles
- `SUPER_ADMIN` - Full system access
- `REGISTRAR` - Student admission management
- `TEACHER` - Course/content creation
- `STUDENT` - Learning and exam taking

### Core Models (30+ tables)

**User Management**
- `User` - Authentication and role
- `Profile` - Personal information
- `Student`, `Teacher`, `Registrar` - Role-specific records
- `IdSequence` - Auto-generated ID tracking

**Programs** (Admin-managed)
- `Program` - Top-level initiatives
- `ProgramModule`, `ProgramLesson` - Content structure
- `ProgramSession` - Scheduled sessions
- `ProgramExam`, `ProgramExamQuestion`, `ProgramExamChoice` - Exam system
- `ProgramExamAttempt`, `ProgramExamAnswer` - Student attempts
- `ProgramAttendance` - Session attendance
- `ProgramStudentNote` - Student notes
- `ProgramEnrollment` - Student enrollments

**Courses** (Teacher/Admin-managed)
- `Course` - Course definition
- `Module`, `Lesson` - Content structure
- `ScheduledSession` - Calendar sessions
- `Exam`, `ExamQuestion`, `ExamChoice` - Exam system
- `ExamAttempt`, `ExamAnswer` - Student attempts
- `ExamScore` - Final grades
- `SessionAttendance` - Attendance tracking
- `StudentNote` - Personal notes
- `Enrollment` - Student enrollments

**Other**
- `Notification` - System notifications (schema only, not implemented)
- `SessionMaterial`, `ProgramSessionMaterial` - Session-specific materials

### Enums
- `Role`, `Gender`, `StudentStatus`, `CourseType`, `SessionType`
- `ExamAttemptStatus`, `PriceType`, `ProgramType`, `EnrollmentStatus`
- `NotificationType`, `AttendanceStatus`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - Student registration
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users` - List users (with pagination, filters)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-password` - Reset password

### Programs
- `GET /api/programs` - List programs
- `GET /api/programs/:id` - Get program
- `POST /api/programs` - Create program
- `PUT /api/programs/:id` - Update program
- `DELETE /api/programs/:id` - Delete program

### Courses
- `GET /api/courses` - List courses
- `GET /api/courses/:id` - Get course
- `POST /api/courses` - Create course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Modules & Lessons
- `POST /api/modules` - Create module
- `PUT /api/modules/:id` - Update module
- `DELETE /api/modules/:id` - Delete module
- `POST /api/lessons` - Create lesson
- `PUT /api/lessons/:id` - Update lesson
- `DELETE /api/lessons/:id` - Delete lesson

### Enrollments
- `GET /api/enrollments` - List enrollments
- `POST /api/enrollments` - Enroll student
- `DELETE /api/enrollments/:id` - Unenroll student
- `GET /api/enrollments/teacher/analytics` - Teacher analytics

### Sessions
- `GET /api/sessions/course/:courseId` - Get course sessions
- `POST /api/sessions` - Create session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/teacher/schedule` - Teacher schedule

### Exams
- `GET /api/exams/course/:courseId` - List course exams
- `POST /api/exams` - Create exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `POST /api/exams/:id/questions` - Add question
- `POST /api/exams/:examId/attempt` - Start exam attempt
- `POST /api/exams/attempt/:attemptId/answer` - Submit answer
- `POST /api/exams/attempt/:attemptId/submit` - Submit exam

### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/session/:sessionId` - Get session attendance

### Notes
- `GET /api/notes` - Get student notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Admin Routes
- `POST /api/admin/programs` - Admin create program
- `PUT /api/admin/programs/:id` - Admin update program
- `POST /api/admin/courses` - Admin create course
- `PUT /api/admin/courses/:id` - Admin update course
- `POST /api/admin/programs/:id/exams` - Create program exam
- `POST /api/admin/courses/:id/exams` - Create course exam

### Health Check
- `GET /api/health` - API health status

## 🔐 Authentication & Authorization

### JWT Authentication
- Login returns JWT token
- Token must be sent in `Authorization` header: `Bearer <token>`
- Token contains: `userId`, `role`
- Token expires based on JWT_SECRET configuration

### Middleware
- Authentication middleware verifies JWT
- Role-based access control enforced on routes
- Password hashing with bcrypt (10 rounds)

### Password Policy
- Must change password on first login (`mustChangePassword` flag)
- Passwords hashed before storage
- Reset password functionality available

## 🚀 Deployment

Deployed to **Vercel** as serverless functions.

### Vercel Configuration

The `vercel.json` file:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": ["prisma/**"]
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

### Environment Variables in Vercel

Set in Vercel dashboard:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `NODE_ENV` - Set to "production"

### Database Provider

Use a hosted PostgreSQL service:
- **Vercel Postgres** (recommended for Vercel deployment)
- **Supabase**
- **Railway**
- **Neon**
- **AWS RDS**

## 🔄 CORS Configuration

CORS is configured to allow all origins (`*`). For production, restrict to your frontend domain:

```javascript
res.header('Access-Control-Allow-Origin', 'https://your-frontend.vercel.app')
```

## 📝 Notes

- Server runs on port 5000 by default (configurable via `PORT` env var)
- Prisma migrations are in `prisma/migrations/`
- Database schema is in `prisma/schema.prisma` (674 lines)
- No local development - push to GitHub, deploy via Vercel
- Debug endpoints removed for production security

## 🐛 Known Issues

- Notification delivery system not implemented (schema exists)
- Certificate generation not implemented
- Email service not integrated (password resets, notifications)
- Payment processing not implemented

## 📧 Support

Contact the system administrator for issues or questions.
