import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../../lib/supabase'
import { useFarmStore } from '../../stores/farmStore'
import db from '../../lib/db'
import Button from '../../components/ui/Button'

export default function JoinFarmPage() {
  const navigate = useNavigate()
  const addFarm = useFarmStore((s) => s.addFarm)
  const setActiveFarm = useFarmStore((s) => s.setActiveFarm)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('redeem_farm_invitation', { p_code: code.trim() })
      if (rpcError) throw rpcError

      const { farm_id, account_id, role } = data

      const { data: farmRow, error: farmErr } = await supabase.from('farms').select('*').eq('id', farm_id).single()
      if (farmErr) throw farmErr

      const farm = { ...farmRow, role }
      await db.accounts.put({ id: account_id, sync_status: 'synced' })
      await db.farms.put({ ...farmRow, sync_status: 'synced' })

      addFarm(farm)
      setActiveFarm(farm)
      toast.success(`Te uniste a ${farm.name} ✓`)
      navigate('/')
    } catch (err) {
      setError(err.message ?? 'No se pudo canjear el código')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-5">
        <div className="text-center">
          <img src="/apple-touch-icon.png" alt="HatoSmart" className="w-14 h-14 mx-auto mb-3 rounded-2xl" />
          <h1 className="text-xl font-bold text-[#2b3240]">Unirme a una finca</h1>
          <p className="text-sm text-gray-500 mt-1">Ingresa el código de 6 caracteres que te compartieron.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            className="h-16 text-center text-3xl font-bold tracking-[0.3em] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3dbf5e]"
          />
          {error && (
            <p className="text-sm text-red-600 text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          <Button type="submit" loading={loading} disabled={code.trim().length < 6} className="w-full">
            Unirme
          </Button>
        </form>

        <button onClick={() => navigate(-1)} className="text-center text-sm text-gray-400">
          Cancelar
        </button>
      </div>
    </div>
  )
}
