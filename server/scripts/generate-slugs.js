import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Generate a URL-friendly slug from a course name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Generate slugs for all existing courses that don't have one
 */
async function generateSlugsForExistingCourses() {
  console.log('Starting slug generation for existing courses...')
  
  // Get all courses without slugs
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { slug: null },
        { slug: '' }
      ]
    }
  })
  
  console.log(`Found ${courses.length} courses without slugs`)
  
  for (const course of courses) {
    const baseSlug = generateSlug(course.name)
    
    // Check if slug exists
    let slug = baseSlug
    let counter = 0
    
    while (true) {
      const existing = await prisma.course.findFirst({
        where: {
          slug,
          id: { not: course.id }
        }
      })
      
      if (!existing) break
      
      counter++
      slug = `${baseSlug}-${String(counter).padStart(3, '0')}`
    }
    
    // Update course with new slug
    await prisma.course.update({
      where: { id: course.id },
      data: { slug }
    })
    
    console.log(`  ✓ ${course.name} → ${slug}`)
  }
  
  console.log('Done!')
}

generateSlugsForExistingCourses()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
