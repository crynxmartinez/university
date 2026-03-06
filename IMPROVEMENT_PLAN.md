# ILM University SaaS — Improvement Plan

> Last updated: March 6, 2026
> Status: Planning phase — no code changes yet

---

## Overview

This document outlines all improvements needed to take ILM University from a working prototype to a production-grade SaaS platform. Items are organized by priority and category.

---

## Phase 1: Critical Security Fixes

These must be done before any real users access the system. They represent active vulnerabilities.

### 1.1 Protect All API Routes

**Problem:** The `GET /api/users` endpoint has no authentication. Anyone on the internet can access it and retrieve all user data — names, emails, student IDs, teacher IDs. Several other routes may also lack proper auth checks.

**Fix:** Audit every single route file. Ensure every endpoint uses the shared authentication middleware. No public access to any data endpoint except login, signup, and health check.

---

### 1.2 Remove or Disable the Seed Endpoint

**Problem:** `POST /api/auth/seed` is publicly accessible. It's a development convenience that should never exist in production. Even though it checks if the admin already exists, it reveals system internals and could be abused.

**Fix:** Either remove the seed endpoint entirely and rely only on the seed script, or gate it behind an environment variable that is never set in production (e.g., `ALLOW_SEED=true`).

---

### 1.3 Restrict CORS to Your Frontend Domain

**Problem:** The server currently sets `Access-Control-Allow-Origin: *`, which means any website on the internet can make API requests to your backend. This opens the door to cross-site attacks.

**Fix:** Change the CORS header to only allow your actual frontend domain (e.g., `https://university-client.vercel.app`). Optionally, allow a list of domains for development and staging environments, controlled by environment variables.

---

### 1.4 Use a Single Shared Prisma Client Instance

**Problem:** 11 route files create their own `new PrismaClient()` instead of importing the shared singleton from `lib/prisma.js`. On Vercel's serverless platform, each cold start can create multiple database connections simultaneously. This will cause connection pool exhaustion as traffic grows, resulting in random 500 errors and database timeouts.

**Fix:** Replace every `new PrismaClient()` in route files with `import prisma from '../lib/prisma.js'`. There should be exactly one Prisma client instance across the entire server.

**Files affected:** `oneOnOne.js`, `certificates.js`, `courseOfferings.js`, `programOfferings.js`, `masterCourses.js`, `masterPrograms.js`, `semesters.js`, `messages.js`, `announcements.js`, `analytics.js`

---

## Phase 2: Code Quality and Consistency

These don't cause immediate failures but make the codebase harder to maintain, debug, and extend.

### 2.1 Unify Authentication Middleware

**Problem:** There are two completely different authentication patterns used across the backend:

- **Pattern A (10 files):** Each route file defines its own inline `const authenticate = async` function that does a full database lookup on every request.
- **Pattern B (10 files):** Uses the shared `authenticateToken` middleware from `middleware/auth.js` that only verifies the JWT token.

This is inconsistent, duplicates code, and means some routes do unnecessary database calls on every request while others don't.

**Fix:** Standardize all routes to use the shared middleware from `middleware/auth.js`. If any routes need the full user object from the database, create a second middleware (e.g., `loadFullUser`) that can be chained after `authenticateToken`. Remove all inline authenticate functions.

---

### 2.2 Unify Frontend HTTP Client

**Problem:** Some API client files use `axios` while others use native `fetch`. This creates inconsistency in how errors are handled, how headers are set, and how responses are parsed.

- **Axios files:** `auth.js`, `courses.js`, `enrollments.js`, `modules.js`, `lessons.js`, `sessions.js`, `notes.js`, `exams.js`, `grades.js`, `programs.js`, `programEnrollments.js`, `users.js`, `analytics.js`, `messaging.js`
- **Fetch files:** `oneOnOne.js`, `certificates.js`, `courseOfferings.js`, `programOfferings.js`, `masterCourses.js`, `masterPrograms.js`, `semesters.js`, `attendance.js`, `studentPrograms.js`

**Fix:** Pick one (recommended: keep `fetch` since it's native and doesn't require a dependency) and convert all API files to use it. Create a shared helper function for common patterns like setting auth headers and handling errors.

---

### 2.3 Add Input Validation Library

**Problem:** All backend validation is done with manual `if (!field)` checks. This is fragile, verbose, and easy to miss edge cases (e.g., string that is only whitespace, numbers that are negative, emails that are malformed).

**Fix:** Introduce a validation library like **Zod** or **Joi**. Define schemas for each endpoint's expected input. This gives you type-safe, declarative validation with clear error messages automatically.

---

### 2.4 Add Environment Variable Validation

**Problem:** The server starts even if critical environment variables like `DATABASE_URL` or `JWT_SECRET` are missing. This causes cryptic runtime errors instead of a clear startup failure.

**Fix:** Add a startup check in `index.js` that verifies all required environment variables are present before the server starts. If any are missing, log a clear error message and exit immediately.

---

### 2.5 Add Structured Logging

**Problem:** All logging is done with `console.log` and `console.error`. In production, these are hard to search, filter, and monitor. There's no way to distinguish between a warning and a critical error, or to trace a request through the system.

**Fix:** Introduce a lightweight logging library (e.g., **pino** or **winston**). Use log levels (debug, info, warn, error) consistently. Include request IDs for tracing. This is essential for debugging production issues on Vercel.

---

## Phase 3: Frontend Architecture

### 3.1 Break Up Monolith Dashboard Files

**Problem:** The four largest files are massive single-file React components:

| File | Size |
|------|------|
| `CourseDashboard.jsx` | 135 KB |
| `AdminCourseDashboard.jsx` | 118 KB |
| `AdminProgramDashboard.jsx` | 116 KB |
| `StudentDashboard.jsx` | 105 KB |
| `TeacherDashboard.jsx` | 96 KB |

Each of these contains thousands of lines of JSX, state management, API calls, and business logic in a single component. This makes them:

- Extremely difficult to debug
- Slow to work with in the IDE
- Prone to introducing bugs when making changes
- Impossible for multiple people to work on simultaneously

**Fix:** Extract each tab/section into its own component file. For example, `TeacherDashboard.jsx` should become:

```
pages/teacher/
  TeacherDashboard.jsx          (layout + sidebar + routing)
  tabs/DashboardTab.jsx         (overview stats)
  tabs/OfferingsTab.jsx         (my offerings list)
  tabs/OneOnOneTab.jsx          (1-on-1 requests)
  tabs/StudentsTab.jsx          (student management)
  tabs/ScheduleTab.jsx          (calendar view)
  tabs/GradesTab.jsx            (grades)
  tabs/MessagesTab.jsx          (messaging)
  tabs/SettingsTab.jsx          (settings)
```

Same approach for Student, Admin, and Course dashboards.

---

### 3.2 Add React Error Boundaries

**Problem:** If any React component throws an error, the entire app crashes and shows a blank white screen. The user has no idea what happened and no way to recover.

**Fix:** Add error boundary components that catch rendering errors and show a friendly error message with a "Go back" or "Refresh" button. Place these around each major section (dashboard tabs, modals, page layouts).

---

### 3.3 Add Loading Skeletons

**Problem:** All loading states show a generic spinner. This creates layout shift when content loads and doesn't give users any sense of what's coming.

**Fix:** Replace spinners with skeleton loading states (gray placeholder shapes that match the layout of the actual content). This is a standard UX pattern used by platforms like Facebook, YouTube, and LinkedIn.

---

### 3.4 Add Frontend Pagination

**Problem:** Lists (students, courses, requests, etc.) load all data at once. As the platform grows, this will become slow and memory-intensive.

**Fix:** Add pagination or infinite scroll to all list views. Use cursor-based pagination from the backend for best performance.

---

## Phase 4: Schema Cleanup

### 4.1 Remove Legacy Duplicate Models

**Problem:** The schema has two parallel systems:

- **Legacy:** `Course`, `Exam`, `ExamQuestion`, `ExamChoice`, `ExamAttempt`, `ExamAnswer`, `ScheduledSession`, `SessionAttendance`, `Enrollment`, `Module`, `Lesson`
- **Offering-based:** `CourseOffering`, `CourseOfferingExam`, `CourseOfferingExamQuestion`, `CourseOfferingExamChoice`, etc.

And the same duplication exists for Programs. This means roughly 30 models that are duplicates with slightly different names. This bloats the schema, increases maintenance burden, and creates confusion about which system is the "real" one.

**Fix:** Decide which system is the primary one (offerings are the correct architecture). Plan a migration to:

1. Migrate any remaining data from legacy models to offering models
2. Remove legacy route files and API clients
3. Remove legacy models from the schema
4. Remove "Courses (Legacy)" menu item from teacher dashboard

This should be done carefully with data migration scripts if there's any production data in the legacy tables.

---

### 4.2 Consolidate Course and Program Exam Models

**Problem:** Even within the offering system, exam-related models are fully duplicated between courses and programs:

- `CourseOfferingExam` / `ProgramOfferingExam`
- `CourseOfferingExamQuestion` / `ProgramOfferingExamQuestion`
- `CourseOfferingExamChoice` / `ProgramOfferingExamChoice`
- `CourseOfferingExamAttempt` / `ProgramOfferingExamAttempt`
- `CourseOfferingExamAnswer` / `ProgramOfferingExamAnswer`

These are structurally identical — same fields, same logic.

**Fix:** Create a unified `OfferingExam` model that has both a nullable `courseOfferingId` and `programOfferingId`. One set of exam models serves both. This cuts 10 models down to 5.

---

## Phase 5: Production Hardening

### 5.1 Add Rate Limiting

**Problem:** No protection against brute force login attempts, API spam, or accidental infinite loops from the frontend.

**Fix:** Add `express-rate-limit` middleware. Apply stricter limits to sensitive endpoints (login, signup, password change) and generous limits to read endpoints. Example: 5 login attempts per minute per IP, 100 API calls per minute per user.

---

### 5.2 Implement Refresh Tokens

**Problem:** JWT access tokens expire after 7 days. If a token is stolen, the attacker has a full week of access. There's no way to invalidate a token before expiry.

**Fix:** Implement a refresh token flow:

- Access token: 15-minute expiry
- Refresh token: 7-day expiry, stored in HTTP-only cookie
- Refresh endpoint: exchanges a valid refresh token for a new access token
- Logout endpoint: invalidates the refresh token

This is the industry standard for token-based authentication.

---

### 5.3 Add Request Body Size Limits

**Problem:** No limit on request body size. An attacker could send a multi-gigabyte payload and crash the server or exhaust memory.

**Fix:** Add `express.json({ limit: '1mb' })` to the middleware. For file upload endpoints (if added later), use separate limits with streaming.

---

### 5.4 Add Account Lockout

**Problem:** No protection against password guessing. An attacker can try unlimited passwords against any account.

**Fix:** Track failed login attempts per user/IP. Lock the account after 5 failed attempts for 15 minutes. Notify the user via email if their account is locked.

---

### 5.5 Add Health Monitoring

**Problem:** If the server goes down or the database disconnects, there's no alerting. The health check endpoint just returns `{ status: 'ok' }` without actually checking anything.

**Fix:** Make the health check endpoint verify database connectivity. Set up Vercel/Uptime monitoring to ping this endpoint every minute and alert on failures.

---

## Phase 6: Feature Enhancements (Future)

These are not bugs or issues — they're features that would make the SaaS more competitive.

### 6.1 Email Notifications
Send emails for: account creation, password reset, enrollment confirmation, session reminders, exam results, certificate issuance. Use a service like Resend, SendGrid, or AWS SES.

### 6.2 File Upload System
Allow teachers to upload materials directly instead of pasting Google Drive links. Use Vercel Blob, AWS S3, or Cloudinary.

### 6.3 Real-Time Features
Live notifications, real-time messaging, live attendance tracking. Use WebSockets (Socket.io) or server-sent events.

### 6.4 Mobile Responsiveness Audit
Ensure all dashboard views work well on tablets and phones. The current sidebar layout likely breaks on small screens.

### 6.5 Dark Mode
Add a theme toggle for dark mode across all pages.

### 6.6 Multi-Tenant Support
If this becomes a true SaaS, support multiple universities/schools as separate tenants with their own branding, domains, and data isolation.

### 6.7 Payment Integration
Integrate Stripe or PayMongo for course/program payments, replacing the current price fields that don't connect to any payment flow.

### 6.8 Automated Grading Reports
Generate PDF grade reports per student per semester, similar to university transcripts.

### 6.9 Student Progress Dashboard
Visual progress tracking: completion percentage, streak tracking, learning analytics, performance trends over time.

### 6.10 API Documentation
Generate OpenAPI/Swagger documentation for all endpoints. This is essential if third parties or mobile apps will consume the API.

---

## Execution Order

| Order | Phase | Effort | Impact |
|-------|-------|--------|--------|
| 1 | Phase 1: Critical Security | 1-2 days | Prevents data breaches |
| 2 | Phase 2: Code Quality | 3-5 days | Prevents production bugs |
| 3 | Phase 4: Schema Cleanup | 2-3 days | Reduces complexity |
| 4 | Phase 3: Frontend Architecture | 5-7 days | Enables faster development |
| 5 | Phase 5: Production Hardening | 3-4 days | Production readiness |
| 6 | Phase 6: Features | Ongoing | Growth and competitiveness |

**Total estimated effort for Phase 1-5:** 2-3 weeks of focused work.

---

## Notes

- All changes should be done incrementally with individual commits
- Each phase should be completed and verified before moving to the next
- Schema changes require careful migration planning to preserve data
- Frontend refactoring should be done one dashboard at a time
- Security fixes are non-negotiable before any public launch
