import prisma from './prisma.js'

/**
 * Generate a URL-friendly slug from a course name
 * @param {string} name - The course name
 * @returns {string} - URL-friendly slug (e.g., "basic-fiqh-101")
 */
export function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug for a course
 * If the slug already exists, append -001, -002, etc.
 * @param {string} name - The course name
 * @param {string|null} excludeId - Course ID to exclude (for updates)
 * @returns {Promise<string>} - Unique slug
 */
export async function generateUniqueSlug(name, excludeId = null) {
  const baseSlug = generateSlug(name)
  
  // Check if base slug is available
  const existing = await prisma.course.findFirst({
    where: {
      slug: baseSlug,
      ...(excludeId && { id: { not: excludeId } })
    }
  })
  
  if (!existing) {
    return baseSlug
  }
  
  // Find all slugs that start with the base slug
  const similarSlugs = await prisma.course.findMany({
    where: {
      slug: { startsWith: baseSlug },
      ...(excludeId && { id: { not: excludeId } })
    },
    select: { slug: true }
  })
  
  // Extract the highest number suffix
  let maxNum = 0
  const pattern = new RegExp(`^${baseSlug}-(\\d+)$`)
  
  similarSlugs.forEach(course => {
    const match = course.slug.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > maxNum) maxNum = num
    }
  })
  
  // Generate new slug with incremented number
  const newNum = String(maxNum + 1).padStart(3, '0')
  return `${baseSlug}-${newNum}`
}
