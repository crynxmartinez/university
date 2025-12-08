import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('Starting cleanup...')
  
  try {
    // Delete in order to respect foreign key constraints
    
    // Program related
    console.log('Deleting program exam answers...')
    await prisma.programExamAnswer.deleteMany({})
    console.log('Deleting program exam attempts...')
    await prisma.programExamAttempt.deleteMany({})
    console.log('Deleting program exam choices...')
    await prisma.programExamChoice.deleteMany({})
    console.log('Deleting program exam questions...')
    await prisma.programExamQuestion.deleteMany({})
    console.log('Deleting program exams...')
    await prisma.programExam.deleteMany({})
    console.log('Deleting program student notes...')
    await prisma.programStudentNote.deleteMany({})
    console.log('Deleting program attendance...')
    await prisma.programAttendance.deleteMany({})
    console.log('Deleting program session materials...')
    await prisma.programSessionMaterial.deleteMany({})
    console.log('Deleting program sessions...')
    await prisma.programSession.deleteMany({})
    console.log('Deleting program lessons...')
    await prisma.programLesson.deleteMany({})
    console.log('Deleting program modules...')
    await prisma.programModule.deleteMany({})
    console.log('Deleting program enrollments...')
    await prisma.programEnrollment.deleteMany({})
    
    // Course related
    console.log('Deleting exam answers...')
    await prisma.examAnswer.deleteMany({})
    console.log('Deleting exam attempts...')
    await prisma.examAttempt.deleteMany({})
    console.log('Deleting exam choices...')
    await prisma.examChoice.deleteMany({})
    console.log('Deleting exam questions...')
    await prisma.examQuestion.deleteMany({})
    console.log('Deleting exams...')
    await prisma.exam.deleteMany({})
    console.log('Deleting student notes...')
    await prisma.studentNote.deleteMany({})
    console.log('Deleting session attendance...')
    await prisma.sessionAttendance.deleteMany({})
    console.log('Deleting session materials...')
    await prisma.sessionMaterial.deleteMany({})
    console.log('Deleting scheduled sessions...')
    await prisma.scheduledSession.deleteMany({})
    console.log('Deleting lessons...')
    await prisma.lesson.deleteMany({})
    console.log('Deleting modules...')
    await prisma.module.deleteMany({})
    console.log('Deleting enrollments...')
    await prisma.enrollment.deleteMany({})
    console.log('Deleting courses...')
    await prisma.course.deleteMany({})
    
    // Programs (after courses since courses reference programs)
    console.log('Deleting programs...')
    await prisma.program.deleteMany({})
    
    // Users (except SUPER_ADMIN)
    console.log('Deleting teachers...')
    await prisma.teacher.deleteMany({})
    console.log('Deleting students...')
    await prisma.student.deleteMany({})
    console.log('Deleting registrars...')
    await prisma.registrar.deleteMany({})
    console.log('Deleting profiles for non-admin users...')
    await prisma.profile.deleteMany({
      where: {
        user: {
          role: { not: 'SUPER_ADMIN' }
        }
      }
    })
    console.log('Deleting non-admin users...')
    await prisma.user.deleteMany({
      where: {
        role: { not: 'SUPER_ADMIN' }
      }
    })
    
    // Reset ID counters
    console.log('Resetting ID counters...')
    await prisma.idCounter.deleteMany({})
    
    console.log('✅ Cleanup complete! Only SUPER_ADMIN accounts remain.')
  } catch (error) {
    console.error('Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanup()
