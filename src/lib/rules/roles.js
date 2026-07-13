export const ROLE_RANK = { worker: 1, admin: 2, owner: 3 }

export const ROLE_LABELS = { owner: 'Dueño', admin: 'Administrador', worker: 'Operador' }

// Mirrors has_farm_role() in Supabase — same hierarchy, same comparison.
// Used for UI gating only; RLS is the real enforcement boundary.
export function hasMinRole(role, minRole) {
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[minRole] ?? 0)
}
