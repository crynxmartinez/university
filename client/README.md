# Assalaam University - Client (Frontend)

React-based frontend application for the Assalaam University Learning Management System.

## 🛠️ Tech Stack

- **React 18.2** - UI library
- **Vite 5.0** - Build tool and dev server
- **TailwindCSS 3.3** - Utility-first CSS
- **React Router 6.20** - Client-side routing
- **Axios 1.6** - HTTP client
- **Lucide React 0.294** - Icon library
- **React Quill 2.0** - Rich text editor
- **@dnd-kit** - Drag and drop for exam builder

## 📁 Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── api/            # API client functions (18 modules)
│   ├── components/     # Reusable components
│   │   ├── Footer.jsx
│   │   ├── Navbar.jsx
│   │   ├── SessionCalendar.jsx
│   │   └── Toast.jsx
│   ├── pages/          # Page components
│   │   ├── admin/      # Admin pages (6 pages)
│   │   ├── student/    # Student pages (5 pages)
│   │   ├── teacher/    # Teacher pages (7 pages)
│   │   └── *.jsx       # Public & auth pages
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main app component with routes
│   ├── main.jsx        # App entry point
│   └── index.css       # Global styles
├── .env.example        # Environment variables template
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vercel.json         # Vercel deployment config
└── vite.config.js
```

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL="https://your-api-url.vercel.app/api"
```

For production, set this in Vercel dashboard.

### 3. Build

```bash
npm run build
```

## 📦 Available Scripts

- `npm run dev` - Start Vite dev server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎨 Pages Overview

### Public Pages
- **HomePage** - Landing page with hero section
- **AboutPage** - About the institution
- **ProgramsPage** - Browse available programs
- **ContactPage** - Contact form
- **BlogPage** - Blog/news section
- **LoginPage** - User authentication
- **SignUpPage** - Student registration

### Admin Pages (6)
- **AdminDashboard** - User management, programs, courses overview
- **AdminCreateProgram** - Create new programs
- **AdminProgramDashboard** - Manage program content, sessions, exams
- **AdminProgramExamBuilder** - Build program exams
- **AdminCreateCourse** - Create new courses
- **AdminCourseDashboard** - Manage course content, sessions, exams
- **AdminCourseExamBuilder** - Build course exams

### Teacher Pages (7)
- **TeacherDashboard** - Course overview, analytics, schedule
- **CreateCourse** - Create new course
- **CourseDashboard** - Manage course modules, lessons, sessions, exams
- **CreateModule** - Add module to course
- **CreateLesson** - Add lesson to module
- **EnrollStudents** - Enroll students in course
- **ExamBuilder** - Create and manage exams

### Student Pages (5)
- **StudentDashboard** - Enrolled courses/programs, upcoming sessions
- **StudentCourseView** - View course content, take notes, attend sessions
- **StudentExam** - Take course exams
- **StudentProgramView** - View program content
- **StudentProgramExam** - Take program exams

### Other
- **RegistrarDashboard** - Student admission management
- **ChangePasswordPage** - Force password change on first login

## 🔌 API Integration

All API calls are organized in `src/api/` directory:

- `auth.js` - Authentication
- `users.js` - User management
- `programs.js` - Program CRUD
- `adminPrograms.js` - Admin program management
- `programEnrollments.js` - Program enrollments
- `studentPrograms.js` - Student program views
- `courses.js` - Course CRUD
- `adminCourses.js` - Admin course management
- `modules.js` - Module management
- `lessons.js` - Lesson management
- `enrollments.js` - Course enrollments
- `sessions.js` - Scheduled sessions
- `notes.js` - Student notes
- `attendance.js` - Attendance tracking
- `exams.js` - Exam management
- `adminCourseExams.js` - Admin course exams
- `adminProgramExams.js` - Admin program exams

Base URL configured via `VITE_API_URL` environment variable.

## 🎨 Styling

- **TailwindCSS** for utility-first styling
- **Custom colors**:
  - Primary: `#1e3a5f` (Navy blue)
  - Secondary: `#f7941d` (Orange)
- **Responsive design** - Mobile-first approach
- **Dark mode** - Not implemented

## 🚀 Deployment

Deployed to **Vercel** automatically via GitHub integration.

### Vercel Configuration

The `vercel.json` file configures SPA routing:

```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Environment Variables in Vercel

Set in Vercel dashboard:
- `VITE_API_URL` - Your backend API URL

## 🔐 Authentication

- JWT tokens stored in `localStorage`
- Token sent in `Authorization` header: `Bearer <token>`
- Protected routes redirect to login if not authenticated
- Role-based access control on frontend (also enforced on backend)

## 📝 Notes

- No local development - push to GitHub, deploy via Vercel
- Google Drive links used for materials (no file upload)
- Toast notifications for user feedback
- Session calendar with drag-and-drop support
- Exam builder with question reordering

## 🐛 Known Issues

- Notification system UI not implemented (schema exists)
- Student grades page is placeholder
- Certificate generation not implemented

## 📧 Support

Contact the system administrator for issues or questions.
