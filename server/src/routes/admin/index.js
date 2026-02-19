import express from 'express'
import programRoutes from './programs.js'
import programExamRoutes from './programExams.js'
import courseRoutes from './courses.js'
import courseExamRoutes from './courseExams.js'
import prisma from '../../lib/prisma.js'

const router = express.Router()

// Admin program management
router.use('/programs', programRoutes)
router.use('/program-exams', programExamRoutes)

// Admin course management
router.use('/courses', courseRoutes)
router.use('/course-exams', courseExamRoutes)

// Admin schedule - Get all sessions across system
router.get('/schedule', async (req, res) => {
  try {
    const { startDate, endDate, type, teacherId } = req.query
    
    // Build where clause for filtering
    const whereClause = {}
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    // Get all course sessions
    const courseSessions = await prisma.scheduledSession.findMany({
      where: {
        ...whereClause,
        ...(type === 'course' && {}),
        ...(teacherId && { course: { teacherId } })
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            teacher: {
              include: {
                user: {
                  include: {
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        lesson: {
          select: {
            id: true,
            name: true
          }
        },
        exam: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })
    
    // Get all program sessions
    const programSessions = await prisma.programSession.findMany({
      where: {
        ...whereClause,
        ...(type === 'program' && {}),
        ...(teacherId && { program: { teacherId } })
      },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            teacher: {
              include: {
                user: {
                  include: {
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        lesson: {
          select: {
            id: true,
            name: true
          }
        },
        exam: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })
    
    // Format sessions with source type
    const formattedCourseSessions = courseSessions.map(s => ({
      ...s,
      source: 'course',
      teacherName: s.course?.teacher?.user?.profile 
        ? `${s.course.teacher.user.profile.firstName} ${s.course.teacher.user.profile.lastName}`
        : 'Unknown'
    }))
    
    const formattedProgramSessions = programSessions.map(s => ({
      ...s,
      source: 'program',
      teacherName: s.program?.teacher?.user?.profile
        ? `${s.program.teacher.user.profile.firstName} ${s.program.teacher.user.profile.lastName}`
        : 'Unknown'
    }))
    
    res.json({
      courseSessions: formattedCourseSessions,
      programSessions: formattedProgramSessions,
      totalSessions: courseSessions.length + programSessions.length,
      stats: {
        totalCourse: courseSessions.length,
        totalProgram: programSessions.length,
        totalClass: [...courseSessions, ...programSessions].filter(s => s.type === 'CLASS').length,
        totalExam: [...courseSessions, ...programSessions].filter(s => s.type === 'EXAM').length
      }
    })
  } catch (error) {
    console.error('Error fetching admin schedule:', error)
    res.status(500).json({ error: 'Failed to fetch schedule' })
  }
})

export default router
