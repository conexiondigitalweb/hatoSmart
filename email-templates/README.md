# Email templates — HatoSmart

Plantillas HTML con marca de HatoSmart para los correos transaccionales de Supabase Auth. **No están conectadas a nada en el código** — se pegan a mano en el dashboard de Supabase. Pensadas para funcionar hoy con el proveedor de correo por defecto de Supabase, y sin cambios cuando se configure SMTP propio vía Resend.

HTML "a prueba de balas": layout con tablas (`<table>`), estilos inline, sin flexbox/grid ni hojas de estilo externas, fuente del sistema (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`) — la mayoría de clientes de correo no cargan fuentes externas. El logo se referencia con la URL absoluta `https://www.hatosmart.com/apple-touch-icon.png` (dominio oficial verificado); si el cliente de correo bloquea imágenes, el `alt="HatoSmart"` y el texto "HatoSmart" junto al logo siguen mostrando la marca.

## Dónde pegar cada archivo

En el dashboard de Supabase: **Authentication → Email Templates → [tipo]**. Cada plantilla tiene dos campos separados — el HTML va en **"Message body"** (o "Body" según la versión del dashboard); el asunto sugerido va en **"Subject heading"**, campo aparte, no incluido en el HTML.

| Archivo | Sección en Supabase | Asunto sugerido | Se dispara cuando... |
|---|---|---|---|
| `recovery.html` | **Reset Password** | Restablece tu contraseña en HatoSmart | El usuario pide "¿Olvidaste tu contraseña?" (`supabase.auth.resetPasswordForEmail`, ver `src/features/auth/ForgotPasswordPage.jsx`) |
| `confirmation.html` | **Confirm signup** | Confirma tu cuenta en HatoSmart | Alguien crea una cuenta nueva (`supabase.auth.signUp`, ver `src/features/auth/SignupPage.jsx`) — solo aplica si el proyecto tiene la confirmación de correo activada en Authentication → Settings |

Solo se armaron estos dos: son los únicos flujos de Auth que el código del proyecto dispara hoy. La invitación a una finca (`ManageUsersPage.jsx`) es un sistema propio de PIN + WhatsApp, no pasa por el correo de Auth de Supabase — no necesita plantilla aquí.

## Variable de cada plantilla

Ambas usan la misma: **`{{ .ConfirmationURL }}`** — el link firmado que Supabase genera (incluye el token y el `redirectTo`). Aparece dos veces en el HTML: como `href` del botón y repetido como texto plano por si el botón no renderiza en el cliente de correo del usuario.

No hace falta tocar nada más de la variable — Supabase ya arma `{{ .ConfirmationURL }}` apuntando a la URL que cada llamada del código le pasó en `redirectTo` (`ForgotPasswordPage.jsx` usa `${window.location.origin}/restablecer-contrasena`, sin dominio hardcodeado, igual que el link de invitación por WhatsApp).

## Antes de que el link de recovery funcione en producción

En **Authentication → URL Configuration → Redirect URLs** de Supabase, agregar `https://www.hatosmart.com/restablecer-contrasena` (y, si se prueba en Vercel preview o local, esas URLs también) a la lista de redirects permitidos — Supabase rechaza cualquier `redirectTo` que no esté en esa lista.

## Otras variables disponibles (por si se necesitan a futuro)

`{{ .SiteURL }}`, `{{ .Email }}`, `{{ .Token }}` (código de 6 dígitos), `{{ .TokenHash }}`, `{{ .RedirectTo }}` — documentadas en la guía de Supabase (Authentication → Email Templates). No se usaron aquí porque `{{ .ConfirmationURL }}` ya trae todo lo necesario para un link de un clic.
