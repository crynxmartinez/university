-- Add slug column to Course table (nullable first for migration)
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "slug" TEXT;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS "Course_slug_key" ON "Course"("slug");
