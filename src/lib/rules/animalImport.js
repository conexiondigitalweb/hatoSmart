import { format } from 'date-fns'
import { suggestCategory } from './categories'

export const SEX_OPTIONS = [
  { value: 'female', label: 'Hembra' },
  { value: 'male', label: 'Macho' },
]
export const CATEGORY_OPTIONS = [
  { value: 'calf', label: 'Ternero/a' },
  { value: 'heifer', label: 'Novilla' },
  { value: 'cow', label: 'Vaca' },
  { value: 'young_bull', label: 'Torete' },
  { value: 'bull', label: 'Toro' },
  { value: 'steer', label: 'Novillo' },
]
export const ORIGIN_OPTIONS = [
  { value: 'born', label: 'Nacido en finca' },
  { value: 'purchased', label: 'Comprado' },
  { value: 'transferred', label: 'Trasladado' },
]

// Column definitions for the template, the mapping step and the grid.
// `required: true` fields are the only ones that can block a row from importing.
export const SYSTEM_FIELDS = [
  {
    key: 'tag_number', label: 'Arete', required: true, example: '0145',
    aliases: ['arete', 'numeroarete', 'numerodearete', 'id', 'identificador', 'caravana', 'tag', 'numero', 'no', 'nro', 'codigoarete'],
  },
  {
    key: 'sex', label: 'Sexo', required: true, example: 'Hembra', options: SEX_OPTIONS,
    aliases: ['sexo', 'genero', 'sex'],
  },
  {
    key: 'name', label: 'Nombre', required: false, example: 'Margarita',
    aliases: ['nombre', 'name'],
  },
  {
    key: 'internal_code', label: 'Código interno', required: false, example: 'A-023',
    aliases: ['codigointerno', 'codigo', 'internalcode', 'cod'],
  },
  {
    key: 'breed', label: 'Raza', required: false, example: 'Holstein',
    aliases: ['raza', 'breed'],
  },
  {
    key: 'birth_date', label: 'Fecha de nacimiento', required: false, example: '15/03/2023',
    aliases: ['fechanacimiento', 'fechadenacimiento', 'nacimiento', 'fechanac', 'birthdate', 'fecha'],
  },
  {
    key: 'category', label: 'Categoría', required: false, example: 'Vaca', options: CATEGORY_OPTIONS,
    aliases: ['categoria', 'category', 'clase'],
  },
  {
    key: 'origin', label: 'Origen', required: false, example: 'Nacido en finca', options: ORIGIN_OPTIONS,
    aliases: ['origen', 'origin', 'procedencia'],
  },
  {
    key: 'mother_tag', label: 'Madre (arete)', required: false, example: '0099',
    aliases: ['madre', 'aretemadre', 'madrearete', 'mother', 'mama'],
  },
  {
    key: 'external_father', label: 'Padre / Pajilla', required: false, example: 'Toro 22',
    aliases: ['padre', 'pajilla', 'padreopajilla', 'father', 'toro'],
  },
  {
    key: 'lot', label: 'Lote', required: false, example: 'Lote A',
    aliases: ['lote', 'lot', 'grupo'],
  },
  {
    key: 'registry_number', label: 'N° Registro', required: false, example: '',
    aliases: ['nregistro', 'numeroregistro', 'registro', 'registrynumber'],
  },
  {
    key: 'registry_association', label: 'Asociación', required: false, example: '',
    aliases: ['asociacion', 'asociacionregistro', 'registryassociation'],
  },
  {
    key: 'notes', label: 'Observaciones', required: false, example: '',
    aliases: ['observaciones', 'notas', 'notes', 'comentarios'],
  },
]

export function normalizeHeader(str) {
  return String(str ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// Best-effort column -> system field mapping by name similarity.
// Returns one entry per header: { index, header, field, confidence }.
// confidence: 1 = exact alias match, 0.7 = partial/substring match, 0 = no match.
export function autoMapColumns(headers) {
  const guesses = headers.map((header, index) => {
    const norm = normalizeHeader(header)
    let best = { field: null, score: 0 }
    if (norm) {
      for (const field of SYSTEM_FIELDS) {
        for (const alias of field.aliases) {
          if (norm === alias && best.score < 1) best = { field: field.key, score: 1 }
          else if (norm.includes(alias) && best.score < 0.7) best = { field: field.key, score: 0.7 }
        }
      }
    }
    return { index, header, field: best.field, confidence: best.score }
  })

  // If two headers guessed the same field, keep only the highest-confidence one
  // (first on tie) and let the user resolve the rest manually in the mapping step.
  const claimed = new Map()
  for (const g of guesses) {
    if (!g.field) continue
    const current = claimed.get(g.field)
    if (!current || g.confidence > current.confidence) claimed.set(g.field, g)
  }
  for (const g of guesses) {
    if (g.field && claimed.get(g.field) !== g) g.field = null
  }

  return guesses
}

const SEX_MAP = { hembra: 'female', h: 'female', f: 'female', female: 'female', macho: 'male', m: 'male', male: 'male' }
export function parseSexValue(raw) {
  return SEX_MAP[normalizeHeader(raw)] ?? null
}

const CATEGORY_MAP = {
  ternero: 'calf', ternera: 'calf', terneroa: 'calf', calf: 'calf',
  novilla: 'heifer', heifer: 'heifer',
  vaca: 'cow', cow: 'cow',
  torete: 'young_bull', youngbull: 'young_bull',
  toro: 'bull', bull: 'bull',
  novillo: 'steer', steer: 'steer',
}
export function parseCategoryValue(raw) {
  return CATEGORY_MAP[normalizeHeader(raw)] ?? null
}

const ORIGIN_MAP = {
  nacidoenfinca: 'born', nacido: 'born', born: 'born',
  comprado: 'purchased', compra: 'purchased', purchased: 'purchased',
  trasladado: 'transferred', transferido: 'transferred', transferred: 'transferred',
}
export function parseOriginValue(raw) {
  return ORIGIN_MAP[normalizeHeader(raw)] ?? null
}

// Excel/CSV dates can arrive as JS Date objects (xlsx with cellDates:true) or
// as free-typed strings in whatever format the farmer's original file used.
export function parseDateValue(raw) {
  if (!raw) return null
  if (raw instanceof Date && !isNaN(raw)) return format(raw, 'yyyy-MM-dd')
  const str = String(raw).trim()
  if (!str) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) {
    const [, d, mo, y] = m
    const dt = new Date(Number(y), Number(mo) - 1, Number(d))
    if (!isNaN(dt)) return format(dt, 'yyyy-MM-dd')
  }
  return null
}

// Parses one mapped row (raw cell values keyed by system field) into typed
// values, plus blocking errors (only for tag_number/sex) and non-blocking
// warnings for anything else that looked malformed or was left empty.
export function parseAndValidateRow(raw) {
  const errors = {}
  const warnings = {}
  const values = {}

  const tag = String(raw.tag_number ?? '').trim()
  values.tag_number = tag
  if (!tag) errors.tag_number = 'El arete es obligatorio'

  const rawSex = raw.sex != null ? String(raw.sex).trim() : ''
  const sex = parseSexValue(raw.sex)
  values.sex = sex
  if (!rawSex) errors.sex = 'El sexo es obligatorio'
  else if (!sex) errors.sex = `Valor no reconocido: "${raw.sex}" (usa Hembra/Macho)`

  values.name = String(raw.name ?? '').trim() || null
  values.internal_code = String(raw.internal_code ?? '').trim() || null
  values.breed = String(raw.breed ?? '').trim() || null

  if (raw.birth_date) {
    const parsed = parseDateValue(raw.birth_date)
    values.birth_date = parsed
    if (!parsed) warnings.birth_date = `Fecha no reconocida: "${raw.birth_date}"`
  } else {
    values.birth_date = null
  }

  if (raw.category) {
    const parsed = parseCategoryValue(raw.category)
    values.category = parsed
    if (!parsed) warnings.category = `Categoría no reconocida: "${raw.category}"`
  } else {
    values.category = null
  }
  if (!values.category && values.sex && values.birth_date) {
    values.category = suggestCategory({ sex: values.sex, birth_date: values.birth_date })
  }

  if (raw.origin) {
    const parsed = parseOriginValue(raw.origin)
    values.origin = parsed ?? 'born'
    if (!parsed) warnings.origin = `Origen no reconocido: "${raw.origin}" — se usará "Nacido en finca"`
  } else {
    values.origin = 'born'
  }

  values.mother_tag = String(raw.mother_tag ?? '').trim() || null
  values.external_father = String(raw.external_father ?? '').trim() || null
  values.lot = String(raw.lot ?? '').trim() || null
  values.registry_number = String(raw.registry_number ?? '').trim() || null
  values.registry_association = String(raw.registry_association ?? '').trim() || null
  values.notes = String(raw.notes ?? '').trim() || null

  return { values, errors, warnings }
}
