import { supabase } from './supabase'

// Shared key for stashing a farm invitation code across the login/signup
// detour: an unauthenticated user who opens a /unirse?code=XXX link gets
// bounced to /registro first (see JoinFarmPageGuard in App.jsx), which would
// otherwise drop the code from the URL. LoginPage/SignupPage check this
// key after a successful auth to redeem the invitation inline — no separate
// confirmation step on /unirse.
export const PENDING_INVITE_CODE_KEY = 'hs_pending_invite_code'

// Validates a code against farm_invitations WITHOUT requiring a session
// (get_invitation_preview is granted to anon) so the invite context —
// farm name + role — can be shown before the user creates an account, and
// an invalid/expired code is caught before asking for any data at all.
// Throws with a user-facing message on invalid/expired/used codes.
export async function fetchInvitePreview(code) {
  const { data, error } = await supabase.rpc('get_invitation_preview', { p_code: code.trim() })
  if (error) throw new Error(error.message || 'Código inválido')
  return { farmName: data.farm_name, role: data.role }
}
