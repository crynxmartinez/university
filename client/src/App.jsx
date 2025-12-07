import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ToastProvider } from './components/Toast'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ProgramsPage from './pages/ProgramsPage'
import ContactPage from './pages/ContactPage'
import BlogPage from './pages/BlogPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import AdminDashboard from './pages/AdminDashboard'
import RegistrarDashboard from './pages/RegistrarDashboard'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import CreateCourse from './pages/teacher/CreateCourse'
import CreateModule from './pages/teacher/CreateModule'
import CreateLesson from './pages/teacher/CreateLesson'
import EnrollStudents from './pages/teacher/EnrollStudents'
import CourseDashboard from './pages/teacher/CourseDashboard'
import ExamBuilder from './pages/teacher/ExamBuilder'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentCourseView from './pages/student/StudentCourseView'
import StudentExam from './pages/student/StudentExam'

function ScrollToTop() {
  const { pathname } = useLocation()
  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  
  return null
}

function App() {
  return (
    <ToastProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/registrar" element={<RegistrarDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/courses/create" element={<CreateCourse />} />
        <Route path="/teacher/courses/:id/dashboard" element={<CourseDashboard />} />
        <Route path="/teacher/courses/:id" element={<CourseDashboard />} />
        <Route path="/teacher/courses/:id/modules/create" element={<CreateModule />} />
        <Route path="/teacher/courses/:id/modules/:moduleId/lessons/create" element={<CreateLesson />} />
        <Route path="/teacher/courses/:id/students" element={<EnrollStudents />} />
        <Route path="/teacher/courses/:id/exam/:examId" element={<ExamBuilder />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/courses/:id" element={<StudentCourseView />} />
        <Route path="/student/courses/:id/exam/:examId" element={<StudentExam />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
