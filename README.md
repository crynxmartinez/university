# Assalaam University - Learning Management System

A comprehensive full-stack Learning Management System (LMS) built for online education delivery, featuring dual content structures (Programs and Courses), live/recorded sessions, exam management with anti-cheat features, and multi-role user management.

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite 5** - Build tool and dev server
- **TailwindCSS 3** - Utility-first CSS framework
- **React Router 6** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Quill** - Rich text editor
- **@dnd-kit** - Drag and drop functionality

### Backend
- **Node.js** - Runtime environment
- **Express 4** - Web framework
- **Prisma 6** - ORM and database toolkit
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Deployment
- **Vercel** - Hosting for both client and server (serverless)
- **GitHub** - Version control and CI/CD integration

## 📁 Project Structure

```
university/
├── client/          # React frontend application
├── server/          # Express backend API
├── .gitignore       # Git ignore rules
└── README.md        # This file
```

## ✨ Key Features

### User Roles
- **Super Admin** - Full system control, manages programs, courses, users
- **Registrar** - Student admission and enrollment management
- **Teacher** - Creates and manages courses, modules, lessons, exams
- **Student** - Enrolls in programs/courses, takes exams, views content

### Programs (Admin-Managed)
- Multiple program types: Webinar, In-Person, Online, Event, Hybrid
- Flexible pricing models: One-time, Monthly, Yearly
- Module and lesson structure
- Scheduled sessions with calendar integration
- Student enrollment tracking

### Courses (Teacher/Admin-Managed)
- Live and Recorded course types
- Module → Lesson hierarchy
- Scheduled sessions for live courses
- Student enrollment management
- Optional program association

### Exam System
- Multiple-choice question builder
- Auto-grading functionality
- Anti-cheat features:
  - Tab-switch tracking
  - Time limits
  - Attempt monitoring
- Support for retakes
- Separate exam systems for courses and programs

### Additional Features
- **Attendance Tracking** - Auto-marked when students join sessions
- **Student Notes** - Personal note-taking per lesson/session
- **Session Materials** - Google Drive integration for materials
- **Analytics** - Teacher and admin dashboards with enrollment and attendance stats
- **Calendar Integration** - Scheduled sessions with meeting links

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (hosted or local)
- GitHub account
- Vercel account

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/crynxmartinez/university.git
   cd university
   ```

2. **Set up the server**
   ```bash
   cd server
   npm install
   ```
   
   Create a `.env` file (see `server/.env.example`):
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database"
   JWT_SECRET="your-secret-key"
   PORT=5000
   NODE_ENV="development"
   ```

   Run Prisma migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Set up the client**
   ```bash
   cd ../client
   npm install
   ```
   
   Create a `.env` file (see `client/.env.example`):
   ```env
   VITE_API_URL="https://your-api-url.vercel.app/api"
   ```

4. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Create two separate projects: one for client, one for server
   - Configure environment variables in Vercel dashboard
   - See `DEPLOYMENT.md` for detailed deployment instructions

## 📚 Documentation

- [Client README](./client/README.md) - Frontend setup and development
- [Server README](./server/README.md) - Backend setup and API documentation
- [Deployment Guide](./DEPLOYMENT.md) - Vercel deployment instructions

## 🔐 Default Credentials

After running the database seed:
- **Super Admin**: Check your seed script for credentials
- **First Login**: All users must change password on first login

## 🛠️ Development

This project is designed for **Vercel deployment only**. All changes should be pushed to GitHub, which triggers automatic deployment via Vercel.

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This is a private educational project. Contact the repository owner for contribution guidelines.

## 📧 Support

For issues or questions, please contact the system administrator.
