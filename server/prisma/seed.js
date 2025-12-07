import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { userId: 'ADMIN-001' },
    update: {},
    create: {
      userId: 'ADMIN-001',
      email: 'admin@ilm.edu.ph',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      mustChangePassword: false,
      profileComplete: true,
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin'
        }
      }
    }
  })

  // Create Registrar
  const registrar = await prisma.user.upsert({
    where: { userId: 'registrar-2025001' },
    update: {},
    create: {
      userId: 'registrar-2025001',
      email: 'registrar@ilm.edu.ph',
      password: hashedPassword,
      role: 'REGISTRAR',
      mustChangePassword: false,
      profileComplete: true,
      profile: {
        create: {
          firstName: 'Main',
          lastName: 'Registrar'
        }
      },
      registrar: {
        create: {}
      }
    }
  })

  // Initialize ID sequences
  await prisma.idSequence.upsert({
    where: { role: 'TEACHER' },
    update: {},
    create: { role: 'TEACHER', lastNumber: 0 }
  })

  await prisma.idSequence.upsert({
    where: { role: 'STUDENT' },
    update: {},
    create: { role: 'STUDENT', lastNumber: 0 }
  })

  await prisma.idSequence.upsert({
    where: { role: 'REGISTRAR' },
    update: {},
    create: { role: 'REGISTRAR', lastNumber: 1 }
  })

  console.log('Super Admin created:', superAdmin.userId)
  console.log('Registrar created:', registrar.userId)
  console.log('')
  console.log('Login credentials:')
  console.log('  Super Admin - User ID: ADMIN-001, Password: admin123')
  console.log('  Registrar - User ID: registrar-2025001, Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
