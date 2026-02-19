import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Generate unique certificate number
export function generateCertificateNumber() {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0')
  return `CERT-${year}-${random}`
}

// Generate certificate PDF
export async function generateCertificatePDF(certificateData) {
  const {
    certificateNumber,
    studentName,
    courseName,
    programName,
    completionDate,
    grade,
    gpa,
    issuedBy,
    verificationUrl
  } = certificateData

  return new Promise(async (resolve, reject) => {
    try {
      // Create certificates directory if it doesn't exist
      const certificatesDir = path.join(__dirname, '../../certificates')
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true })
      }

      const filename = `${certificateNumber}.pdf`
      const filepath = path.join(certificatesDir, filename)

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 72, right: 72 }
      })

      // Pipe to file
      const stream = fs.createWriteStream(filepath)
      doc.pipe(stream)

      // Certificate border
      doc.lineWidth(3)
      doc.strokeColor('#1e3a5f')
      doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke()

      doc.lineWidth(1)
      doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke()

      // Logo/Header
      doc.fontSize(28)
        .fillColor('#1e3a5f')
        .font('Helvetica-Bold')
        .text('ILM LEARNING CENTER', 0, 80, { align: 'center' })

      doc.fontSize(12)
        .fillColor('#666')
        .font('Helvetica')
        .text('Assalaam University', 0, 115, { align: 'center' })

      // Certificate title
      doc.fontSize(40)
        .fillColor('#f7941d')
        .font('Helvetica-Bold')
        .text('CERTIFICATE', 0, 160, { align: 'center' })

      doc.fontSize(16)
        .fillColor('#666')
        .font('Helvetica')
        .text('OF COMPLETION', 0, 210, { align: 'center' })

      // Decorative line
      doc.moveTo(250, 240)
        .lineTo(doc.page.width - 250, 240)
        .strokeColor('#f7941d')
        .lineWidth(2)
        .stroke()

      // Student name
      doc.fontSize(14)
        .fillColor('#333')
        .font('Helvetica')
        .text('This is to certify that', 0, 270, { align: 'center' })

      doc.fontSize(32)
        .fillColor('#1e3a5f')
        .font('Helvetica-Bold')
        .text(studentName, 0, 300, { align: 'center' })

      // Course/Program name
      doc.fontSize(14)
        .fillColor('#333')
        .font('Helvetica')
        .text('has successfully completed', 0, 350, { align: 'center' })

      const completedItem = courseName || programName
      doc.fontSize(20)
        .fillColor('#1e3a5f')
        .font('Helvetica-Bold')
        .text(completedItem, 0, 380, { align: 'center', width: doc.page.width })

      // Completion date and grade
      const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      doc.fontSize(14)
        .fillColor('#333')
        .font('Helvetica')
        .text(`Completion Date: ${formattedDate}`, 0, 430, { align: 'center' })

      if (grade && gpa) {
        doc.text(`Final Grade: ${grade} (GPA: ${gpa.toFixed(2)})`, 0, 455, { align: 'center' })
      } else if (grade) {
        doc.text(`Final Grade: ${grade}`, 0, 455, { align: 'center' })
      }

      // Certificate number
      doc.fontSize(10)
        .fillColor('#999')
        .font('Helvetica')
        .text(`Certificate No: ${certificateNumber}`, 0, doc.page.height - 100, { align: 'center' })

      // Signature line
      doc.moveTo(150, doc.page.height - 130)
        .lineTo(350, doc.page.height - 130)
        .strokeColor('#333')
        .lineWidth(1)
        .stroke()

      doc.fontSize(12)
        .fillColor('#333')
        .font('Helvetica-Bold')
        .text(issuedBy, 150, doc.page.height - 115, { width: 200, align: 'center' })

      doc.fontSize(10)
        .fillColor('#666')
        .font('Helvetica')
        .text('Authorized Signature', 150, doc.page.height - 100, { width: 200, align: 'center' })

      // QR Code for verification
      if (verificationUrl) {
        try {
          const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 100,
            margin: 1
          })
          
          // Convert data URL to buffer
          const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '')
          const qrBuffer = Buffer.from(base64Data, 'base64')
          
          doc.image(qrBuffer, doc.page.width - 180, doc.page.height - 150, {
            width: 80,
            height: 80
          })

          doc.fontSize(8)
            .fillColor('#999')
            .text('Scan to verify', doc.page.width - 180, doc.page.height - 60, {
              width: 80,
              align: 'center'
            })
        } catch (qrError) {
          console.error('QR code generation error:', qrError)
        }
      }

      // Finalize PDF
      doc.end()

      stream.on('finish', () => {
        resolve({
          filename,
          filepath,
          relativePath: `/certificates/${filename}`
        })
      })

      stream.on('error', (error) => {
        reject(error)
      })

    } catch (error) {
      reject(error)
    }
  })
}

// Delete certificate file
export function deleteCertificateFile(filename) {
  try {
    const filepath = path.join(__dirname, '../../certificates', filename)
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
      return true
    }
    return false
  } catch (error) {
    console.error('Error deleting certificate file:', error)
    return false
  }
}
