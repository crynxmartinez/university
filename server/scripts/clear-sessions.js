import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearSessions() {
  try {
    // First delete all session materials (foreign key constraint)
    const deletedMaterials = await prisma.sessionMaterial.deleteMany({})
    console.log(`Deleted ${deletedMaterials.count} session materials`)

    // Then delete all attendance records
    const deletedAttendance = await prisma.sessionAttendance.deleteMany({})
    console.log(`Deleted ${deletedAttendance.count} attendance records`)

    // Finally delete all scheduled sessions
    const deletedSessions = await prisma.scheduledSession.deleteMany({})
    console.log(`Deleted ${deletedSessions.count} scheduled sessions`)

    console.log('\n✅ All scheduled sessions cleared!')
  } catch (error) {
    console.error('Error clearing sessions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearSessions()
