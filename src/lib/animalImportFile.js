import * as XLSX from 'xlsx'
import { SYSTEM_FIELDS } from './rules/animalImport'

// Builds and downloads the fillable template: one sheet with headers (required
// columns marked with *) + one example row, plus an instructions sheet.
export function downloadAnimalTemplate() {
  const headers = SYSTEM_FIELDS.map((f) => f.label + (f.required ? ' *' : ''))
  const example = SYSTEM_FIELDS.map((f) => f.example)
  const sheet = XLSX.utils.aoa_to_sheet([headers, example])
  sheet['!cols'] = SYSTEM_FIELDS.map(() => ({ wch: 20 }))

  const instructions = [
    ['Columna', 'Obligatorio', 'Descripción / valores permitidos'],
    ...SYSTEM_FIELDS.map((f) => [
      f.label,
      f.required ? 'Sí' : 'No',
      f.options ? `Valores: ${f.options.map((o) => o.label).join(', ')}` : '',
    ]),
    [],
    ['* Solo Arete y Sexo son obligatorios. Todo lo demás puedes dejarlo vacío y completarlo después.'],
  ]
  const infoSheet = XLSX.utils.aoa_to_sheet(instructions)
  infoSheet['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 50 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, sheet, 'Animales')
  XLSX.utils.book_append_sheet(wb, infoSheet, 'Instrucciones')
  XLSX.writeFile(wb, 'hatosmart-plantilla-animales.xlsx')
}

// Reads an uploaded .xlsx/.csv file and returns { headers, rows } as plain
// arrays — no assumption about column order or exact naming, that's resolved
// later in the mapping step.
export async function parseAnimalFile(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: false })

  if (!aoa.length) return { headers: [], rows: [] }
  const [headerRow, ...dataRows] = aoa
  const headers = headerRow.map((h) => String(h ?? '').trim())
  const rows = dataRows.filter((r) => r.some((cell) => String(cell ?? '').trim() !== ''))
  return { headers, rows }
}
