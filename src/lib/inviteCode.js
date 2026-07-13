// Shared key for stashing a farm invitation code across the login/signup
// detour: an unauthenticated user who opens a /unirse?code=XXX link gets
// bounced to /login first (see JoinFarmPageGuard in App.jsx), which would
// otherwise drop the code from the URL. LoginPage/SignupPage check this
// key after a successful auth and route back to /unirse instead of the
// normal onboarding/home flow.
export const PENDING_INVITE_CODE_KEY = 'hs_pending_invite_code'
