import prisma from '../lib/prisma.js'

const GRADE_SCALE = {
  'A': { min: 93, gpa: 4.0 },
  'A-': { min: 90, gpa: 3.7 },
  'B+': { min: 87, gpa: 3.3 },
  'B': { min: 83, gpa: 3.0 },
  'B-': { min: 80, gpa: 2.7 },
  'C+': { min: 77, gpa: 2.3 },
  'C': { min: 73, gpa: 2.0 },
  'C-': { min: 70, gpa: 1.7 },
  'D': { min: 60, gpa: 1.0 },
  'F': { min: 0, gpa: 0.0 }
}

const WEIGHT_CONFIG = {
  examWeight: 0.7,      // 70% exams
  attendanceWeight: 0.3  // 30% attendance
}

function getLetterGrade(percentage) {
  for (const [letter, config] of Object.entries(GRADE_SCALE)) {
    if (percentage >= config.min) {
      return { letter, gpa: config.gpa }
    }
  }
  return { letter: 'F', gpa: 0.0 }
}

export async function calculateCourseGrade(studentId, courseId) {
  try {
    const examScores = await prisma.examScore.findMany({
      where: {
        studentId,
        exam: { courseId }
      },
      include: {
        exam: true
      }
    })

    const examAverage = examScores.length > 0
      ? examScores.reduce((sum, score) => sum + score.score, 0) / examScores.length
      : 0

    const totalSessions = await prisma.scheduledSession.count({
      where: {
        courseId,
        type: 'CLASS',
        date: { lte: new Date() }
      }
    })

    const attendedSessions = await prisma.sessionAttendance.count({
      where: {
        studentId,
        session: {
          courseId,
          type: 'CLASS',
          date: { lte: new Date() }
        },
        attended: true
      }
    })

    const attendancePercentage = totalSessions > 0
      ? (attendedSessions / totalSessions) * 100
      : 0

    const finalGrade = (examAverage * WEIGHT_CONFIG.examWeight) + 
                       (attendancePercentage * WEIGHT_CONFIG.attendanceWeight)

    const { letter, gpa } = getLetterGrade(finalGrade)

    const gradeData = {
      studentId,
      courseId,
      examScore: parseFloat(examAverage.toFixed(2)),
      attendanceScore: parseFloat(attendancePercentage.toFixed(2)),
      finalGrade: parseFloat(finalGrade.toFixed(2)),
      letterGrade: letter,
      gpa: parseFloat(gpa.toFixed(2))
    }

    const existingGrade = await prisma.gradeCalculation.findUnique({
      where: {
        studentId_courseId: { studentId, courseId }
      }
    })

    if (existingGrade) {
      return await prisma.gradeCalculation.update({
        where: { id: existingGrade.id },
        data: gradeData
      })
    } else {
      return await prisma.gradeCalculation.create({
        data: gradeData
      })
    }
  } catch (error) {
    console.error('Error calculating course grade:', error)
    throw error
  }
}

export async function calculateProgramGrade(studentId, programId) {
  try {
    const programExamAttempts = await prisma.programExamAttempt.findMany({
      where: {
        studentId,
        exam: { programId },
        status: 'SUBMITTED'
      },
      include: {
        exam: true
      }
    })

    const examAverage = programExamAttempts.length > 0
      ? programExamAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / programExamAttempts.length
      : 0

    const totalSessions = await prisma.programSession.count({
      where: {
        programId,
        type: 'CLASS',
        date: { lte: new Date() }
      }
    })

    const attendedSessions = await prisma.programAttendance.count({
      where: {
        studentId,
        session: {
          programId,
          type: 'CLASS',
          date: { lte: new Date() }
        },
        attended: true
      }
    })

    const attendancePercentage = totalSessions > 0
      ? (attendedSessions / totalSessions) * 100
      : 0

    const finalGrade = (examAverage * WEIGHT_CONFIG.examWeight) + 
                       (attendancePercentage * WEIGHT_CONFIG.attendanceWeight)

    const { letter, gpa } = getLetterGrade(finalGrade)

    const gradeData = {
      studentId,
      programId,
      examScore: parseFloat(examAverage.toFixed(2)),
      attendanceScore: parseFloat(attendancePercentage.toFixed(2)),
      finalGrade: parseFloat(finalGrade.toFixed(2)),
      letterGrade: letter,
      gpa: parseFloat(gpa.toFixed(2))
    }

    const existingGrade = await prisma.gradeCalculation.findUnique({
      where: {
        studentId_programId: { studentId, programId }
      }
    })

    if (existingGrade) {
      return await prisma.gradeCalculation.update({
        where: { id: existingGrade.id },
        data: gradeData
      })
    } else {
      return await prisma.gradeCalculation.create({
        data: gradeData
      })
    }
  } catch (error) {
    console.error('Error calculating program grade:', error)
    throw error
  }
}

export async function calculateAllStudentGrades(studentId) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true }
    })

    const programEnrollments = await prisma.programEnrollment.findMany({
      where: { studentId },
      select: { programId: true }
    })

    const courseGrades = await Promise.all(
      enrollments.map(e => calculateCourseGrade(studentId, e.courseId))
    )

    const programGrades = await Promise.all(
      programEnrollments.map(e => calculateProgramGrade(studentId, e.programId))
    )

    return {
      courseGrades,
      programGrades,
      totalGrades: courseGrades.length + programGrades.length
    }
  } catch (error) {
    console.error('Error calculating all student grades:', error)
    throw error
  }
}

export async function getStudentGrades(studentId) {
  try {
    const grades = await prisma.gradeCalculation.findMany({
      where: { studentId },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true
          }
        },
        program: {
          select: {
            id: true,
            name: true,
            slug: true,
            programType: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const courseGrades = grades.filter(g => g.courseId)
    const programGrades = grades.filter(g => g.programId)

    const overallGPA = grades.length > 0
      ? grades.reduce((sum, g) => sum + g.gpa, 0) / grades.length
      : 0

    return {
      courseGrades,
      programGrades,
      overallGPA: parseFloat(overallGPA.toFixed(2)),
      totalGrades: grades.length
    }
  } catch (error) {
    console.error('Error fetching student grades:', error)
    throw error
  }
}
