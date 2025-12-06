import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const superAdmin = await prisma.user.upsert({
    where: { userId: 'ADMIN-001' },
    update: {},
    create: {
      userId: 'ADMIN-001',
      email: 'admin@assalaam.edu.ph',
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

  console.log('Super Admin created:', superAdmin.userId)
  console.log('')
  console.log('Login credentials:')
  console.log('  User ID: ADMIN-001')
  console.log('  Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
