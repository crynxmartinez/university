# ILM University SaaS — Improvement Plan

> Last updated: March 7, 2026
> Status: Phase 5 Complete — Production Hardening done

---

## Overview

This document outlines all improvements needed to take ILM University from a working prototype to a production-grade SaaS platform. Items are organized by priority and category.

**Lesson learned:** On March 6, 2026, a database reset command wiped the entire production database and a misconfigured `vercel.json` took the server offline for hours. Phase 1 now includes resilience patterns to prevent this class of problem from ever happening again.

---

## Phase 1: Critical Security and Resilience

These must be done before any real users access the system. They cover both security vulnerabilities and code patterns that prevent crashes, data loss, and long debugging sessions.

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

### 1.5 Add Global Error Handler on the Server

**Problem:** Right now, if any route throws an unexpected error (like a Prisma connection timeout, a missing field, or a bad import), the server crashes silently or returns an unhelpful 500 error. There is no central place that catches these errors, logs them clearly, and returns a proper response. This is exactly what happened when the server went down — we had no idea what was failing or why.

**Fix:** Add a global error-handling middleware at the bottom of `index.js`, after all routes. This middleware catches any error that slips through individual route handlers. It should:

- Log the full error details (message, stack trace, which route was hit, what the request body was)
- Return a clean JSON error response to the client instead of raw HTML or a blank 500
- Distinguish between known error types (Prisma validation errors, authentication errors, not-found errors) and unknown errors
- Never expose internal stack traces or database details to the client in production

This is the single most impactful change for server stability. Every professional Express app has this. Without it, one bad request can bring down the entire server with no clue what went wrong.

---

### 1.6 Add Prisma-Specific Error Handling

**Problem:** Prisma throws specific error codes for different failure types — record not found (P2025), unique constraint violation (P2002), foreign key violation (P2003), connection timeout, etc. Right now, every route catches these with a generic `catch (error)` that returns the raw error message to the client. This is both a security risk (exposes database internals) and a debugging nightmare (all errors look the same in logs).

**Fix:** Create a shared error utility that translates Prisma error codes into user-friendly messages. For example:

- P2002 (unique constraint) → "This record already exists"
- P2025 (not found) → "Record not found"
- P2003 (foreign key) → "Cannot delete because other records depend on it"
- Connection errors → "Service temporarily unavailable, please try again"

This utility should be used inside the global error handler so every route gets proper Prisma error handling automatically, without writing the same try-catch logic in 25 different files.

---

### 1.7 Add Server Startup Validation

**Problem:** The server starts even if critical environment variables are missing (`DATABASE_URL`, `JWT_SECRET`), if the database is unreachable, or if Prisma Client was not generated. This leads to the server appearing online in Vercel but returning 500 errors on every request, with no clear indication of what's wrong.

**Fix:** Before the server starts accepting requests, it should:

- Check that all required environment variables are present and non-empty
- Attempt a test database connection and fail fast with a clear message if it can't connect
- Verify that Prisma Client is properly generated

If any check fails, the server should log exactly what's wrong and refuse to start. This turns a mysterious "everything is broken" situation into a clear "DATABASE_URL is missing" message that takes 10 seconds to fix instead of 2 hours to debug.

---

### 1.8 Add a Client-Side API Error Wrapper

**Problem:** On the frontend, every API file handles errors differently. Some use axios (which throws on non-2xx responses), some use fetch (which does not throw on non-2xx). Some check `res.ok`, some don't. Some parse error bodies, some don't. When the server returns an error, sometimes the user sees a helpful message, sometimes they see "Failed to fetch", and sometimes the app silently fails with no feedback at all.

**Fix:** Create a single shared API helper function that every API file uses. This function should:

- Automatically attach the auth token from localStorage
- Automatically set Content-Type headers
- Check if the response is OK and throw a proper error with the server's message if not
- Handle network failures (server is down, no internet) with a clear "Cannot connect to server" message
- Handle token expiry by detecting 401 responses and redirecting to the login page
- Provide a consistent pattern so every API call behaves the same way

This means every API file becomes simple and predictable. Instead of writing 10 lines of boilerplate per function, each function is 2-3 lines. And every error — network, auth, validation, server — is handled the same way everywhere.

---

### 1.9 Add Client-Side Retry Logic for Transient Failures

**Problem:** Vercel serverless functions have "cold starts" — the first request after a period of inactivity can take 3-5 seconds and occasionally timeout. When this happens, the user sees "Failed to fetch" with no explanation and no recovery. They have to manually refresh the page.

**Fix:** The shared API helper (from 1.8) should automatically retry failed requests once for network errors and 503/504 responses (server busy/timeout). The retry should have a short delay (1-2 seconds). This handles cold starts transparently — the first attempt wakes up the server, the retry gets the actual response. Do not retry on 4xx errors (those are client mistakes, not server issues).

---

### 1.10 Never Allow Destructive Database Commands in Production

**Problem:** The command `prisma migrate reset --force` was run against the production database, which dropped every table and deleted all data — all users, courses, enrollments, grades, everything. This was the most damaging incident in the project's history.

**Fix:** Establish strict rules for database operations:

- **Never** run `prisma migrate reset` against the production database. This command is for development only.
- **Never** run `prisma migrate dev` against production. Use `prisma migrate deploy` instead, which only applies pending migrations without resetting.
- Use `prisma db push` for quick schema syncs during development, but understand that it can also drop data if columns are removed.
- Before any schema change, always check what the migration will do by running `prisma migrate diff` first.
- Keep the `DATABASE_URL` in the local `.env` file pointing to a separate development database, never the production one. Use a separate `.env.production` or Vercel environment variables for production.
- Add a warning comment at the top of the `.env` file reminding that this connects to a real database.

This is not a code change — it's a process rule. But it's the most important rule in this entire document.

---

### 1.11 Lock Down the Vercel Configuration

**Problem:** A change to `vercel.json` broke the entire server deployment. The original working configuration used `builds` + `routes` with explicit `@vercel/node` builder. Changing this to `rewrites` caused the server to fail silently, returning 500 errors on every request.

**Fix:** Establish rules for the `vercel.json` file:

- The `vercel.json` configuration that works should be treated as critical infrastructure — do not change it unless absolutely necessary
- If a change to `vercel.json` is needed, make it in a separate commit with no other changes so it can be easily reverted
- Always keep the explicit `@vercel/node` builder specification; do not rely on auto-detection
- The `includeFiles` for Prisma must always be present
- Never change the deployment configuration and other code in the same commit

---

### 1.12 Add a Safe Deployment Checklist

**Problem:** Multiple issues happened at once — schema change, database reset, config change, new routes — all in one batch. When things broke, it was impossible to tell which change caused the problem.

**Fix:** Follow a deployment discipline:

- One concern per commit: schema changes, route changes, config changes, and frontend changes should be separate commits
- After each deployment, verify the health check endpoint responds correctly before making the next change
- Keep a known-good state: before making risky changes (schema, vercel.json, package.json), tag the current working commit so you can revert quickly
- Test schema changes by running `prisma db push` first (which is non-destructive) before creating a migration
- Never combine a Prisma migration with application code changes in the same deployment

---

### 1.13 Clean Unused and Dead Code

**Problem:** There are files in the codebase that were created but never connected to the rest of the application. They sit there adding confusion, inflating the project size, and making it harder to understand what's actually in use. Dead code is dangerous because future developers (or even you, months later) will assume it works and try to build on top of it, only to find it was never wired up.

**Unused Frontend API Files (not imported by any page or component):**

- `client/src/api/analytics.js` — has functions for tracking events, but no page ever calls them. The backend route exists, but the frontend never sends analytics. Either connect it to the app or remove it.
- `client/src/api/messaging.js` — has functions for conversations and messages, but no page imports it. The messaging UI in the dashboards likely uses inline fetch calls or a different pattern instead of this file.

**Unused Frontend Components:**

- `client/src/components/RequestOneOnOneModal.jsx` — this modal was built for students to request 1-on-1 sessions, but no page ever imports it. The student dashboard likely has its own inline implementation instead. Either the dashboard should import this component, or this file should be removed to avoid having two versions of the same thing.

**Unused Utility Files:**

- `client/src/utils/dateUtils.js` — contains date formatting helper functions, but zero files in the entire project import it. Every page that formats dates is doing it inline with its own logic, which means date formatting is inconsistent across the app. Either adopt this utility everywhere or remove it and standardize date formatting another way.

**Backend Routes With No Frontend Consumer:**

- `server/src/routes/announcements.js` — this route is registered in the server and handles creating/reading announcements, but no frontend page or API file ever calls it. The announcements feature was built on the backend but never connected to the UI.

**What to do:**

For each unused file, decide one of two things:

1. **Connect it** — if the feature is wanted, wire the file into the app properly (import the component, call the API, use the utility)
2. **Remove it** — if the feature isn't needed yet, delete the file entirely. It's in git history if you ever need it back. Dead code in the repo is worse than no code.

Do not leave files that nothing imports. Every file should be reachable from `App.jsx` (frontend) or `index.js` (backend) through a chain of imports. If it's not reachable, it's dead weight.

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

**Fix:** Pick one (recommended: keep `fetch` since it's native and doesn't require a dependency) and convert all API files to use it. All files should use the shared API helper from Phase 1.8 instead of raw fetch/axios calls. This guarantees consistent error handling, auth headers, and retry logic everywhere.

---

### 2.3 Add Input Validation Library

**Problem:** All backend validation is done with manual `if (!field)` checks. This is fragile, verbose, and easy to miss edge cases (e.g., string that is only whitespace, numbers that are negative, emails that are malformed).

**Fix:** Introduce a validation library like **Zod** or **Joi**. Define schemas for each endpoint's expected input. This gives you type-safe, declarative validation with clear error messages automatically.

---

### 2.4 Add Structured Logging

**Problem:** All logging is done with `console.log` and `console.error`. In production, these are hard to search, filter, and monitor. There's no way to distinguish between a warning and a critical error, or to trace a request through the system.

**Fix:** Introduce a lightweight logging library (e.g., **pino** or **winston**). Use log levels (debug, info, warn, error) consistently. Include request IDs for tracing. This is essential for debugging production issues on Vercel.

---

### 2.5 Standardize Route File Structure

**Problem:** Every route file has a slightly different structure. Some import Prisma from the shared lib, some create their own instance. Some define inline middleware, some use the shared one. Some return errors as `{ error: '...' }`, some as `{ message: '...' }`. This inconsistency makes it hard to read, modify, or debug any route file because you have to re-learn the patterns each time.

**Fix:** Define a standard template that every route file follows:

- Same import pattern at the top (shared prisma, shared middleware, shared error utility)
- Same try-catch structure in every handler
- Same error response format everywhere (`{ error: '...' }`)
- Same success response format everywhere (direct data or `{ message: '...', data: ... }`)
- Same ordering: imports, router creation, routes grouped by method (GET, POST, PUT, DELETE), export

When every file looks the same, you can jump into any file and immediately understand what's happening.

---

### 2.6 Add Defensive Coding Patterns on the Frontend

**Problem:** The frontend assumes API calls always succeed and data always has the expected shape. When the server returns unexpected data (missing fields, null values, empty arrays), components crash with errors like "Cannot read property 'firstName' of undefined" — which shows a blank screen to the user.

**Fix:** Apply defensive patterns consistently:

- Always use optional chaining when accessing nested data (e.g., `user?.profile?.firstName` instead of `user.profile.firstName`)
- Always provide fallback values for display (e.g., `user?.profile?.firstName || 'Unknown'`)
- Always check if arrays exist before mapping over them (e.g., `(items || []).map(...)`)
- Always handle the empty state in lists (show "No items found" instead of nothing)
- Always handle the loading state (show a spinner or skeleton while data is being fetched)
- Always handle the error state (show an error message with a retry button)

Every component that fetches data should have three states: loading, success, and error. Currently, many components only handle loading and success.

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
  TeacherDashboard.jsx          (layout + sidebar + routing only)
  tabs/DashboardTab.jsx         (overview stats)
  tabs/OfferingsTab.jsx         (my offerings list)
  tabs/OneOnOneTab.jsx          (1-on-1 requests)
  tabs/StudentsTab.jsx          (student management)
  tabs/ScheduleTab.jsx          (calendar view)
  tabs/GradesTab.jsx            (grades)
  tabs/MessagesTab.jsx          (messaging)
  tabs/SettingsTab.jsx          (settings)
```

Same approach for Student, Admin, and Course dashboards. The parent dashboard file should only handle the layout (sidebar, header, navigation) and render the active tab component. All state, API calls, and business logic for a tab should live inside that tab's file.

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

These are not bugs or issues — they're features that would make the platform more complete and user-friendly.

### 6.1 Email Notifications (Resend)
Send emails for: account creation, password reset, enrollment confirmation, session reminders, exam results, certificate issuance. Use **Resend** as the email provider.

**Priority:** High — essential for user communication

---

### 6.2 GCash Payment Screenshot Upload
Students pay via GCash and upload a screenshot as proof of payment. The system should:
- Accept image uploads (jpg, png)
- Convert to WebP format to save storage space
- Store the image (using Vercel Blob)
- Show "View Payment Proof" button on admin side
- Admin can approve/reject payment

**Priority:** High — needed for enrollment flow

---

### 6.3 Real-Time Features (WebSockets)
Live notifications, real-time messaging, live attendance tracking. Use WebSockets (Socket.io) or server-sent events.

**Priority:** Medium — nice to have for engagement

---

### 6.4 Mobile Responsiveness Audit
Ensure all dashboard views work well on tablets and phones. The current sidebar layout likely breaks on small screens.

**Priority:** Medium — many users access via mobile

---

### 6.5 Dark Mode
Add a theme toggle for dark mode across all pages.

**Priority:** Low — cosmetic enhancement

---

### 6.6 File Upload System (Vercel Blob)
Allow teachers to upload course materials directly instead of pasting Google Drive links. Use Vercel Blob for storage.

**Priority:** Medium — improves teacher experience

---

### 6.7 Automated PDF Reports
Generate PDF grade reports/transcripts per student per semester, similar to university transcripts.

**Priority:** Medium — useful for official records

---

### 6.8 Student Progress Dashboard
Visual progress tracking: completion percentage, streak tracking, learning analytics, performance trends over time.

**Priority:** Medium — improves student engagement

---

### 6.9 API Documentation (Swagger/OpenAPI)
Generate OpenAPI/Swagger documentation for all endpoints. Essential if third parties or mobile apps will consume the API.

**Priority:** Low — needed only for external integrations

---

### ~~6.10 Multi-Tenant Support~~ (REMOVED)
~~Support multiple universities/schools as separate tenants.~~

**Decision:** This is a single-school website. For other schools, the codebase will be duplicated and customized separately. No multi-tenant architecture needed.

---

## Execution Order & Status

| Order | Phase | Status | Completed |
|-------|-------|--------|-----------|
| 1 | Phase 1: Security + Resilience | ✅ DONE | March 6, 2026 |
| 2 | Phase 2: Code Quality | ✅ DONE | March 6, 2026 |
| 3 | Phase 3: Frontend Architecture | ✅ DONE | March 6, 2026 |
| 4 | Phase 4: Schema Cleanup (Partial) | ✅ DONE | March 7, 2026 |
| 5 | Phase 5: Production Hardening | ✅ DONE | March 7, 2026 |
| 6 | Phase 6: Features | 🔄 IN PROGRESS | - |

### Phase 6 Priority Order

| Priority | Feature | Effort | Status |
|----------|---------|--------|--------|
| 1 | 6.1 Email Notifications (Resend) | 1-2 days | Pending |
| 2 | 6.2 GCash Payment Screenshot Upload | 1-2 days | Pending |
| 3 | 6.4 Mobile Responsiveness Audit | 2-3 days | Pending |
| 4 | 6.3 Real-Time Features (WebSockets) | 3-5 days | Pending |
| 5 | 6.6 File Upload System (Vercel Blob) | 1-2 days | Pending |
| 6 | 6.7 Automated PDF Reports | 2-3 days | Pending |
| 7 | 6.8 Student Progress Dashboard | 3-5 days | Pending |
| 8 | 6.5 Dark Mode | 1 day | Pending |
| 9 | 6.9 API Documentation | 1-2 days | Pending |

---

## Notes

- All changes should be done incrementally with individual commits
- Each phase should be completed and verified before moving to the next
- Schema changes require careful migration planning to preserve data
- Frontend refactoring should be done one dashboard at a time
- Security fixes are non-negotiable before any public launch
- **Never run `prisma migrate reset` against the production database**
- **Never change `vercel.json` and application code in the same commit**
- **Always verify the health check endpoint after each deployment**
