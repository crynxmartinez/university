// Phase 6.7: PDF Report Generator
import PDFDocument from 'pdfkit'

// Colors
const COLORS = {
  primary: '#1e3a5f',
  secondary: '#f7941d',
  text: '#333333',
  lightGray: '#666666',
  border: '#cccccc'
}

/**
 * Generate a student transcript PDF
 * @param {Object} student - Student data with grades
 * @param {Object} options - Generation options
 * @returns {Promise<Buffer>} - PDF buffer
 */
export async function generateTranscript(student, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Transcript - ${student.name}`,
          Author: 'ILM Learning Center',
          Subject: 'Student Transcript'
        }
      })

      const chunks = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      drawHeader(doc, 'OFFICIAL TRANSCRIPT')

      // Student Info
      doc.moveDown(2)
      doc.fontSize(12).fillColor(COLORS.text)
      doc.text(`Student Name: ${student.name}`, { continued: false })
      doc.text(`Student ID: ${student.studentId}`)
      doc.text(`Email: ${student.email || 'N/A'}`)
      doc.text(`Date Generated: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`)

      // Grades Table
      doc.moveDown(2)
      doc.fontSize(14).fillColor(COLORS.primary).text('Academic Record', { underline: true })
      doc.moveDown()

      if (student.grades && student.grades.length > 0) {
        drawGradesTable(doc, student.grades)
      } else {
        doc.fontSize(11).fillColor(COLORS.lightGray)
        doc.text('No grades recorded yet.')
      }

      // GPA Summary
      if (student.gpa !== undefined) {
        doc.moveDown(2)
        doc.fontSize(12).fillColor(COLORS.text)
        doc.text(`Cumulative GPA: ${student.gpa.toFixed(2)}`, { align: 'right' })
      }

      // Footer
      drawFooter(doc)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate a grade report PDF for a specific semester/period
 */
export async function generateGradeReport(student, semester, grades) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Grade Report - ${student.name} - ${semester}`,
          Author: 'ILM Learning Center',
          Subject: 'Grade Report'
        }
      })

      const chunks = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      drawHeader(doc, 'GRADE REPORT')

      // Student & Semester Info
      doc.moveDown(2)
      doc.fontSize(12).fillColor(COLORS.text)
      doc.text(`Student Name: ${student.name}`)
      doc.text(`Student ID: ${student.studentId}`)
      doc.text(`Semester: ${semester}`)
      doc.text(`Date: ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`)

      // Grades
      doc.moveDown(2)
      if (grades && grades.length > 0) {
        drawGradesTable(doc, grades)

        // Calculate semester GPA
        const totalPoints = grades.reduce((sum, g) => sum + (g.gradePoints || 0), 0)
        const semesterGPA = totalPoints / grades.length

        doc.moveDown()
        doc.fontSize(12).fillColor(COLORS.text)
        doc.text(`Semester GPA: ${semesterGPA.toFixed(2)}`, { align: 'right' })
      } else {
        doc.fontSize(11).fillColor(COLORS.lightGray)
        doc.text('No grades for this semester.')
      }

      // Footer
      drawFooter(doc)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Generate a certificate PDF
 */
export async function generateCertificatePDF(certificate) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        layout: 'landscape',
        margin: 50,
        info: {
          Title: `Certificate - ${certificate.studentName}`,
          Author: 'ILM Learning Center',
          Subject: 'Certificate of Completion'
        }
      })

      const chunks = []
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width
      const pageHeight = doc.page.height

      // Border
      doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
        .strokeColor(COLORS.secondary)
        .lineWidth(3)
        .stroke()

      doc.rect(40, 40, pageWidth - 80, pageHeight - 80)
        .strokeColor(COLORS.primary)
        .lineWidth(1)
        .stroke()

      // Title
      doc.fontSize(36).fillColor(COLORS.primary)
      doc.text('CERTIFICATE OF COMPLETION', 0, 100, { align: 'center', width: pageWidth })

      // Decorative line
      doc.moveTo(pageWidth / 2 - 100, 150)
        .lineTo(pageWidth / 2 + 100, 150)
        .strokeColor(COLORS.secondary)
        .lineWidth(2)
        .stroke()

      // Body text
      doc.fontSize(14).fillColor(COLORS.lightGray)
      doc.text('This is to certify that', 0, 180, { align: 'center', width: pageWidth })

      doc.fontSize(28).fillColor(COLORS.primary)
      doc.text(certificate.studentName, 0, 210, { align: 'center', width: pageWidth })

      doc.fontSize(14).fillColor(COLORS.lightGray)
      doc.text('has successfully completed the', 0, 260, { align: 'center', width: pageWidth })

      doc.fontSize(20).fillColor(COLORS.text)
      doc.text(certificate.courseName || certificate.programName, 0, 290, { align: 'center', width: pageWidth })

      doc.fontSize(12).fillColor(COLORS.lightGray)
      doc.text(`with a grade of ${certificate.grade || 'PASSED'}`, 0, 330, { align: 'center', width: pageWidth })

      // Date
      doc.fontSize(12).fillColor(COLORS.text)
      doc.text(`Issued on: ${new Date(certificate.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, 0, 380, { align: 'center', width: pageWidth })

      // Certificate ID
      doc.fontSize(10).fillColor(COLORS.lightGray)
      doc.text(`Certificate ID: ${certificate.id}`, 0, 420, { align: 'center', width: pageWidth })

      // Footer
      doc.fontSize(12).fillColor(COLORS.primary)
      doc.text('ILM Learning Center', 0, pageHeight - 100, { align: 'center', width: pageWidth })

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// Helper functions
function drawHeader(doc, title) {
  const pageWidth = doc.page.width - 100

  // Logo placeholder (text-based)
  doc.fontSize(20).fillColor(COLORS.primary)
  doc.text('ILM LEARNING CENTER', 50, 50, { width: pageWidth })
  
  doc.fontSize(10).fillColor(COLORS.lightGray)
  doc.text('Islamic Learning & Management', 50, 75)

  // Title
  doc.fontSize(16).fillColor(COLORS.secondary)
  doc.text(title, 50, 50, { align: 'right', width: pageWidth })

  // Divider line
  doc.moveTo(50, 100)
    .lineTo(doc.page.width - 50, 100)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke()

  doc.y = 110
}

function drawGradesTable(doc, grades) {
  const tableTop = doc.y
  const col1 = 50
  const col2 = 250
  const col3 = 350
  const col4 = 420
  const col5 = 490
  const rowHeight = 25

  // Table header
  doc.fontSize(10).fillColor(COLORS.primary)
  doc.text('Course/Program', col1, tableTop)
  doc.text('Type', col2, tableTop)
  doc.text('Grade', col3, tableTop)
  doc.text('Points', col4, tableTop)
  doc.text('Status', col5, tableTop)

  // Header line
  doc.moveTo(col1, tableTop + 15)
    .lineTo(doc.page.width - 50, tableTop + 15)
    .strokeColor(COLORS.border)
    .stroke()

  // Table rows
  let y = tableTop + rowHeight
  doc.fontSize(10).fillColor(COLORS.text)

  grades.forEach((grade, index) => {
    // Alternate row background
    if (index % 2 === 0) {
      doc.rect(col1 - 5, y - 5, doc.page.width - 90, rowHeight)
        .fillColor('#f9f9f9')
        .fill()
    }

    doc.fillColor(COLORS.text)
    doc.text(truncateText(grade.courseName || grade.programName || 'N/A', 30), col1, y)
    doc.text(grade.type || 'Course', col2, y)
    doc.text(grade.grade || '-', col3, y)
    doc.text(grade.gradePoints?.toFixed(2) || '-', col4, y)
    
    // Status with color
    const status = grade.status || 'Completed'
    doc.fillColor(status === 'Completed' ? '#22c55e' : COLORS.lightGray)
    doc.text(status, col5, y)

    y += rowHeight
  })

  doc.y = y + 10
}

function drawFooter(doc) {
  const pageHeight = doc.page.height
  
  doc.fontSize(8).fillColor(COLORS.lightGray)
  doc.text(
    'This is an official document generated by ILM Learning Center. For verification, please contact admin@ilm.edu.ph',
    50,
    pageHeight - 50,
    { align: 'center', width: doc.page.width - 100 }
  )
}

function truncateText(text, maxLength) {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text
}
