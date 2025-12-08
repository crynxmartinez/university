import express from 'express'
import programRoutes from './programs.js'
import programExamRoutes from './programExams.js'
import courseRoutes from './courses.js'
import courseExamRoutes from './courseExams.js'

const router = express.Router()

// Admin program management
router.use('/programs', programRoutes)
router.use('/program-exams', programExamRoutes)

// Admin course management
router.use('/courses', courseRoutes)
router.use('/course-exams', courseExamRoutes)

export default router
