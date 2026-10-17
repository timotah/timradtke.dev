// Writes a tiny placeholder public/resume.pdf so the navbar's Resume link works.
//
// It is a placeholder on purpose. Per Article X, the real resume is made by
// opening the site and printing it (Ctrl+P -> Save as PDF), which renders the
// full resume from content.json. Run this only if you need the placeholder back:
//   node scripts/make-resume-placeholder.mjs

import { writeFileSync } from 'node:fs'

const text = [
  'Tim Radtke - Senior Full-Stack Engineer',
  '',
  'This PDF is a placeholder.',
  'Open the site and print it (Ctrl+P) to make the real resume,',
  'which is generated from content.json.',
  '',
  'tim@example.com',
]

const lines = text
  .map((line, i) => {
    const safe = line.replace(/[()\\]/g, '')
    const y = 740 - i * 20
    return `BT /F1 12 Tf 72 ${y} Td (${safe}) Tj ET`
  })
  .join('\n')

const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
  `<< /Length ${lines.length} >>\nstream\n${lines}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
]

let pdf = '%PDF-1.4\n'
const offsets = []
objects.forEach((body, i) => {
  offsets.push(pdf.length)
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
})

const xrefStart = pdf.length
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

writeFileSync('public/resume.pdf', pdf)
console.log(`wrote public/resume.pdf (${pdf.length} bytes, placeholder)`)
