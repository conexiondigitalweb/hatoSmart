import { useFarmStore } from '../../stores/farmStore'
import { hasMinRole } from '../../lib/rules/roles'

const ROLE_LABEL = { admin: 'administrador', owner: 'dueño' }

// Route-level gate. Hiding a button in the UI isn't enough on its own —
// this stops a worker who types the URL directly from reaching a form
// whose writes would just fail silently against RLS later (Dexie has no
// concept of roles, so the local write would "succeed" and never sync).
export default function RequireRole({ role, children }) {
  const activeFarm = useFarmStore((s) => s.activeFarm)

  if (!hasMinRole(activeFarm?.role, role)) {
    return (
      <div className="p-8 flex flex-col items-center gap-3 text-center mt-8">
        <p className="text-4xl">🔒</p>
        <p className="text-sm font-semibold text-foreground">No tienes permiso para ver esta página</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Esta sección requiere un rol de {ROLE_LABEL[role] ?? role} en esta finca.
        </p>
      </div>
    )
  }

  return children
}
