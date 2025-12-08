import express from 'express'
import programRoutes from './programs.js'
import programExamRoutes from './programExams.js'

const router = express.Router()

// Admin program management
router.use('/programs', programRoutes)
router.use('/program-exams', programExamRoutes)

export default router
