import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useFarmStore } from '../../stores/farmStore'
import { supabase } from '../../lib/supabase'
import db from '../../lib/db'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/utils'

// Paleta cerrada (no color picker libre) — más simple para el usuario
// objetivo que elegir un hex a mano. #16a34a es el verde de marca actual,
// se mantiene como primera opción/default.
const ACCENT_COLORS = [
  '#16a34a', '#d97706', '#2563eb', '#dc2626',
  '#7c3aed', '#0d9488', '#db2777', '#475569',
]

const inputCls = 'w-full h-12 px-4 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

export default function FarmSettingsPage() {
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const farms = useFarmStore((s) => s.farms)
  const setFarms = useFarmStore((s) => s.setFarms)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)

  const [commercialName, setCommercialName] = useState(activeFarm?.commercial_name ?? '')
  const [accentColor, setAccentColor] = useState(activeFarm?.accent_color ?? '#16a34a')
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(activeFarm?.logo_url ?? null)
  const [saving, setSaving] = useState(false)

  if (!activeFarm) return null

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        commercial_name: commercialName.trim() || null,
        accent_color: accentColor,
      }

      if (logoFile) {
        const ext = logoFile.name.split('.').pop() || 'jpg'
        const path = `${activeFarm.id}/logo.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('farm-logos')
          .upload(path, logoFile, { upsert: true })
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage.from('farm-logos').getPublicUrl(path)
        // Cache-bust so the header/preview pick up the new file immediately
        payload.logo_url = `${publicUrl}?t=${Date.now()}`
      }

      const { data, error } = await supabase
        .from('farms')
        .update(payload)
        .eq('id', activeFarm.id)
        .select()
        .single()
      if (error) throw error

      const updatedFarm = { ...data, role: activeFarm.role }
      setActiveFarm(updatedFarm)
      setFarms(farms.map((f) => (f.id === updatedFarm.id ? updatedFarm : f)))
      await db.farms.put({ ...data, sync_status: 'synced' })

      toast.success('Finca actualizada ✓')
      navigate('/mas')
    } catch (err) {
      toast.error(err.message ?? 'No se pudo guardar la configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col pb-28">
      <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Configuración de la finca</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Nombre de la finca</label>
          <input value={activeFarm.name} disabled className={cn(inputCls, 'opacity-60 cursor-not-allowed')} />
          <span className="text-xs text-muted-foreground">El nombre legal no se edita aquí.</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Nombre comercial</label>
          <input
            value={commercialName}
            onChange={(e) => setCommercialName(e.target.value)}
            placeholder="Ej. Hato La Esperanza"
            className={inputCls}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo de la finca" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🏡</span>
              )}
            </div>
            <label className="h-10 px-4 rounded-xl border border-border bg-card text-sm font-semibold text-foreground flex items-center justify-center cursor-pointer">
              Cambiar logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Color de acento</label>
          <p className="text-xs text-muted-foreground -mt-1">
            Se muestra en el encabezado de la app — útil para distinguir de un vistazo en qué finca estás si trabajas en varias.
          </p>
          <div className="flex flex-wrap gap-3 mt-1">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setAccentColor(color)}
                aria-label={color}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
                style={{ backgroundColor: color }}
              >
                {accentColor === color && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={saving} className="w-full mt-2">
          Guardar cambios
        </Button>
      </form>
    </div>
  )
}
