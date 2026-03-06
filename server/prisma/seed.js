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
        create: {
          registrarId: 'REG-20250001'
        }
      }
    }
  })

  // Initialize ID sequences
  const currentYear = new Date().getFullYear()

  await prisma.idSequence.upsert({
    where: { type_year: { type: 'TEACHER', year: currentYear } },
    update: {},
    create: { type: 'TEACHER', year: currentYear, lastNumber: 0 }
  })

  await prisma.idSequence.upsert({
    where: { type_year: { type: 'STUDENT', year: currentYear } },
    update: {},
    create: { type: 'STUDENT', year: currentYear, lastNumber: 0 }
  })

  await prisma.idSequence.upsert({
    where: { type_year: { type: 'REGISTRAR', year: currentYear } },
    update: {},
    create: { type: 'REGISTRAR', year: currentYear, lastNumber: 1 }
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
