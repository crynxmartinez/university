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
