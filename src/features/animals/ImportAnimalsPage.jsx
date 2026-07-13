import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Upload, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useFarmStore } from '../../stores/farmStore'
import { enqueue } from '../../lib/sync/queue'
import { runSync } from '../../lib/sync/engine'
import { downloadAnimalTemplate, parseAnimalFile } from '../../lib/animalImportFile'
import { SYSTEM_FIELDS, autoMapColumns, parseAndValidateRow } from '../../lib/rules/animalImport'
import db from '../../lib/db'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { cn } from '../../lib/utils'

function buildGridRows(rawRows, mapping) {
  return rawRows.map((rowArray) => {
    const raw = {}
    for (const m of mapping) {
      if (m.field) raw[m.field] = rowArray[m.index]
    }
    const { values, errors, warnings } = parseAndValidateRow(raw)
    return { _id: crypto.randomUUID(), raw, values, errors, warnings }
  })
}

function normalizeTagKey(tag) {
  return String(tag ?? '').trim().toLowerCase()
}

function Header({ title, onBack }) {
  return (
    <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
      <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
      <h1 className="text-lg font-bold text-foreground flex-1">{title}</h1>
    </div>
  )
}

export default function ImportAnimalsPage() {
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)

  const [step, setStep] = useState('upload') // upload | mapping | grid | result
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [headers, setHeaders] = useState([])
  const [rawRows, setRawRows] = useState([])
  const [mapping, setMapping] = useState([])
  const [gridRows, setGridRows] = useState([])
  const [importResult, setImportResult] = useState(null)

  const handleBack = () => {
    if (step === 'upload') navigate(-1)
    else if (step === 'mapping') setStep('upload')
    else if (step === 'grid') setStep('mapping')
    else navigate('/animales')
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return
    setLoading(true)
    try {
      const { headers: h, rows } = await parseAnimalFile(file)
      if (!h.length || !rows.length) {
        toast.error('El archivo no tiene datos para importar.')
        return
      }
      setHeaders(h)
      setRawRows(rows)
      setMapping(autoMapColumns(h))
      setStep('mapping')
    } catch (err) {
      toast.error('No se pudo leer el archivo. Verifica que sea un Excel (.xlsx) o CSV válido.')
    } finally {
      setLoading(false)
    }
  }

  const handleMappingChange = (index, newField) => {
    setMapping((prev) => prev.map((m) => {
      if (m.index === index) return { ...m, field: newField || null }
      if (newField && m.field === newField) return { ...m, field: null }
      return m
    }))
  }

  const handleConfirmMapping = () => {
    if (!mapping.some((m) => m.field === 'tag_number') || !mapping.some((m) => m.field === 'sex')) {
      toast.error('Asigna al menos las columnas de Arete y Sexo antes de continuar.')
      return
    }
    setGridRows(buildGridRows(rawRows, mapping))
    setStep('grid')
  }

  const updateCell = (rowId, field, newRawValue) => {
    setGridRows((prev) => prev.map((r) => {
      if (r._id !== rowId) return r
      const newRaw = { ...r.raw, [field]: newRawValue }
      const { values, errors, warnings } = parseAndValidateRow(newRaw)
      return { ...r, raw: newRaw, values, errors, warnings }
    }))
  }

  const deleteRow = (rowId) => setGridRows((prev) => prev.filter((r) => r._id !== rowId))

  const readyCount = gridRows.filter((r) => Object.keys(r.errors).length === 0).length
  const errorCount = gridRows.length - readyCount

  const handleImport = async () => {
    setImporting(true)
    try {
      const readyRows = gridRows.filter((r) => Object.keys(r.errors).length === 0)
      const blockedRows = gridRows.filter((r) => Object.keys(r.errors).length > 0)

      const idByRow = new Map(readyRows.map((r) => [r._id, crypto.randomUUID()]))

      const existingAnimals = await db.animals.where('farm_id').equals(activeFarm.id)
        .filter((a) => !a.deleted_at).toArray()
      const tagToId = new Map()
      for (const a of existingAnimals) if (a.tag_number) tagToId.set(normalizeTagKey(a.tag_number), a.id)
      for (const r of readyRows) if (r.values.tag_number) tagToId.set(normalizeTagKey(r.values.tag_number), idByRow.get(r._id))

      const succeeded = []
      const failed = blockedRows.map((r) => ({ row: r, reason: Object.values(r.errors).join('; ') }))

      for (const r of readyRows) {
        const id = idByRow.get(r._id)
        try {
          const motherId = r.values.mother_tag ? (tagToId.get(normalizeTagKey(r.values.mother_tag)) ?? null) : null
          const record = {
            id,
            account_id: activeFarm.account_id,
            farm_id: activeFarm.id,
            tag_number: r.values.tag_number,
            sex: r.values.sex,
            name: r.values.name,
            internal_code: r.values.internal_code,
            breed: r.values.breed,
            birth_date: r.values.birth_date,
            category: r.values.category,
            origin: r.values.origin,
            mother_id: motherId,
            external_father: r.values.external_father,
            lot: r.values.lot,
            registry_number: r.values.registry_number,
            registry_association: r.values.registry_association,
            notes: r.values.notes,
            status: 'active',
            sync_status: 'pending',
          }
          await db.animals.put(record)
          await enqueue('animals', id, 'upsert', record)
          succeeded.push(r)
        } catch (err) {
          failed.push({ row: r, reason: err?.message ?? 'Error al guardar en el dispositivo' })
        }
      }

      console.log(`[Import] Pushing ${succeeded.length} animals to Supabase…`)
      runSync().catch(() => {})

      setGridRows(failed.map((f) => f.row))
      setImportResult({ succeededCount: succeeded.length, failed })
      setStep('result')
    } finally {
      setImporting(false)
    }
  }

  // ── UPLOAD ──────────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="flex flex-col pb-28">
        <Header title="Importar animales" onBack={handleBack} />
        <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-4">
          <Card className="p-5 flex flex-col gap-3">
            <p className="text-sm text-foreground font-semibold">1. Descarga la plantilla (opcional)</p>
            <p className="text-xs text-muted-foreground">
              Tiene las columnas que el sistema reconoce, con un ejemplo. Solo <strong>Arete</strong> y <strong>Sexo</strong> son
              obligatorios — todo lo demás lo puedes completar después desde la ficha del animal.
            </p>
            <Button variant="outline" onClick={downloadAnimalTemplate} className="gap-2">
              <Download className="w-4 h-4" /> Descargar plantilla Excel
            </Button>
          </Card>

          <Card className="p-5 flex flex-col gap-3">
            <p className="text-sm text-foreground font-semibold">2. Sube tu archivo</p>
            <p className="text-xs text-muted-foreground">
              Puede ser la plantilla o cualquier Excel/CSV que ya tengas — no importa el orden ni los nombres exactos de las
              columnas, en el siguiente paso los emparejamos.
            </p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-8 cursor-pointer hover:border-brand-green/50 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{loading ? 'Leyendo archivo…' : 'Elegir archivo .xlsx o .csv'}</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} disabled={loading} />
            </label>
          </Card>
        </div>
      </div>
    )
  }

  // ── MAPPING ─────────────────────────────────────────────────────────────
  if (step === 'mapping') {
    return (
      <div className="flex flex-col pb-28">
        <Header title="Emparejar columnas" onBack={handleBack} />
        <div className="max-w-3xl mx-auto w-full p-4 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Revisa que cada columna de tu archivo esté asignada al campo correcto. Las que no apliquen puedes dejarlas en
            "No importar".
          </p>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Columna en tu archivo</th>
                  <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Ejemplo</th>
                  <th className="p-3 font-semibold text-muted-foreground text-xs uppercase">Se importa como</th>
                </tr>
              </thead>
              <tbody>
                {mapping.map((m) => (
                  <tr key={m.index} className="border-b border-border last:border-0">
                    <td className="p-3 font-medium text-foreground">{m.header || `Columna ${m.index + 1}`}</td>
                    <td className="p-3 text-muted-foreground text-xs truncate max-w-[160px]">
                      {String(rawRows[0]?.[m.index] ?? '')}
                    </td>
                    <td className="p-3">
                      <select
                        value={m.field ?? ''}
                        onChange={(e) => handleMappingChange(m.index, e.target.value)}
                        className="h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm min-w-[180px]"
                      >
                        <option value="">No importar</option>
                        {SYSTEM_FIELDS.map((f) => (
                          <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Button onClick={handleConfirmMapping} className="w-full" size="lg">
            Continuar ({rawRows.length} filas detectadas)
          </Button>
        </div>
      </div>
    )
  }

  // ── GRID ────────────────────────────────────────────────────────────────
  if (step === 'grid') {
    return (
      <div className="flex flex-col pb-28">
        <Header title="Revisar animales" onBack={handleBack} />
        <div className="max-w-6xl mx-auto w-full p-4 flex flex-col gap-4">
          <Card className="p-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-brand-green">{readyCount} listos para importar</span>
            {errorCount > 0 && (
              <span className="text-sm font-semibold text-destructive">{errorCount} con errores bloqueantes (no se importarán)</span>
            )}
          </Card>

          <Card className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-left bg-muted/40">
                  {SYSTEM_FIELDS.map((f) => (
                    <th key={f.key} className="p-2 font-semibold text-muted-foreground uppercase whitespace-nowrap">
                      {f.label}{f.required ? ' *' : ''}
                    </th>
                  ))}
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {gridRows.map((r) => {
                  const hasError = Object.keys(r.errors).length > 0
                  return (
                    <tr key={r._id} className={cn('border-b border-border last:border-0', hasError && 'bg-red-50/50')}>
                      {SYSTEM_FIELDS.map((f) => {
                        const error = r.errors[f.key]
                        const warning = r.warnings[f.key]
                        const cellCls = cn(
                          'w-full h-9 px-2 rounded-lg border bg-card text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring min-w-[110px]',
                          error ? 'border-destructive bg-red-50' : warning ? 'border-amber-400 bg-amber-50' : 'border-border'
                        )
                        const value = r.values[f.key] ?? ''
                        return (
                          <td key={f.key} className="p-1.5 align-top">
                            {f.options ? (
                              <select className={cellCls} value={value} onChange={(e) => updateCell(r._id, f.key, e.target.value)}>
                                <option value="">—</option>
                                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            ) : f.key === 'birth_date' ? (
                              <input type="date" className={cellCls} value={value} onChange={(e) => updateCell(r._id, f.key, e.target.value)} />
                            ) : (
                              <input type="text" className={cellCls} value={value} onChange={(e) => updateCell(r._id, f.key, e.target.value)} />
                            )}
                            {(error || warning) && (
                              <p className={cn('text-[10px] mt-0.5', error ? 'text-destructive' : 'text-amber-600')}>
                                {error || warning}
                              </p>
                            )}
                          </td>
                        )
                      })}
                      <td className="p-1.5 align-top">
                        <button onClick={() => deleteRow(r._id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          <Button onClick={handleImport} loading={importing} disabled={readyCount === 0} className="w-full" size="lg">
            Importar {readyCount > 0 ? `(${readyCount})` : ''}
          </Button>
        </div>
      </div>
    )
  }

  // ── RESULT ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col pb-28">
      <Header title="Resultado" onBack={() => navigate('/animales')} />
      <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-4">
        <Card className="p-6 flex flex-col items-center gap-2 text-center">
          <span className="text-4xl">{importResult.failed.length === 0 ? '🎉' : '✅'}</span>
          <p className="text-lg font-bold text-foreground">{importResult.succeededCount} animales importados</p>
          {importResult.failed.length > 0 && (
            <p className="text-sm text-muted-foreground">{importResult.failed.length} quedaron pendientes</p>
          )}
        </Card>

        {importResult.failed.length > 0 && (
          <Card className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pendientes</p>
            {importResult.failed.map((f) => (
              <div key={f.row._id} className="py-2 border-b border-border last:border-0">
                <p className="text-sm font-medium text-foreground">{f.row.values.tag_number || '(sin arete)'}</p>
                <p className="text-xs text-destructive">{f.reason}</p>
              </div>
            ))}
            <Button onClick={() => setStep('grid')} variant="outline" className="w-full mt-3">
              Corregir y reintentar
            </Button>
          </Card>
        )}

        <Button onClick={() => navigate('/animales')} className="w-full">
          Ir a Animales
        </Button>
      </div>
    </div>
  )
}
