import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addHours, format } from 'date-fns'
import { ArrowLeft, Copy, MessageCircle, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useFarmStore } from '../../stores/farmStore'
import { useSessionStore } from '../../stores/sessionStore'
import { supabase } from '../../lib/supabase'
import { ROLE_LABELS } from '../../lib/rules/roles'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/Dialog'
import { cn } from '../../lib/utils'

const INVITABLE_ROLES = [
  { value: 'admin', label: 'Administrador', desc: 'Acceso total excepto invitar/quitar usuarios y eliminar la finca' },
  { value: 'worker', label: 'Operador', desc: 'Solo puede crear registros diarios (ordeño, pesajes, sanidad, reproducción) y ver todo' },
]

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // sin 0/O/1/I/L, evita confusiones al leerlo en voz alta
function generateCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('')
}

export default function ManageUsersPage() {
  const navigate = useNavigate()
  const activeFarm = useFarmStore((s) => s.activeFarm)
  const user = useSessionStore((s) => s.user)

  const [members, setMembers] = useState(null)
  const [invitations, setInvitations] = useState(null)
  const [inviteRole, setInviteRole] = useState(null) // null = dialog closed
  const [generatedCode, setGeneratedCode] = useState(null)
  const [generating, setGenerating] = useState(false)

  const loadData = async () => {
    const [{ data: memberData, error: memberErr }, { data: inviteData, error: inviteErr }] = await Promise.all([
      supabase.rpc('get_farm_members', { p_farm_id: activeFarm.id }),
      supabase.from('farm_invitations')
        .select('*')
        .eq('farm_id', activeFarm.id)
        .is('deleted_at', null)
        .is('used_at', null)
        .order('created_at', { ascending: false }),
    ])
    if (memberErr) toast.error('No se pudo cargar la lista de usuarios')
    else setMembers(memberData ?? [])
    if (inviteErr) toast.error('No se pudieron cargar los códigos de invitación')
    else setInvitations(inviteData ?? [])
  }

  useEffect(() => {
    if (activeFarm?.id) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFarm?.id])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      let code = generateCode()
      let attempt = 0
      // El código debe ser único mientras esté activo; reintenta una vez
      // en el caso (muy raro) de colisión.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { error } = await supabase.from('farm_invitations').insert({
          id: crypto.randomUUID(),
          account_id: activeFarm.account_id,
          farm_id: activeFarm.id,
          code,
          role: inviteRole,
          created_by: user.id,
          expires_at: addHours(new Date(), 48).toISOString(),
        })
        if (!error) break
        if (error.code === '23505' && attempt < 3) {
          code = generateCode()
          attempt++
          continue
        }
        throw error
      }
      setGeneratedCode(code)
      loadData()
    } catch (err) {
      toast.error(err.message ?? 'No se pudo generar el código')
      setInviteRole(null)
    } finally {
      setGenerating(false)
    }
  }

  const handleInvalidate = async (invitationId) => {
    const { error } = await supabase.from('farm_invitations')
      .update({ expires_at: new Date().toISOString() })
      .eq('id', invitationId)
    if (error) toast.error('No se pudo invalidar el código')
    else {
      toast.success('Código invalidado')
      loadData()
    }
  }

  const handleRemoveMember = async (membershipId) => {
    const { error } = await supabase.from('memberships').delete().eq('id', membershipId)
    if (error) toast.error('No se pudo quitar al usuario')
    else {
      toast.success('Usuario removido de la finca')
      loadData()
    }
  }

  const handleRoleChange = async (membershipId, role) => {
    const { error } = await supabase.from('memberships').update({ role }).eq('id', membershipId)
    if (error) toast.error('No se pudo cambiar el rol')
    else {
      toast.success('Rol actualizado')
      loadData()
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success('Código copiado ✓')
  }

  const whatsappLink = (code) => {
    const roleLabel = ROLE_LABELS[invitations?.find((i) => i.code === code)?.role] ?? ''
    const text = `Te invito a unirte a ${activeFarm?.name} en HatoSmart. Tu código de invitación (${roleLabel}) es: ${code}\n\nÚsalo en la app en "Unirme a otra finca". Válido por 48 horas.`
    return `https://wa.me/?text=${encodeURIComponent(text)}`
  }

  return (
    <>
      {/* Dialog: elegir rol → generar código */}
      <Dialog open={!!inviteRole || generating} onOpenChange={(open) => { if (!open && !generatedCode) setInviteRole(null) }}>
        <DialogContent>
          {!generatedCode ? (
            <>
              <DialogTitle>Invitar usuario</DialogTitle>
              <p className="text-sm text-muted-foreground mb-3">Elige el rol que tendrá quien use este código.</p>
              <div className="flex flex-col gap-2">
                {INVITABLE_ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setInviteRole(r.value)}
                    className={cn(
                      'text-left p-3 rounded-xl border-2 transition-all',
                      inviteRole === r.value ? 'border-brand-green bg-green-50' : 'border-border'
                    )}
                  >
                    <p className="font-semibold text-sm text-foreground">{r.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setInviteRole(null)} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-foreground">
                  Cancelar
                </button>
                <Button onClick={handleGenerate} loading={generating} disabled={!inviteRole} className="flex-1">
                  Generar código
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogTitle>Código generado</DialogTitle>
              <p className="text-sm text-muted-foreground mb-3">
                Compártelo con la persona que quieres invitar como <strong>{ROLE_LABELS[inviteRole]}</strong>. Vence en 48 horas.
              </p>
              <div className="bg-muted rounded-2xl py-6 flex items-center justify-center">
                <span className="text-4xl font-bold tracking-[0.3em] text-foreground">{generatedCode}</span>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => copyCode(generatedCode)} className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold text-foreground flex items-center justify-center gap-2">
                  <Copy className="w-4 h-4" /> Copiar
                </button>
                <a href={whatsappLink(generatedCode)} target="_blank" rel="noreferrer"
                  className="flex-1 h-11 rounded-xl bg-brand-green text-white text-sm font-semibold flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
              <button
                onClick={() => { setGeneratedCode(null); setInviteRole(null) }}
                className="w-full h-10 mt-3 text-sm font-medium text-muted-foreground"
              >
                Listo
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col pb-28">
        <div className="bg-card px-4 py-4 border-b border-border flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1">Gestión de usuarios</h1>
          <button
            onClick={() => setInviteRole('worker')}
            className="flex items-center gap-1 bg-brand-green text-white text-sm font-semibold h-9 px-3 rounded-xl active:scale-95 transition-transform"
          >
            <UserPlus className="w-4 h-4" /> Invitar
          </button>
        </div>

        <div className="p-4 flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Miembros ({members?.length ?? '—'})
            </p>
            <div className="flex flex-col gap-2">
              {members === null ? (
                <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
              ) : members.map((m) => {
                const isSelf = m.member_user_id === user?.id
                return (
                  <Card key={m.membership_id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {m.full_name || m.email || 'Usuario'}{isSelf && ' (tú)'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                    {m.role === 'owner' || isSelf ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-foreground">
                        {ROLE_LABELS[m.role]}
                      </span>
                    ) : (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.membership_id, e.target.value)}
                          className="h-9 px-2 rounded-lg border border-border bg-card text-foreground text-xs"
                        >
                          <option value="admin">Administrador</option>
                          <option value="worker">Operador</option>
                        </select>
                        <button onClick={() => handleRemoveMember(m.membership_id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </>
                    )}
                  </Card>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Códigos de invitación activos
            </p>
            {invitations === null ? (
              <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
            ) : invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin códigos activos.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {invitations.map((inv) => (
                  <Card key={inv.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold text-sm text-foreground tracking-widest">{inv.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[inv.role]} · vence {format(new Date(inv.expires_at), 'dd/MM HH:mm')}
                      </p>
                    </div>
                    <button onClick={() => copyCode(inv.code)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleInvalidate(inv.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
