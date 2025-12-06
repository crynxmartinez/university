import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import CreateCourse from './pages/teacher/CreateCourse'
import CourseDetail from './pages/teacher/CourseDetail'
import CreateModule from './pages/teacher/CreateModule'
import CreateLesson from './pages/teacher/CreateLesson'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/courses/create" element={<CreateCourse />} />
      <Route path="/teacher/courses/:id" element={<CourseDetail />} />
      <Route path="/teacher/courses/:id/modules/create" element={<CreateModule />} />
      <Route path="/teacher/courses/:id/modules/:moduleId/lessons/create" element={<CreateLesson />} />
    </Routes>
  )
}

export default App
