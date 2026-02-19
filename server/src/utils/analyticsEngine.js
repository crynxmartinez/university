import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Track analytics event
export async function trackEvent(eventType, userId = null, metadata = null) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        userId,
        metadata
      }
    })
  } catch (error) {
    console.error('Error tracking event:', error)
  }
}

// Get system-wide analytics overview (Admin)
export async function getSystemAnalytics(dateRange = null) {
  try {
    const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
    const endDate = dateRange?.end ? new Date(dateRange.end) : new Date()

    // Total users by role
    const userStats = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    })

    // Total enrollments
    const courseEnrollments = await prisma.enrollment.count()
    const programEnrollments = await prisma.programEnrollment.count()

    // Active courses and programs
    const activeCourses = await prisma.course.count({ where: { isActive: true } })
    const activePrograms = await prisma.program.count({ where: { isActive: true } })

    // Certificates issued
    const certificatesIssued = await prisma.certificate.count({
      where: {
        status: 'ACTIVE',
        issuedDate: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Recent activity events
    const recentEvents = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    })

    // Daily active users
    const dailyActiveUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        eventType: 'LOGIN',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      _count: true
    })

    // Enrollment trends (last 7 days)
    const enrollmentTrends = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const courseCount = await prisma.enrollment.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })

      const programCount = await prisma.programEnrollment.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })

      enrollmentTrends.push({
        date: date.toISOString().split('T')[0],
        courses: courseCount,
        programs: programCount,
        total: courseCount + programCount
      })
    }

    return {
      userStats: userStats.reduce((acc, stat) => {
        acc[stat.role.toLowerCase()] = stat._count
        return acc
      }, {}),
      enrollments: {
        courses: courseEnrollments,
        programs: programEnrollments,
        total: courseEnrollments + programEnrollments
      },
      activeContent: {
        courses: activeCourses,
        programs: activePrograms
      },
      certificatesIssued,
      recentActivity: recentEvents.map(e => ({
        eventType: e.eventType,
        count: e._count
      })),
      dailyActiveUsers: dailyActiveUsers.length,
      enrollmentTrends
    }
  } catch (error) {
    console.error('Error getting system analytics:', error)
    throw error
  }
}

// Get course-specific analytics (Teacher)
export async function getCourseAnalytics(courseId) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        },
        sessions: true,
        exams: {
          include: {
            scores: true
          }
        }
      }
    })

    if (!course) {
      throw new Error('Course not found')
    }

    // Enrollment stats
    const totalEnrollments = course.enrollments.length
    const activeEnrollments = course.enrollments.filter(e => e.status === 'ACTIVE').length

    // Attendance stats
    const totalSessions = course.sessions.length
    const attendanceRecords = await prisma.sessionAttendance.count({
      where: {
        session: {
          courseId
        }
      }
    })
    const averageAttendance = totalSessions > 0 && totalEnrollments > 0
      ? (attendanceRecords / (totalSessions * totalEnrollments)) * 100
      : 0

    // Exam performance
    const examScores = await prisma.examScore.findMany({
      where: {
        exam: {
          courseId
        }
      }
    })
    const averageExamScore = examScores.length > 0
      ? examScores.reduce((sum, score) => sum + score.score, 0) / examScores.length
      : 0

    // Grade distribution
    const grades = await prisma.gradeCalculation.findMany({
      where: { courseId },
      select: { letterGrade: true }
    })
    const gradeDistribution = grades.reduce((acc, grade) => {
      acc[grade.letterGrade] = (acc[grade.letterGrade] || 0) + 1
      return acc
    }, {})

    // Completion rate
    const completedStudents = grades.filter(g => g.letterGrade !== 'F').length
    const completionRate = totalEnrollments > 0 ? (completedStudents / totalEnrollments) * 100 : 0

    // At-risk students (attendance < 70% or exam average < 70%)
    const atRiskStudents = []
    for (const enrollment of course.enrollments) {
      const studentAttendance = await prisma.sessionAttendance.count({
        where: {
          studentId: enrollment.studentId,
          session: {
            courseId
          }
        }
      })
      const attendanceRate = totalSessions > 0 ? (studentAttendance / totalSessions) * 100 : 100

      const studentExamScores = examScores.filter(s => s.studentId === enrollment.studentId)
      const examAverage = studentExamScores.length > 0
        ? studentExamScores.reduce((sum, s) => sum + s.score, 0) / studentExamScores.length
        : 100

      if (attendanceRate < 70 || examAverage < 70) {
        atRiskStudents.push({
          studentId: enrollment.studentId,
          name: enrollment.student.user.profile
            ? `${enrollment.student.user.profile.firstName} ${enrollment.student.user.profile.lastName}`
            : enrollment.student.user.email,
          attendanceRate: Math.round(attendanceRate),
          examAverage: Math.round(examAverage)
        })
      }
    }

    return {
      courseId,
      courseName: course.name,
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments
      },
      attendance: {
        totalSessions,
        averageRate: Math.round(averageAttendance)
      },
      exams: {
        total: course.exams.length,
        averageScore: Math.round(averageExamScore)
      },
      gradeDistribution,
      completionRate: Math.round(completionRate),
      atRiskStudents
    }
  } catch (error) {
    console.error('Error getting course analytics:', error)
    throw error
  }
}

// Get student progress analytics
export async function getStudentAnalytics(studentId) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            course: true
          }
        },
        programEnrollments: {
          include: {
            program: true
          }
        },
        gradeCalculations: {
          include: {
            course: true,
            program: true
          }
        },
        certificates: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!student) {
      throw new Error('Student not found')
    }

    // Overall GPA
    const grades = student.gradeCalculations
    const overallGPA = grades.length > 0
      ? grades.reduce((sum, g) => sum + g.gpa, 0) / grades.length
      : 0

    // Course progress
    const courseProgress = await Promise.all(
      student.enrollments.map(async (enrollment) => {
        const attendance = await prisma.sessionAttendance.count({
          where: {
            studentId,
            session: {
              courseId: enrollment.courseId
            }
          }
        })
        const totalSessions = await prisma.scheduledSession.count({
          where: { courseId: enrollment.courseId }
        })
        const attendanceRate = totalSessions > 0 ? (attendance / totalSessions) * 100 : 0

        const grade = grades.find(g => g.courseId === enrollment.courseId)

        return {
          courseId: enrollment.courseId,
          courseName: enrollment.course.name,
          attendanceRate: Math.round(attendanceRate),
          grade: grade ? grade.letterGrade : null,
          gpa: grade ? grade.gpa : null
        }
      })
    )

    // Activity timeline (last 30 days)
    const activityEvents = await prisma.analyticsEvent.findMany({
      where: {
        userId: student.userId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return {
      studentId,
      overallGPA: parseFloat(overallGPA.toFixed(2)),
      totalEnrollments: student.enrollments.length + student.programEnrollments.length,
      certificatesEarned: student.certificates.length,
      courseProgress,
      recentActivity: activityEvents.map(e => ({
        eventType: e.eventType,
        timestamp: e.createdAt,
        metadata: e.metadata
      }))
    }
  } catch (error) {
    console.error('Error getting student analytics:', error)
    throw error
  }
}

// Get teacher performance analytics (Admin)
export async function getTeacherAnalytics(teacherId) {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: {
        courses: {
          include: {
            enrollments: true,
            sessions: true
          }
        },
        programs: {
          include: {
            enrollments: true
          }
        }
      }
    })

    if (!teacher) {
      throw new Error('Teacher not found')
    }

    const totalCourses = teacher.courses.length
    const totalPrograms = teacher.programs.length
    const totalEnrollments = teacher.courses.reduce((sum, c) => sum + c.enrollments.length, 0) +
                            teacher.programs.reduce((sum, p) => sum + p.enrollments.length, 0)
    const totalSessions = teacher.courses.reduce((sum, c) => sum + c.sessions.length, 0)

    // Certificates issued by this teacher
    const certificatesIssued = await prisma.certificate.count({
      where: {
        issuedById: teacher.userId,
        status: 'ACTIVE'
      }
    })

    // Average student performance across all courses
    const allGrades = await prisma.gradeCalculation.findMany({
      where: {
        courseId: {
          in: teacher.courses.map(c => c.id)
        }
      }
    })
    const averageStudentGPA = allGrades.length > 0
      ? allGrades.reduce((sum, g) => sum + g.gpa, 0) / allGrades.length
      : 0

    return {
      teacherId,
      totalCourses,
      totalPrograms,
      totalEnrollments,
      totalSessions,
      certificatesIssued,
      averageStudentGPA: parseFloat(averageStudentGPA.toFixed(2))
    }
  } catch (error) {
    console.error('Error getting teacher analytics:', error)
    throw error
  }
}
