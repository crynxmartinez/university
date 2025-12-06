import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ProgramsPage from './pages/ProgramsPage'
import ContactPage from './pages/ContactPage'
import BlogPage from './pages/BlogPage'
import LoginPage from './pages/LoginPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import CreateCourse from './pages/teacher/CreateCourse'
import CourseDetail from './pages/teacher/CourseDetail'
import CreateModule from './pages/teacher/CreateModule'
import CreateLesson from './pages/teacher/CreateLesson'
import EnrollStudents from './pages/teacher/EnrollStudents'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentCourseView from './pages/student/StudentCourseView'

function ScrollToTop() {
  const { pathname } = useLocation()
  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  
  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/programs" element={<ProgramsPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/courses/create" element={<CreateCourse />} />
      <Route path="/teacher/courses/:id" element={<CourseDetail />} />
      <Route path="/teacher/courses/:id/modules/create" element={<CreateModule />} />
      <Route path="/teacher/courses/:id/modules/:moduleId/lessons/create" element={<CreateLesson />} />
      <Route path="/teacher/courses/:id/students" element={<EnrollStudents />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/courses/:id" element={<StudentCourseView />} />
    </Routes>
    </>
  )
}

export default App
