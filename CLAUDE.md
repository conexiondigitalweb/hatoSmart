# HatoSmart — Contexto del proyecto

## Qué es
SaaS de gestión ganadera (leche, carne, doble propósito, genética).
Multi-tenant, multifinca, mobile-first, offline-first.
MVP regalable a ganaderos para validación en campo.
Piloto: finca lechera + genética de ~80 cabezas con ejemplares registrados.

## Stack
- React 18 + Vite + Tailwind CSS
- PWA con vite-plugin-pwa (instalable en celular, funciona offline)
- Supabase: PostgreSQL + RLS, Auth, Storage
- Dexie.js (IndexedDB) para offline + cola de sync propia
- Zustand para estado global
- React Router para navegación
- react-hook-form + zod para formularios y validación
- i18next + react-i18next para internacionalización
- Recharts para gráficas
- date-fns para manejo de fechas

## Repositorio y despliegue
- GitHub: https://github.com/conexiondigitalweb/hatoSmart
- Vercel: proyecto hato-smart (deploy automático desde main)
- Dominio oficial: https://www.hatosmart.com (verificado en Vercel). El dominio por defecto de Vercel, https://hato-smart.vercel.app, sigue funcionando pero no es el que se debe usar en links compartidos (invitaciones, etc.)
- Desarrollo local: carpeta C:\Users\USUARIO\hatosmart

## Reglas de arquitectura (NO romper nunca)
1. Toda tabla en Supabase lleva account_id y farm_id (donde aplica) con políticas RLS.
2. IDs siempre uuid generados en el cliente con crypto.randomUUID(). Nunca autoincrementales.
3. La UI lee y escribe SIEMPRE en Dexie (IndexedDB). El motor de sync habla con Supabase.
4. Lógica de negocio en src/lib/rules/ como funciones puras con tests en Vitest.
5. Soft delete siempre (campo deleted_at). Nunca DELETE físico en la base de datos.
6. Cero textos hardcodeados en la UI. Todo pasa por i18next (locales/es-CO/).
7. Mobile-first estricto: botones mínimo 48px de alto, formularios máximo 6 campos por pantalla.
8. La orientación de la finca solo cambia qué se MUESTRA, nunca el modelo de datos.
9. Commits en inglés, descriptivos: feat(animals): add category auto-suggestion.

## Reglas de negocio críticas
- FPP (Fecha Probable de Parto) = fecha de servicio + farm.gestation_days (default 283 días)
- Alerta de secado = FPP − farm.dry_off_days_before_calving (default 60 días)
- Posible celo (solo si no hay preñez confirmada ni está en secado): novilla sin servicio → fecha_nacimiento + farm.heifer_min_breeding_months (default 15 meses, estimado); parto sin servicio posterior → fecha_parto + farm.voluntary_waiting_days (default 50 días); servicio sin chequeo de preñez positivo posterior → fecha_servicio + 21 días, repitiendo cada 21 días. Siempre ajustable a mano por animal (ver `rules/reproduction.js` → `calcPossibleHeatDate`)
- GDP (Ganancia Diaria de Peso) = (peso actual − peso anterior) / días entre pesajes
- El registro de un parto crea automáticamente el animal cría (con madre, padre del servicio y trazabilidad)
- Categoría del animal se sugiere automáticamente por edad + sexo + eventos reproductivos (editable siempre)

## Estructura de carpetas
```
hatosmart/
├── CLAUDE.md
├── docs/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── functions/
├── public/
└── src/
    ├── lib/
    │   ├── supabase.js
    │   ├── db.js               (esquema Dexie)
    │   ├── sync/               (cola y motor de sincronización)
    │   └── rules/              (lógica de negocio pura con tests)
    │       ├── reproduction.js
    │       ├── categories.js
    │       └── weights.js
    ├── i18n/
    │   └── locales/es-CO/
    ├── stores/                 (Zustand)
    ├── hooks/
    ├── components/
    │   ├── ui/
    │   └── shared/
    └── features/
        ├── auth/
        ├── farms/
        ├── animals/
        ├── reproduction/
        ├── milk/
        ├── weights/
        ├── health/
        ├── dashboard/
        └── marketing/           (landing pública "/" + /terminos /privacidad)
```

## Colores de marca (design system actual)
- Verde marca: #16a34a  (brand-green en Tailwind)
- Verde oscuro: #14532d (brand-dark)
- Acento ámbar: #d97706 (brand-accent)
- Fondo: var(--background), tarjetas: var(--card), texto: var(--foreground)
- (Colores anteriores #3dbf5e / #2b3240 / #f5f5f5 reemplazados completamente en Sesión 5)

## Estado actual del proyecto
### Sesión 19 — Completada (13 jul 2026)

**Reemplazo de placeholders visuales de la landing por assets reales**

- **`public/images/landing/`**: 7 de los 9 placeholders de imagen de la Sesión 18 quedan resueltos — `hero-finca.webp` (foto real de la finca) y los 6 `modulo-*.webp` (ilustraciones estilo polaroid/scrapbook: foto real + cinta + clip + etiqueta con el nombre del módulo, ya integrados en el arte). Quedan pendientes solo `{{TESTIMONIO_1}}`/`{{TESTIMONIO_2}}` (`SocialProof.jsx`) y `{{OG_IMAGE}}` (`index.html`), sin cambios — no había assets nuevos para esos dos en esta sesión
- **Optimización**: los originales que subió el usuario (`hero-finca.jpg` 4160×3120/5.2MB, y 6 PNG de 1080×1350/~2MB cada uno) se procesaron con `sharp` (`scripts/optimize-landing-images.mjs`, instalado con `npm install --no-save sharp` — **no** quedó en `package.json`/`package-lock.json`, es una herramienta de una sola vez, no del pipeline de build) → WebP redimensionado al ancho real de despliegue (1400px hero, 800px módulos) con calidad 78-82. Resultado: ~18MB → ~730KB (94-97% menos) sin pérdida visible. Los originales sin optimizar **no se versionan** — se descartaron después de generar los `.webp` (seguían existiendo en `/mnt/user-data/uploads/` como respaldo del usuario en el momento de la sesión)
- **`Hero.jsx`**: la foto reemplaza el placeholder punteado directo, mismo `aspect-[4/3]` que el original (4160:3120 = 4:3 exacto, cero recorte), `object-cover` + `rounded-3xl` + un scrim sutil solo por cohesión de marca (no hay texto superpuesto a la foto en este layout de 2 columnas, así que no era estrictamente necesario para legibilidad). `fetchpriority="high"` (es el elemento above-the-fold / LCP candidato) — a propósito **sin** `loading="lazy"`, que habría sido contraproducente aquí
- **`SolutionSection.jsx`** rediseñada alrededor del arte real en vez de mantener el contenedor de tarjeta blanca genérica de antes: como los PNG ya traen el marco de polaroid + cinta + clip + etiqueta con transparencia (`hasAlpha: true`, confirmado antes de decidir el layout), envolverlos en otra tarjeta blanca se habría visto como doble marco — ahora la imagen flota directo sobre el fondo de la sección, con `drop-shadow-xl` para la profundidad. Grid `grid-cols-1 lg:grid-cols-3` (1 columna mobile, 3×2 desktop, tal como se pidió — se quitó el paso intermedio `sm:grid-cols-2` que tenía antes). Rotación alternada fija por índice (`-3deg, 2deg, -2deg, 3deg, -2deg, 2deg`, no aleatoria, para que no "tiemble" entre renders) + `hover:rotate-0 hover:scale-105` como el detalle opcional pedido. `loading="lazy"` en las 6 (estas sí están below-the-fold)
- **`ImagePlaceholder.jsx` eliminado** — quedó sin ningún uso después de resolver Hero y Solution (era el único lugar que lo importaba además de sí mismo); `SocialProof.jsx` nunca lo usó, construye sus tarjetas de placeholder aparte. Se prefirió borrarlo a dejarlo como código muerto
- **Comentario de mapa de placeholders en `LandingPage.jsx`** actualizado para reflejar solo lo pendiente (testimonios + OG_IMAGE), con nota apuntando a `scripts/optimize-landing-images.mjs` para regenerar los `.webp` si llegan reemplazos más adelante

**Verificado en navegador**: build limpio (0 errores). Confirmé con `read_network_requests` que las 6 imágenes de módulos **no** se piden en la carga inicial (solo `hero-finca.webp`) y sí aparecen (`complete: true`, `naturalWidth: 800`) después de hacer scroll hasta esa sección — lazy loading funcionando de verdad, no solo el atributo puesto. Capturas de pantalla en desktop (1280px) y mobile (375px): sin overflow horizontal en ningún ancho, sin distorsión de aspect ratio (hero exacto 4:3 sin recorte; módulos con su 4:5 nativo vía `object-contain` implícito del `<img>` sin forzar crop), rotación alternada visible y con look "pegado en la pared", nada se sale del viewport pese a la rotación

**Build**: ✅ 3644 módulos, 0 errores.

#### Pendiente para Sesión 20
- **`{{TESTIMONIO_1}}`/`{{TESTIMONIO_2}}`** (`SocialProof.jsx`) y **`{{OG_IMAGE}}`** (`index.html`) — únicos placeholders visuales que quedan
- **Contenido legal real** de `/terminos` y `/privacidad` (hoy son "Próximamente")
- **Definir precios finales de negocio**: los valores actuales ($39.900/$79.900 y los descuentos por período) siguen sin confirmar como definitivos
- **`hola@hatosmart.com`** en el footer sigue siendo placeholder de contacto sin confirmar
- **Redes sociales**: footer sigue sin Instagram/Facebook (sin cuentas reales confirmadas)
- **CRÍTICO — Ejecutar en Supabase, en orden**: `030_possible_heat.sql` (y `028`/`029` si aún no corrieron)
- **CRÍTICO — Probar el flujo completo de recuperación de contraseña con una cuenta real** (Sesión 16)
- **Pegar los templates de `email-templates/`** en Supabase (ver `email-templates/README.md`)
- **Tests Vitest**: sigue pendiente desde hace varias sesiones

### Sesión 18 — Completada (13 jul 2026)

**Landing pública en "/" — visible antes de cualquier login**

- **Routing** (`PrivateRoute.jsx`): en vez de crear una rama de rutas pública paralela, se aprovechó que "/" ya vivía dentro del árbol privado (`AppLayout`+`HomePage`) — `PrivateRoute` ahora mira `useLocation().pathname`: si no hay usuario y la ruta es exactamente `/`, renderiza `LandingPage` en vez de redirigir a `/login`; cualquier otra ruta privada sigue redirigiendo a `/login` igual que siempre, y un usuario con sesión nunca entra a esa rama (sigue derecho a su dashboard, sin cambios). Efecto colateral correcto: el catch-all de `App.jsx` (`*` → `/`) ahora manda a un visitante sin sesión con una URL rota a la landing en vez de a un muro de login
- **`src/features/marketing/`** nueva: `LandingPage.jsx` (compone las secciones + nav propio, con el mapa completo de placeholders documentado en un comentario al inicio del archivo), `sections/` (Hero, ProblemSection, SolutionSection, HowItWorks, PricingSection, SocialProof, FinalCta, LandingFooter), `pricing.js` (datos de planes + cálculo de precio/ahorro, ver abajo), `ImagePlaceholder.jsx` (recuadro punteado reutilizable que muestra el token `{{TOKEN}}` **en la página misma**, no solo en un comentario de código), `TermsPage.jsx`/`PrivacyPage.jsx` (placeholder "Próximamente", contenido legal real pendiente para otra sesión)
- **Precios con toggle de período**: `pricing.js` calcula, por plan y período (mensual/trimestral/semestral/anual, con -0/-10/-18/-28%), el precio mensual equivalente (redondeado a la decena), el total facturado en ese período, y el ahorro en pesos frente a pagar mes a mes — verificado a mano en navegador que la matemática cuadra exactamente para los 3 planes en los 4 períodos
- **Bug real encontrado y corregido en `components/ui/Button.jsx`** (no en el código nuevo de la landing): nadie había usado la prop `asChild` de `Button` hasta esta sesión (Radix `Slot`, para que un `<Link>` de React Router se vea y actúe como el botón sin anidar `<button>` dentro de `<a>`). `Slot` exige exactamente un hijo React — pero el JSX de `Button` siempre renderizaba `{loading && (...)} {children}` como dos hijos (el `false` de `loading` cuenta como hijo aunque no pinte nada), y `Slot` tronaba con "Slot failed to slot onto its children". Se corrigió para que, cuando `asChild` es true, se le pase a `Slot` únicamente `children` (sin el wrapper del spinner, que de todas formas no aplica a un link). El comportamiento de los botones normales (`asChild` false, usado en toda la app hasta ahora) queda idéntico
- **SEO básico** (`index.html`, estático — la app es un SPA sin SSR, así que esto es lo que ve un crawler antes de ejecutar JS): `<title>` y `<meta name="description">` orientados a "software ganadero Colombia", tags Open Graph (`og:title`, `og:description`, `og:type`, `og:locale`, `og:image`) y `twitter:card`. `og:image` apunta a `/apple-touch-icon.png` como placeholder funcional (ver mapa de placeholders abajo)

**Mapa de placeholders de imagen** (documentado también en el comentario inicial de `LandingPage.jsx`; cada uno se ve en pantalla como el texto `{{TOKEN}}` dentro de un recuadro punteado, no solo en el código):
- `{{HERO_IMAGE}}` (`sections/Hero.jsx`) — foto real de finca/ganado colombiano, celular en primer plano si se puede. 4:3 (1:1 en desktop), mínimo 1200×900px
- `{{ILLUSTRATION_MODULO_ANIMALES}}`, `_ORDENO`, `_PESAJES`, `_SANIDAD`, `_REPRODUCCION`, `_ALERTAS` (`sections/SolutionSection.jsx`) — ilustraciones de Canva, una por módulo, 4:3, mismo estilo/paleta entre las 6
- `{{TESTIMONIO_1}}`, `{{TESTIMONIO_2}}` (`sections/SocialProof.jsx`) — no son imágenes, son tarjetas de texto completas (nombre, finca, cita) a reemplazar cuando haya testimonios reales; no se inventaron nombres ni citas
- `{{OG_IMAGE}}` (`index.html`, comentario junto al `og:image`) — imagen de 1200×630px pensada para compartir en redes, hoy apunta al ícono de la app como placeholder funcional

**Verificado en navegador**: build limpio, landing completa renderiza sin errores en una pestaña nueva (sin caché de HMR — se vio ruido de errores de `Slot` en la pestaña donde se hizo el fix en caliente, confirmado como artefacto de Hot Module Replacement al abrir una pestaña nueva sin ese historial, no un bug real). Toggle de precios probado en Anual: Operativo $39.900→$28.730/mes, ahorra $134.040; Finca+ $79.900→$57.530/mes, ahorra $268.440 — matemática exacta. `/terminos` y `/privacidad` cargan el placeholder. Con sesión+finca mockeadas (solo estado de Zustand vía `setState`, sin tocar archivos ni backend), `/` renderiza el dashboard real, no la landing — confirma que el usuario autenticado no ve ningún cambio de flujo. Sin overflow horizontal en mobile (375px) ni desktop (1265px).

**Build**: ✅ 3645 módulos, 0 errores.

#### Pendiente para Sesión 19
- **Reemplazar los placeholders visuales** cuando existan los assets reales — ver mapa completo arriba
- **Contenido legal real** de `/terminos` y `/privacidad` (hoy son "Próximamente")
- **Definir precios finales de negocio**: los valores actuales ($39.900/$79.900 y los descuentos por período) fueron los que pidió el usuario para esta sesión — confirmar que son los definitivos antes de anunciarlos públicamente
- **`hola@hatosmart.com`** en el footer es un placeholder de contacto — confirmar que esa bandeja existe o cambiarla antes de publicar
- **Redes sociales**: footer no tiene Instagram/Facebook (lucide-react ya no incluye íconos de marca en esta versión, y tampoco existían cuentas reales confirmadas) — agregar cuando haya cuentas reales
- **CRÍTICO — Ejecutar en Supabase, en orden**: `030_possible_heat.sql` (y `028`/`029` si aún no corrieron)
- **CRÍTICO — Probar el flujo completo de recuperación de contraseña con una cuenta real** (Sesión 16)
- **Pegar los templates de `email-templates/`** en Supabase (ver `email-templates/README.md`)
- **Tests Vitest**: sigue pendiente desde hace varias sesiones
- **Eventos sanitarios grupales** y **detección de arete duplicado en importación masiva** (ver Sesión 8)

### Sesión 17 — Completada (13 jul 2026)

**PWA `theme_color` corregido a verde de marca, y dinámico por finca**

- **`vite.config.js`** (manifest de `vite-plugin-pwa`) e **`index.html`** (`<meta name="theme-color">`): ambos tenían el `#3dbf5e`/`#2b3240` de la plantilla pre-Sesión 5, nunca actualizados cuando el resto de la UI migró al verde de marca actual. `theme_color` → `#16a34a`, `background_color` del manifest → `#f9fafb` (mismo valor que `--background` en `index.css`, para que la pantalla de splash de la PWA instalada combine con el fondo real de la app en vez del `#2b3240` oscuro anterior)
- **Dinámico por finca**: se evaluó como sencillo y se implementó — `AppLayout.jsx` ya calculaba `accentColor` para el borde del header (Sesión 14); un `useEffect` adicional escribe ese mismo valor en el `content` del `<meta name="theme-color">` del documento en tiempo real (el `manifest.json` es estático, solo se lee al instalar la PWA, así que ese valor no se toca). Un segundo `useEffect` con cleanup-only restaura `#16a34a` al desmontar `AppLayout` (ej. al cerrar sesión y volver a `/login`), para no dejar pegado el color de la última finca visitada en pantallas sin contexto de finca

**Verificado en navegador**: `dist/manifest.webmanifest` generado por el build confirma `theme_color:"#16a34a"` y `background_color:"#f9fafb"`. En vivo (bypass temporal de `PrivateRoute`/`sessionStore`/mock de `farmStore`, revertido por completo después, `git diff` vacío confirmado): `/login` sin finca activa → meta tag en `#16a34a`; navegación **client-side** (vía `history.pushState`+`popstate`, sin recarga completa, para probar el ciclo de vida real del componente) a una ruta privada con finca mockeada (`accent_color: #2563eb`) → meta tag cambia a `#2563eb`; navegación de vuelta a `/login` → meta tag vuelve a `#16a34a`, confirmando que el cleanup del `useEffect` funciona. **No se pudo verificar visualmente el color de la barra de estado del navegador/PWA instalada** (este entorno no tiene un navegador real con UI de barra de estado ni la capacidad de instalar la PWA) — la confirmación fue vía el atributo `content` del meta tag, que es lo que el navegador lee para pintar esa barra. Como se explica en la respuesta: en una PWA ya instalada, el `theme_color` del manifest solo se relee al reinstalar (no hay forma de "refrescar" el manifest de una instalación existente); el `<meta name="theme-color">` dinámico si toma efecto en caliente en la mayoría de navegadores (Chrome/Edge en Android y desktop) sin reinstalar nada, con soporte más inconsistente en Safari/iOS para apps ya añadidas a pantalla de inicio.

**Build**: ✅ 3632 módulos, 0 errores.

#### Pendiente para Sesión 18
- **CRÍTICO — Probar el flujo completo con una cuenta real** (Sesión 16): solicitar reset desde `/olvide-contrasena`, abrir el enlace del correo real, confirmar que `/restablecer-contrasena` reconoce la sesión de recovery, cambiar la contraseña, y volver a loguear con la nueva
- **CRÍTICO — Antes de que el link funcione en producción**: agregar `https://www.hatosmart.com/restablecer-contrasena` a Authentication → URL Configuration → Redirect URLs en Supabase (si no está ya)
- **Pegar los templates de `email-templates/`** en Supabase (Authentication → Email Templates → Reset Password / Confirm signup) — ver `email-templates/README.md`
- **SMTP personalizado vía Resend**: pendiente de configurar
- **CRÍTICO — Ejecutar en Supabase, en orden**: `030_possible_heat.sql` (y `028`/`029` si aún no corrieron)
- **Hallazgo de timezone sin corregir** (ver Sesión 15): `rules/reproduction.js`/`rules/health.js` calculan un día antes de lo esperado en timezones detrás de UTC
- **Tests Vitest**: sigue pendiente desde hace varias sesiones
- **Eventos sanitarios grupales** y **detección de arete duplicado en importación masiva** (ver Sesión 8)

### Sesión 16 — Completada (13 jul 2026)

**"Recordar contraseña" — flujo funcional + templates de correo con marca**

- **`ForgotPasswordPage.jsx`** (`/olvide-contrasena`, pública): pide el correo, llama `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/restablecer-contrasena` } )` — mismo patrón sin dominio hardcodeado que ya usa el link de invitación por WhatsApp. Muestra un mensaje genérico ("Si el correo existe...") sin importar si Supabase devolvió éxito o no, porque Supabase mismo no distingue "correo no existe" con un error — solo un fallo real (rate limit, red) llega al branch de error, así que mostrarlo no filtra si la cuenta existe
- **`ResetPasswordPage.jsx`** (`/restablecer-contrasena`, pública): no reprocesa el link a mano — `detectSessionInUrl: true` ya está activo en `src/lib/supabase.js`, así que para cuando este componente monta, el token de recuperación de la URL ya se canjeó por una sesión real, y `sessionStore` (que hace `getSession()`/`onAuthStateChange` en `App.jsx` desde antes) ya la refleja. La página solo lee `useSessionStore.user`: sin sesión → pantalla "Enlace no válido o expirado" con link para pedir uno nuevo; con sesión → formulario de nueva contraseña (`PasswordInput.jsx`, mismo toggle de la Sesión 13). Al guardar: `supabase.auth.updateUser({ password })`, luego `signOut()` explícito (la sesión de recovery deja al usuario técnicamente logueado; se cierra a propósito para que vuelva a entrar a mano con la contraseña nueva, tal como se pidió) y redirige a `/login` con confirmación
- **`LoginPage.jsx`**: "¿Olvidaste tu contraseña?" deja de ser el `alert()` stub — ahora es un `Link` real a `/olvide-contrasena`
- **`email-templates/`** (carpeta nueva, sin conexión al código — se pegan a mano en Supabase): `recovery.html` y `confirmation.html`, HTML "a prueba de balas" (tablas, estilos inline, sin flexbox/grid, fuente del sistema), verde de marca `#16a34a`, logo referenciado por URL absoluta al dominio oficial (`https://www.hatosmart.com/apple-touch-icon.png`). Ambos usan `{{ .ConfirmationURL }}` — la única variable que hace falta para un link de un clic, verificada contra la sintaxis real de Supabase (no se inventó). No se armó plantilla de invitación a finca porque ese flujo es un sistema propio de PIN + WhatsApp (`ManageUsersPage.jsx`), no pasa por el correo de Auth de Supabase. `README.md` en la misma carpeta documenta qué archivo va en qué sección exacta de Supabase (Authentication → Email Templates → Reset Password / Confirm signup), el asunto sugerido, y el recordatorio de agregar `https://www.hatosmart.com/restablecer-contrasena` a la lista de Redirect URLs permitidos antes de que el link funcione en producción

**Verificado en navegador** (dev server, contra Supabase real):
- `/olvide-contrasena`: formulario envía `resetPasswordForEmail` con un correo de prueba inexistente (`hatosmart-verify-nonexistent-test@example.com`, elegido a propósito para no disparar un correo real a ninguna cuenta existente) → sin error, pantalla de confirmación genérica visible, confirmando que Supabase no revela existencia de cuenta
- `/restablecer-contrasena` sin sesión: pantalla "Enlace no válido o expirado" correcta (comportamiento real, no mockeado)
- `/restablecer-contrasena` con sesión (mockeada en `sessionStore` solo para ver el formulario): el formulario de nueva contraseña renderiza correctamente con los dos campos y su toggle
- **No se pudo probar el envío real de correo ni el intercambio real del token de recovery**: este entorno no tiene acceso a una bandeja de entrada real, y el harness de seguridad del sandbox bloqueó — correctamente — un intento de enviar el formulario de nueva contraseña usando la sesión mockeada (habría sido una llamada real y no verificable a `supabase.auth.updateUser` con una sesión falsificada). El camino feliz completo (pedir reset → abrir el correo real → llegar con el token real → cambiar contraseña → volver a loguear) queda pendiente de que el usuario lo pruebe con una cuenta real

**Build**: ✅ 3632 módulos, 0 errores.

### Sesión 15 — Completada (13 jul 2026)

**Alertas automáticas de posible celo, con parámetros configurables por finca**

- **`030_possible_heat.sql`**: `farms.voluntary_waiting_days` (default 50) y `farms.heifer_min_breeding_months` (default 15) — antes hardcodeados como 21 días fijos sin base de datos; `animals.possible_heat_date` (fecha activa, auto o manual) y `animals.possible_heat_manual` (si el valor actual fue ajustado a mano y no debe recalcularse hasta el próximo evento reproductivo)
- **`rules/reproduction.js` → `calcPossibleHeatDate(animal, reproEvents, farmSettings)`**: función pura, cubre exactamente los 4 casos del spec (novilla sin servicio por edad; parto sin servicio por VWP; servicio sin chequeo positivo, repite cada 21 días hasta la próxima ocurrencia; preñez confirmada → null). Reemplaza `calcNextHeatDate`/`isHeatDue`, que existían sin uso desde antes (parecían placeholders para esto mismo) — se eliminaron en vez de dejarlas como código muerto paralelo. `isHeiferAgeEstimate()` nueva, para el copy "Estimado, revisar peso y condición corporal"
- **Decisión de arquitectura — cálculo on-demand, no Edge Function/cron**: dos de los 4 casos (novilla envejeciendo hacia la edad mínima, y un servicio sin resolver rodando a su próximo ciclo de 21 días) no tienen ningún `repro_event` que dispare un recálculo — solo cambian porque pasó tiempo en el calendario. Un cron necesitaría el proyecto en línea en un horario fijo y de todos modos iría a destiempo respecto a una finca offline. Se optó por recalcular bajo demanda en el cliente (`src/lib/alerts/reproductionAlerts.js` → `refreshPossibleHeatAlerts(farmId)`), llamado al montar `HomePage`/`AlertsPage` — mismo patrón que ya usa el resto del sync (Dexie como fuente de verdad, upserts idempotentes baratos), sin infraestructura nueva. Los casos que sí tienen un evento disparador (servicio, parto, chequeo de preñez, secado) además recalculan **inmediatamente** al guardar el evento en `ReproEventForm` (`recalcPossibleHeat()`), igual que ya hacían `pregnancy_check_due`/`calving_due` — el recálculo por lote solo cubre lo que un write no puede
- **Reutiliza el sistema de alertas existente**: `type: 'possible_heat'` ya estaba en el check constraint de `alerts` y en `ALERT_CONFIG`/`ALERT_EMOJI` de `AlertsPage`/`HomePage` desde antes (Sesión 4), solo faltaba quien la generara — mismo patrón que `health_due`. A diferencia de `health_due` (se crea una vez, en el momento del evento), `possible_heat` se **upserta en el mismo id** cada vez que cambia, porque su fecha se mueve sola con el calendario (casos 1 y 3) — un alta nueva cada vez habría duplicado alertas
- **`FarmSettingsPage.jsx`**: sección nueva "Parámetros de reproducción" con los dos campos, mismo patrón de inputs que el resto de la página
- **`AnimalDetailPage.jsx`** (tab Reproducción, sin gate — mismo acceso que registrar un evento reproductivo): fila "Posible celo" con la fecha (oculta si `pregnant`/`dry`), badge "Ajustado manualmente" / "Estimado por edad" / "Calculado", botón "Ajustar" (date input inline, guarda con `possible_heat_manual: true` y sincroniza la alerta en el mismo paso) y "Recalcular" (solo visible si manual — vuelve a `false` y dispara `recalcPossibleHeat` de inmediato)
- **Bug encontrado y corregido durante la verificación** (no en producción, detectado antes de commitear): el guardado manual originalmente solo escribía `animals.possible_heat_date` sin tocar la fila de `alerts` — la ficha mostraba la fecha ajustada pero `AlertsPage` seguía mostrando la fecha automática vieja. Corregido para que el guardado manual llame a `recalcPossibleHeat` (que sincroniza la alerta) en el mismo paso. Un segundo bug relacionado: "Recalcular" recomputaba la fecha correctamente pero nunca dejaba `possible_heat_manual` en `false` en Dexie (el objeto pasado a `recalcPossibleHeat` tenía el flag en memoria, pero nunca se persistía antes de la llamada) — corregido escribiendo `possible_heat_manual: false` explícitamente antes de recalcular
- **Hallazgo — no corregido, fuera de alcance de esta sesión**: `new Date('yyyy-MM-dd')` (sin sufijo de hora) parsea como medianoche UTC; en `America/Bogotá` (UTC-5, el timezone objetivo de la app) esto se muestra un día antes de lo esperado al reformatear. `AlertsPage`/`HomePage`/`MilkDashboard` ya evitan esto agregando `+ 'T00:00'` antes de crear el `Date`, pero `calcFPP`/`calcDryOffDate`/`calcNextDueDate` (preexistentes) y ahora `calcPossibleHeatDate` (nueva, pero fiel al mismo patrón ya establecido en `rules/*.js`) NO lo hacen — el cálculo en sí mismo queda corrido un día, no solo la vista. Se corrigió puntualmente el display de `possible_heat_date` en la ficha (usaba el patrón sin el sufijo, lo que hacía que se viera un día distinto al de la alerta para el mismo valor guardado) para que coincida con `AlertsPage`, pero el problema de fondo en el cálculo (`rules/*.js` completo) no se tocó — es un problema sistémico preexistente, no algo introducido en esta sesión, y arreglarlo bien requiere auditar todo el manejo de fechas de la app, no solo este módulo

**Verificado en navegador** con el mismo bypass temporal de `PrivateRoute`/`sessionStore`/mock de `farmStore` (revertido por completo después, `git diff` vacío confirmado) y datos sembrados directo en Dexie vía `import()` dinámico del módulo `db.js`:
- **Novilla sin servicio** (nacida hace ~16 meses, `heifer_min_breeding_months=15`): alerta generada, mensaje con "revisar peso y condición corporal"
- **Vaca recién parida sin servicio** (parto hace 10 días, `voluntary_waiting_days=50`): alerta generada con fecha parto+50d
- **Vaca servida sin confirmar preñez** (servicio hace 25 días): alerta generada con fecha servicio+21d, avanzada al próximo ciclo (>= hoy)
- **Ajuste manual desde la ficha**: cambia la fecha, queda marcada "Ajustado manualmente", la alerta en Dexie se actualiza al mismo valor (después del fix)
- **Recalcular**: vuelve al valor automático y el flag manual queda en `false` (después del fix)
- **Evento disparador real** (registrar chequeo de preñez positivo vía `ReproEventForm` para la vaca servida): `repro_status` → `pregnant`, `possible_heat_date`/`possible_heat_manual` se limpian, la alerta pendiente se descarta — confirmado que ya no aparece en `AlertsPage`, sin afectar las otras dos alertas
- **No se pudo probar contra Supabase real** (la migración `030` no se ha ejecutado en producción todavía — los intentos de sync mostraron el error esperado `Could not find the 'possible_heat_date' column`, confirmando que el fallo es por la migración pendiente y no por el código)

**Build**: ✅ 3630 módulos, 0 errores.

### Sesión 14 — Completada (13 jul 2026)

**Rediseño de MorePage: enlaces muertos, pantallas nuevas, y color de acento por finca**

Basado en un diagnóstico previo (mismo día): `/configuracion` y `/perfil` eran enlaces que no llevaban a ningún lado (no existían como rutas en `App.jsx` — caían en el catch-all y rebotaban al home sin error visible), y las pantallas ya construidas de historial de pesajes/salud no tenían entrada desde MorePage (sí eran accesibles vía tarjetas del dashboard, pero no desde el menú).

- **`028_farm_accent_color.sql`**: columna `accent_color text not null default '#16a34a'` en `farms`, con constraint de formato hex (`^#[0-9a-fA-F]{6}$`)
- **`029_farm_logos_storage.sql`**: bucket `farm-logos` (público, mismo patrón de path `${farm_id}/logo.<ext>` que `animal-photos`) + policies de `storage.objects` usando `has_farm_role()` — a diferencia de `animal-photos` (creado a mano en su momento, sin rastro en migraciones, según lo documentado en Sesión 9), este bucket se creó versionado desde el principio
- **`FarmSettingsPage.jsx`** (`/configuracion`, gate **owner** — más estricto que la policy RLS `farms_update`, que sigue en admin+ desde Sesión 10; es una decisión de UI, no de seguridad de datos, igual que otros gaps ya documentados en el proyecto): edita `commercial_name`, sube `logo_url` a Storage, y elige `accent_color` de una paleta cerrada de 8 colores (no color picker libre — más simple para el usuario objetivo). El nombre legal (`name`) se muestra pero no es editable desde aquí
- **`ProfilePage.jsx`** (`/perfil`, sin gate — cualquier usuario autenticado): editar nombre completo (`profiles.full_name` + espejo en `auth.updateUser({data})`), correo de solo lectura, cambiar contraseña (`auth.updateUser({password})`, reutiliza `PasswordInput.jsx` de la Sesión 13), y lista de fincas con el rol en cada una — útil para alguien en varias fincas
- **Color de acento en el header**: `AppLayout.jsx` ahora pinta un borde inferior de 3px con `activeFarm.accent_color` y muestra el nombre de la finca junto a un punto del mismo color, debajo del logo de HatoSmart. Es una medida de seguridad, no solo estética: un operador que cambie de finca vía `FarmSelector` debe notar el cambio de color de inmediato, para no registrar datos en la finca equivocada por error
- **`MorePage.jsx`** reagrupado en 4 secciones con headers visualmente distintos (antes lista plana): **Mi finca** (Configuración de la finca *[owner]*, Mis fincas, Unirme a otra finca) · **Catálogos** (Protocolos sanitarios *[admin+]*) · **Historial** (Historial de pesajes, Historial de salud — antes sin entrada aquí) · **Cuenta** (Gestión de usuarios *[owner]*, Mi perfil, Cerrar sesión). Una sección entera se oculta si ningún ítem es visible para el rol actual (le pasaría a "Catálogos" para un worker)
- El `SyncBadge` del header no se tocó — sigue viviendo solo ahí, no se duplicó en MorePage

**Verificado en navegador** con un bypass temporal de `PrivateRoute`/`sessionStore`/mock de `farmStore.activeFarm` (revertido por completo después, confirmado con `git diff` vacío antes de continuar):
- Con rol `owner`: las 4 secciones completas visibles, `/configuracion` carga sin error, cambiar de swatch de color mueve el check al botón correcto, `/perfil` carga sin error y muestra la finca mock con su rol
- Con rol `worker`: "Configuración de la finca", sección "Catálogos" completa y "Gestión de usuarios" desaparecen de MorePage; navegar directo a `/configuracion` muestra el bloqueo de `RequireRole` ("requiere un rol de dueño")
- El borde del header tomó el `accent_color` mockeado (`#2563eb` → confirmado por `getComputedStyle`) y el nombre de la finca apareció junto al punto de color
- **No se pudo probar contra Supabase real** (crear finca real, subir logo real, guardar accent_color real) porque las migraciones `028`/`029` no se han ejecutado en producción todavía

**Build**: ✅ 3629 módulos, 0 errores.

#### Pendiente para Sesión 15
- **CRÍTICO — Ejecutar en Supabase, en orden**: `028_farm_accent_color.sql`, `029_farm_logos_storage.sql` (y `027` si aún no corrió)
- **CRÍTICO — Probar de verdad contra producción**: guardar nombre comercial/logo/color desde `FarmSettingsPage` y confirmar que el header cambia sin recargar; cambiar contraseña y nombre desde `ProfilePage`
- **Gap documentado a propósito**: `FarmSettingsPage` está gateada a `owner` en la UI, pero la policy RLS `farms_update` sigue permitiendo admin+ (sin cambios desde Sesión 10) — un admin no ve el botón pero técnicamente podría hacer un `UPDATE` directo vía API. Igual que el gap de `animals_update`, se decidió no tocar RLS en esta sesión por alcance
- **Alertas de celo automáticas**: generar `possible_heat` cada 21 días tras último celo/servicio sin preñez confirmada
- **Tests Vitest**: rules/reproduction.js, rules/categories.js, rules/weights.js, rules/health.js, rules/animalImport.js y rules/roles.js
- **PWA manifest**: actualizar `theme_color` a `#16a34a`
- **Eventos sanitarios grupales** y **detección de arete duplicado en importación masiva** (ver Sesión 8)
- **"¿Olvidaste tu contraseña?"** en LoginPage sigue siendo un `alert()` stub, sin flujo real de recuperación

### Sesión 13 — Completada (13 jul 2026)

**Fusión signup + join en un solo paso, detección de correo existente, y toggle mostrar/ocultar contraseña**

- **`027_invitation_preview.sql`**: nueva RPC `get_invitation_preview(p_code)`, de solo lectura y sin requerir sesión (`grant execute ... to anon, authenticated`) — necesaria porque un invitado nuevo todavía no tiene cuenta cuando abre el link, así que no se puede usar `redeem_farm_invitation` (que exige `auth.uid()`) para mostrarle el contexto de la invitación de antemano. Valida existencia/uso/expiración igual que `redeem_farm_invitation` y devuelve `farm_name`+`role`
- **Flujo nuevo**: `JoinFarmPageGuard` (`App.jsx`) ahora manda al usuario sin sesión a `/registro` (antes `/login`) guardando el código en `localStorage` igual que antes. `SignupPage`/`LoginPage` llaman `fetchInvitePreview()` (`src/lib/inviteCode.js`) al montar si hay código pendiente:
  - Código inválido/expirado → pantalla de error inmediata, **antes** de mostrar el formulario (verificado en navegador: error visible sin haber tocado ningún campo)
  - Código válido → banner "Te están invitando a unirte a **{finca}** como **{rol}**" arriba del formulario normal
  - Al enviar el formulario de registro: `supabase.auth.signUp()` y, si ya hay sesión (confirmación de email desactivada), `redeem_farm_invitation` se llama en el mismo flujo — el usuario termina dentro de la finca sin ningún clic ni pantalla adicional. Si el proyecto tiene confirmación de email activada (`data.session` viene null), el código sigue guardado en `localStorage` y es `LoginPage` quien lo canjea justo después de que el usuario confirme y inicie sesión — sigue sin haber un paso de "unirse" separado
- **Correo ya existente**: `SignupPage` ya detectaba `already registered` (existente desde antes) — se amplió el mensaje para mencionar la finca de la invitación si aplica, y se agregó un link "Iniciar sesión" visible junto al error (antes solo texto). El código pendiente no se borra en este caso, así que al iniciar sesión desde ese link, `LoginPage` lo detecta y hace el mismo canje automático — es el mismo mecanismo que ya existía para "Unirme a otra finca" desde `MorePage`, solo que ahora se dispara solo
- **`JoinFarmPage.jsx`** (uso: usuario ya autenticado, código manual desde "Unirme a otra finca" en `MorePage`, o clic en el link de invitación estando ya logueado): se agregó auto-canje en el segundo caso (código explícito en la URL) para no exigir un clic en "Unirme" sobre un código que el usuario ni siquiera tuvo que escribir; el caso de código manual (sin `?code=` en la URL) conserva el botón, porque ahí sí es una acción deliberada
- **Toggle mostrar/ocultar contraseña**: `src/components/ui/PasswordInput.jsx` nuevo — input que alterna `type="password"`/`type="text"` con ícono de ojo (`lucide-react`), sin guardar ni loggear el valor en ningún lado. Aplicado en los 4 campos de contraseña existentes en la app (Login, Signup contraseña + confirmar contraseña) — no existe pantalla de cambio de contraseña todavía, así que no hay más campos que migrar
- **Verificado en navegador** (dev server, contra Supabase real): toggle de contraseña alterna correctamente el tipo del input y el label del botón; `/unirse?code=XXXXXX` sin sesión redirige a `/registro` con el código guardado en `localStorage`, y como la migración `027` aún no se ha ejecutado en producción, la llamada a `get_invitation_preview` falla — lo cual de hecho confirma el camino de "código inválido": se ve la pantalla de error de inmediato, antes del formulario, y el código se limpia de `localStorage`. **No se pudo probar el camino feliz completo** (código válido → cuenta nueva → unido a la finca sin clics) porque requiere la migración `027` aplicada y un código real generado por un owner — queda pendiente de probar por el usuario una vez ejecutada la migración

**Build**: ✅ 3627 módulos, 0 errores.

#### Pendiente para Sesión 14
- **CRÍTICO — Ejecutar en Supabase, en orden**: `027_invitation_preview.sql` (y `019`–`026` si aún no corrieron)
- **CRÍTICO — Probar de verdad el flujo fusionado** una vez aplicada la migración: abrir un link de invitación real sin sesión → banner de contexto correcto → crear cuenta → termina dentro de la finca sin pasos extra; repetir con un correo ya existente → mensaje + link a login → iniciar sesión → mismo resultado
- **Pantalla Más (MorePage)**: rediseño con shadcn/ui — perfil, configuración de finca, cerrar sesión
- **Alertas de celo automáticas**: generar `possible_heat` cada 21 días tras último celo/servicio sin preñez confirmada
- **Tests Vitest**: rules/reproduction.js, rules/categories.js, rules/weights.js, rules/health.js, rules/animalImport.js y rules/roles.js
- **PWA manifest**: actualizar `theme_color` a `#16a34a`
- **Eventos sanitarios grupales** y **detección de arete duplicado en importación masiva** (ver Sesión 8)
- **"¿Olvidaste tu contraseña?"** en LoginPage sigue siendo un `alert()` stub, sin flujo real de recuperación

### Sesión 12 — Completada (14 jul 2026)

**Link directo en la invitación por WhatsApp**
- El mensaje generado por `ManageUsersPage` solo incluía el PIN en texto plano, obligando al invitado a transcribirlo a mano en `/unirse`
- `whatsappLink()` arma la URL con `${window.location.origin}/unirse?code=${code}` — no se hardcodeó ningún dominio, así que funciona igual en local, en el dominio de Vercel o en el oficial. **Corrección**: en esta sesión se asumió que `www.hatosmart.com` no existía (no aparecía documentado en CLAUDE.md) y se usó eso como justificación para no hardcodearlo; el usuario confirmó después que `www.hatosmart.com` **sí es el dominio oficial, verificado en Vercel** — el código no necesitó cambios porque ya no dependía de ningún dominio fijo, pero la premisa era incorrecta. Ver "Repositorio y despliegue" arriba para el dato correcto
- `JoinFarmPage.jsx` ahora lee `?code=` de la URL (`useSearchParams`) y pre-llena el input — el invitado solo confirma con "Unirme" en vez de escribir el código
- **Caso no trivial que sí se resolvió**: si quien abre el link no tiene sesión, `/unirse` lo manda a `/login` (o se registra), y ese salto perdía el query param. Se agregó `src/lib/inviteCode.js` (constante `PENDING_INVITE_CODE_KEY`) para guardar el código en `localStorage` justo antes de redirigir a login (`JoinFarmPageGuard` en `App.jsx`), y `LoginPage`/`SignupPage` ahora revisan ese valor después de autenticar exitosamente y mandan a `/unirse` en vez del flujo normal de onboarding/home. `JoinFarmPage` limpia la clave de `localStorage` al canjear el código con éxito
- Verificado en navegador: código en la URL sin sesión → redirige a `/login` y el código queda guardado en `localStorage`; con el guard bypaseado temporalmente (solo para la prueba, revertido después) → el input llega prellenado con el código de la URL (con prioridad sobre el que hubiera en `localStorage`) y el botón "Unirme" queda habilitado sin que el usuario escriba nada

**Build**: ✅ 3625 módulos, 0 errores.

### Sesión 11 — Completada (14 jul 2026)

**Fix — "permission denied for table farm_invitations" en ManageUsersPage**
- Causa real confirmada con datos, no adivinada: se comparó `information_schema.role_table_grants` entre tablas viejas (`weighings`, `memberships` — tienen SELECT/INSERT/UPDATE/DELETE para `authenticated`) y tablas nuevas creadas por migración (`farm_invitations` de la Sesión 10, `health_protocols` de la Sesión 8 — **solo tenían REFERENCES/TRIGGER/TRUNCATE**, sin ningún CRUD). No era un problema de las políticas RLS de `025_farm_invitations.sql` (esas están bien escritas) — Postgres rechaza el acceso a nivel de `GRANT` de tabla *antes* de siquiera evaluar RLS, por eso el error era "permission denied" (típico de falta de grant) y no un resultado vacío (típico de rechazo de RLS)
- `CREATE TABLE` no otorga privilegios a otros roles por sí solo; las tablas originales del proyecto los tienen por un privilegio por defecto configurado al crear el proyecto de Supabase, que aparentemente no se aplicó a tablas creadas después vía migración
- **`health_protocols` tenía el mismo bug latente** aunque no fue lo reportado — nunca se había probado `ProtocolsPage` contra producción, así que probablemente estaba rota desde la Sesión 8 sin que nadie lo notara. Se corrigió en la misma migración para no repetir el susto
- `026_fix_missing_table_grants.sql`: `grant select, insert, update on farm_invitations, health_protocols to authenticated` (no se otorga DELETE porque ninguna de las dos tablas tiene política RLS de DELETE — se invalida/borra vía UPDATE de `expires_at`/`deleted_at`, no con un DELETE físico)
- **Pendiente de verificar por el usuario**: cualquier tabla nueva que se cree de aquí en adelante debería confirmar sus grants con la misma consulta a `information_schema.role_table_grants` antes de darla por funcional — quedó anotado abajo

**Build**: ✅ 3625 módulos, 0 errores (cambio es solo SQL, no toca código de la app).

#### Pendiente para Sesión 12
- **CRÍTICO — Ejecutar en Supabase, en orden**: `023`, `024`, `025`, `026` (y `019`–`022` si aún no corrieron)
- **CRÍTICO — Probar de verdad el flujo de invitación** una vez aplicadas las migraciones: owner genera código worker → segundo usuario lo canjea → confirmar que queda con `role='worker'`, que no puede editar/eliminar animales, y que sí puede registrar ordeño/pesajes/sanidad/reproducción
- **Convención nueva para migraciones futuras**: después de crear cualquier tabla nueva, correr `select table_name, grantee, privilege_type from information_schema.role_table_grants where table_schema='public' and table_name='<tabla_nueva>'` y comparar contra una tabla vieja — si faltan SELECT/INSERT/UPDATE/DELETE para `authenticated`, agregar el `GRANT` explícito en la misma migración
- **Gap de `animals_update`**: si se quiere blindar a nivel de RLS (no solo UI) que un worker no pueda editar animales manualmente, hay que mover los efectos automáticos de reproducción (repro_status, crear cría) a una función `SECURITY DEFINER` y recién ahí restringir `animals_update` a admin+
- **Eliminar la finca**: sigue sin UI/feature; cuando se construya, no puede depender de la policy de `farms_update` tal cual — va a necesitar su propio mecanismo owner-only
- **Pantalla Más (MorePage)**: rediseño con shadcn/ui — perfil, configuración de finca, cerrar sesión
- **Alertas de celo automáticas**: generar `possible_heat` cada 21 días tras último celo/servicio sin preñez confirmada
- **Tests Vitest**: rules/reproduction.js, rules/categories.js, rules/weights.js, rules/health.js, rules/animalImport.js y rules/roles.js
- **PWA manifest**: actualizar `theme_color` a `#16a34a`
- **Eventos sanitarios grupales** y **detección de arete duplicado en importación masiva** (ver Sesión 8)

### Sesión 10 — Completada (13 jul 2026)

**Roles reales (owner > admin > worker) + invitación por PIN.** Hasta esta sesión `memberships.role` existía en el schema pero no lo usaba nada (diagnóstico de Sesión 9). Ahora sí:

**RLS — `has_farm_role(farm_id, min_role)`** (`024_role_enforcement.sql`)
- Jerarquía: owner=3, admin=2, worker=1; verdadero si el rol del usuario en esa finca es ≥ min_role. Documentado en el propio SQL
- `animals_insert` → admin+ (dar de alta un animal no es un "registro diario"). `health_protocols_insert`/`_update` → admin+ (catálogo = configuración). `farms_update` → admin+ (antes cualquier miembro podía editar la finca)
- `memberships`: `insert`/`update`/`delete` ahora exigen owner (antes no existían policies de update/delete — **cambiar rol o quitar a alguien era imposible incluso para el dueño**). Se agregó `memberships_select_owner` para que el owner vea a todos los miembros de su finca (antes cada quien solo veía su propia membership, ni el dueño podía listar su equipo)
- **Gap dejado a propósito, documentado en el SQL**: `animals_update` NO se restringió a admin+. Un worker registrando un evento de "servicio" o "parto" (permitido — es un registro diario de reproducción) dispara efectos automáticos sobre `animals` (repro_status, crear la cría) escritos directo a Dexie → cola → `runSync()` hace upsert genérico, sin una RPC intermedia que distinga "edición manual" de "efecto automático". RLS no puede diferenciar columnas dentro de un mismo UPDATE sin un trigger que compare OLD/NEW. Se decidió (con el usuario, antes de implementar) reforzar esto solo en la UI en vez de bloquearlo en RLS — un worker técnicamente podría hacer un UPDATE directo a animals vía API si se lo propone. Si se necesita blindaje real, la solución es mover esos efectos a una función `SECURITY DEFINER` dedicada

**Invitación por PIN** (`025_farm_invitations.sql`)
- Tabla `farm_invitations` (id, account_id, farm_id, code único, role admin\|worker, created_by, expires_at, used_at, used_by) — RLS: solo el owner ve/crea/invalida los códigos de su finca
- `redeem_farm_invitation(p_code)` — `SECURITY DEFINER`: valida código (existe, no usado, no expirado, el usuario no es ya miembro) y crea la membership en una sola operación. Es la única puerta de entrada al canje — nadie puede leer la tabla de invitaciones directamente salvo el owner
- `get_farm_members(p_farm_id)` — `SECURITY DEFINER`: junta `memberships`+`auth.users`+`profiles` para traer email+nombre+rol de cada miembro (el cliente no puede consultar `auth.users` directo)
- Código: 6 caracteres, alfabeto sin 0/O/1/I/L para evitar confusión al dictarlo, generado client-side con `crypto.getRandomValues`, expira a las 48h
- `farm_invitations` **no pasa por Dexie/sync engine** — es la única tabla del proyecto que habla directo con Supabase (como auth/onboarding), porque generar/canjear un código es intrínsecamente una acción en línea, no un registro de campo offline-first

**UI**
- `ManageUsersPage.jsx` (`/usuarios`, solo owner): lista de miembros vía `get_farm_members`, cambiar rol / quitar usuario (deshabilitado sobre la fila propia y sobre el owner), generar código (Dialog con selector de rol → PIN grande con botón copiar + link de WhatsApp), lista de códigos activos con invalidar
- `JoinFarmPage.jsx` (`/unirse`): input de PIN, llama `redeem_farm_invitation`, trae la finca y la agrega a `farmStore`. Reutilizable desde dos entradas: enlace nuevo en el Paso 1 de `OnboardingWizard` ("¿Tienes un código? Únete a una finca") para usuario nuevo, y desde `MorePage` ("Unirme a otra finca") para usuario que ya tiene finca(s)
- `sessionStore.loadFarmsForUser()` no traía `role` (solo `LoginPage.jsx` lo hacía) — se corrigió para que `activeFarm.role` esté disponible también después de recargar la página, no solo justo después de iniciar sesión
- `src/lib/rules/roles.js`: `hasMinRole()` (espejo en JS de `has_farm_role`) + `ROLE_LABELS`. Gating aplicado en: botón editar de `AnimalDetailPage`, botones Nuevo/Importar/FAB de `AnimalListPage`, y visibilidad de "Protocolos sanitarios"/"Gestión de usuarios" en `MorePage`
- `RequireRole.jsx` (guard de ruta, no solo de botón): envuelve `/animales/nuevo`, `/animales/:id/editar`, `/animales/importar`, `/protocolos` (admin+) y `/usuarios` (owner). Necesario porque ocultar un botón no alcanza — Dexie no tiene RLS, así que un worker que entrara directo a la URL vería un formulario que "guarda" localmente pero nunca sincroniza (queda `pending` para siempre sin ningún mensaje de error). El guard evita ese engaño

**Verificación**: se probó el gating de UI en el navegador alternando `activeFarm.role` entre `worker` y `owner` (con bypass temporal de `PrivateRoute`, revertido después) — confirmado que botones se ocultan/muestran correctamente y que `RequireRole` bloquea `/animales/nuevo` a un worker con el mensaje esperado. **No se pudo probar contra Supabase real**: las migraciones `024`/`025` no se han ejecutado en producción todavía (no hay acceso de escritura a la base de datos desde este entorno), así que el canje de código, `get_farm_members` y el enforcement real de RLS quedan sin probar end-to-end hasta que el usuario las corra y se repita la prueba.

**Build**: ✅ 3625 módulos, 0 errores.

#### Pendiente para Sesión 11
- **CRÍTICO — Ejecutar en Supabase, en orden**: `023_create_account_and_farm.sql`, `024_role_enforcement.sql`, `025_farm_invitations.sql` (y `019`–`022` si aún no corrieron)
- **CRÍTICO — Probar de verdad el flujo de invitación** una vez aplicadas las migraciones: owner genera código worker → segundo usuario lo canjea → confirmar que queda con `role='worker'`, que no puede editar/eliminar animales, y que sí puede registrar ordeño/pesajes/sanidad/reproducción
- **Gap de `animals_update`**: si se quiere blindar a nivel de RLS (no solo UI) que un worker no pueda editar animales manualmente, hay que mover los efectos automáticos de reproducción (repro_status, crear cría) a una función `SECURITY DEFINER` y recién ahí restringir `animals_update` a admin+
- **Eliminar la finca**: sigue sin UI/feature; cuando se construya, no puede depender de la policy de `farms_update` tal cual (no distingue "cambiar moneda" de "poner deleted_at") — va a necesitar su propio mecanismo owner-only
- **Pantalla Más (MorePage)**: rediseño con shadcn/ui — perfil, configuración de finca, cerrar sesión
- **Alertas de celo automáticas**: generar `possible_heat` cada 21 días tras último celo/servicio sin preñez confirmada
- **Tests Vitest**: rules/reproduction.js, rules/categories.js, rules/weights.js, rules/health.js, rules/animalImport.js y rules/roles.js
- **PWA manifest**: actualizar `theme_color` a `#16a34a`
- **Eventos sanitarios grupales** y **detección de arete duplicado en importación masiva** (ver Sesión 8)

### Sesión 9 — Completada (13 jul 2026)

**Rescate de `create_account_and_farm` — ya versionada**
- Existía únicamente creada a mano en el SQL Editor de Supabase desde la Sesión 5 (así lo dejó documentado esa sesión) y nunca se había llevado a una migración. Si el proyecto de Supabase se reconstruyera desde `supabase/migrations/`, el onboarding se habría roto por falta de esta función
- Se trajo la definición **real** vía introspección de catálogo (`pg_get_functiondef`, `information_schema.routine_privileges`) — no se asumió nada de lo que decía CLAUDE.md sobre qué debía hacer
- `supabase/migrations/023_create_account_and_farm.sql`: copia exacta de lo que corre hoy en producción — `SECURITY DEFINER`, `SET search_path TO 'public'`, mismo cuerpo (crea `accounts` + `farms` + `memberships` con `role='owner'`, retorna `jsonb` con `account_id`/`farm_id`). Es un `CREATE OR REPLACE FUNCTION`, así que aplicarla no cambia el comportamiento actual — solo lo versiona
- Grants confirmados: `EXECUTE` para `PUBLIC` y `postgres` — es el comportamiento por defecto de Postgres al crear una función (no requiere `GRANT` explícito adicional)

**Auditoría de objetos "sueltos"** (funciones/triggers/policies aplicados en Supabase pero ausentes del repo): se cruzaron las 5 funciones, 12 triggers y 38 políticas RLS que existen hoy en `public` contra el texto de todas las migraciones. Resultado: **`create_account_and_farm` era el único objeto huérfano.** Todo lo demás ya estaba versionado:
- `create_demo_farm` → `017_seed.sql`
- `has_farm_access` → `014_rls_policies.sql`
- `update_updated_at_column` y los 12 triggers `trg_*_updated_at` → `015_triggers.sql` (11) + `021_health_protocols.sql` (1, agregado en Sesión 8)
- Las 38 políticas RLS → todas rastreadas a `002`/`013`/`014`/`018`/`019`/`021`/`022`

**Diagnóstico de tenants/roles/invitaciones** (a pedido, sin implementar cambios): se dejó registrado el hallazgo de que `memberships.role` (`owner`/`admin`/`worker`) y `memberships.permissions` (jsonb) existen en el schema pero **no los usa ninguna política RLS ni la UI** — `has_farm_access()` no distingue rol, y `LoginPage.jsx` trae `role` pero nunca se vuelve a leer. Tampoco existe flujo de invitación (no hay tabla, RPC ni UI), aunque la política `memberships_insert` ya autoriza al dueño de la cuenta a insertar una membership para *otro* `user_id` — es la mitad de la tubería, falta buscar usuario por correo + estado de invitación + UI. El modelo multi-finca por usuario funciona en lectura (`FarmSelector`, `sessionStore`) pero no hay forma de que un usuario termine con una segunda finca salvo insertar filas a mano. Detalle completo de estos hallazgos quedó en la conversación de diagnóstico, no repetido aquí — ver commit de esta sesión.

**Build**: no aplica (solo SQL + documentación, sin cambios de código de la app).

#### Pendiente para Sesión 10
- **CRÍTICO — Ejecutar en Supabase**: `023_create_account_and_farm.sql` (recomendado correrla igual aunque sea un no-op, para que el historial de migraciones aplicadas quede consistente), y confirmar `019`–`022` si aún no se han ejecutado
- **Roles sin aplicar**: decidir si `memberships.role`/`permissions` se implementan de verdad (RLS + UI) o se retiran del schema si no se van a usar pronto
- **Flujo de invitación**: no existe — definir mecanismo (buscar por correo requiere una Edge Function o RPC con `SECURITY DEFINER`, ya que el cliente no puede consultar `auth.users` directamente)
- **Multi-finca, lado de escritura**: no hay forma de agregar una segunda finca a una cuenta existente ni de unirse a la cuenta de otra persona, más allá de insertar filas a mano
- **Pantalla Más (MorePage)**: rediseño con shadcn/ui — perfil, configuración de finca, cerrar sesión
- **Alertas de celo automáticas**: generar `possible_heat` cada 21 días tras último celo/servicio sin preñez confirmada
- **Tests Vitest**: rules/reproduction.js, rules/categories.js, rules/weights.js, rules/health.js y rules/animalImport.js
- **PWA manifest**: actualizar `theme_color` a `#16a34a`
- **Eventos sanitarios grupales** y **detección de arete duplicado en importación masiva** (ver Sesión 8)

### Sesión 8 — Completada (12 jul 2026)

**Fix crítico — pantalla en blanco en "Agregar animal"**
- Causa raíz: `AnimalFormPage.jsx` referenciaba una variable `labelCls` nunca definida (solo existían `inputCls`/`selectCls`) en el label del campo de foto — `ReferenceError` en cada render desde que el archivo se creó (confirmado con `git blame`, no era una regresión de Pesajes/Sanidad). Sin Error Boundary, React desmontaba todo el árbol → pantalla en blanco total, igual en PWA instalada y navegador
- Fix: se reemplazó el label suelto por el componente `Field` que ya usan todos los demás campos del formulario
- Se agregó `src/components/shared/ErrorBoundary.jsx` (montado en `main.jsx` envolviendo toda la app) para que un futuro crash de render muestre "Algo salió mal" + botón "Recargar" en vez de pantalla en blanco
- Verificado end-to-end: formulario renderiza, se llena, se guarda y el animal aparece en la lista; el Error Boundary se probó forzando un crash real

**Importación masiva de animales (`ImportAnimalsPage.jsx`, `/animales/importar`)**
- Filosofía: fricción mínima — solo `tag_number` (Arete) y `sex` (Sexo) son obligatorios para importar una fila (los únicos `not null`/requeridos en el flujo manual de `AnimalFormPage`); todo lo demás se guarda si viene en el archivo y se puede completar después desde la ficha del animal
- Librería: se agregó `xlsx` (SheetJS) — **instalada desde el CDN oficial de SheetJS** (`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`), no desde el registro de npm, porque la versión publicada ahí (0.18.5) tiene vulnerabilidades conocidas (prototype pollution + ReDoS) que SheetJS ya parchó en su propio CDN pero nunca republicó a npm
- `src/lib/rules/animalImport.js` (puro, sin tocar xlsx ni el DOM): catálogo `SYSTEM_FIELDS` con alias por columna para mapeo automático por similitud de nombre (ej. "ID"/"Numero"/"Caravana" → Arete), parsers tolerantes de sexo/fecha/categoría/origen, y `parseAndValidateRow()` que separa errores bloqueantes (solo arete/sexo) de advertencias no bloqueantes (todo lo demás). Reutiliza `suggestCategory()` de `rules/categories.js` cuando la categoría no viene en el archivo
- `src/lib/animalImportFile.js`: genera la plantilla descargable (hoja "Animales" + hoja "Instrucciones" con las obligatorias marcadas con `*`, mismo lenguaje que ya usa `AnimalFormPage`) y parsea el archivo subido (`.xlsx`/`.csv`) a filas crudas, sin asumir orden ni nombres de columna
- Flujo de 4 pasos en una sola página: subir archivo → mapeo de columnas (editable, con badge de columnas no reconocidas) → grilla editable con resumen "X listos / Y bloqueados" → resultado final con conteo de éxito/pendientes y botón "Corregir y reintentar" que vuelve a la grilla con solo las filas que fallaron
- **Madre por arete**: si la columna "Madre (arete)" trae un valor, se resuelve a `mother_id` cruzando contra animales ya existentes en la finca *y* contra otras filas del mismo lote que se están importando ahora (permite referenciar a la madre aunque se suba en el mismo archivo)
- **Manejo de errores por fila**: cada escritura a Dexie se intenta individualmente dentro de un try/catch — si una fila falla, no tumba la importación de las demás; los motivos (bloqueo de validación o error de escritura) se listan en la pantalla de resultado
- Alcance respetado: no se construyó detección de arete duplicado contra animales existentes (pedido explícitamente fuera de alcance para esta sesión)
- Code-splitting: `ImportAnimalsPage` se carga con `React.lazy`/`Suspense` porque `xlsx` agrega ~500kB al bundle — así el resto de la app (incluida la instalación inicial de la PWA) no paga ese costo

**Probado con un Excel de ejemplo real** (encabezados informales, no la plantilla oficial: "ID", "Sexo", "Nombre", "Raza", "Fecha Nac", "Madre", "Observaciones"): mapeo automático correcto de las 7 columnas, fila con solo arete+sexo importó igual, fila sin sexo y fila sin arete quedaron bloqueadas con su motivo sin afectar las demás, madre resuelta correctamente contra una fila hermana del mismo archivo, categoría autosugerida desde sexo+fecha de nacimiento. Verificado directamente contra IndexedDB en el navegador, no solo la UI.

**Build**: ✅ 3622 módulos, 0 errores.

#### Pendiente para Sesión 9
- **CRÍTICO — Verificar en Supabase**: confirmar que `019_fix_rls_all_tables.sql` se ejecutó, y ejecutar `020_weighings_method.sql`, `021_health_protocols.sql`, `022_health_events_extend.sql`
- **Pantalla Más (MorePage)**: rediseño con shadcn/ui — perfil, configuración de finca, cerrar sesión
- **Alertas de celo automáticas**: generar `possible_heat` cada 21 días tras último celo/servicio sin preñez confirmada (lógica en rules/reproduction.js o Supabase Edge Function)
- **Tests Vitest**: rules/reproduction.js, rules/categories.js, rules/weights.js, rules/health.js y rules/animalImport.js
- **PWA manifest**: actualizar `theme_color` a `#16a34a`
- **Eventos sanitarios grupales**: si se quiere exponer UI para tratar el hato completo de una vez, definir cómo `AnimalDetailPage` debe reflejar eventos sin `animal_id` (vía `health_event_animals`)
- **Detección de arete duplicado en importación masiva**: contra animales ya existentes en la finca (explícitamente descartado en Sesión 8)

### Sesión 7 — Completada (11 jul 2026)

**Módulo Pesajes**
- Tabla `weighings` ya existía desde Sesión 2 (migración `009_weighings.sql`) con RLS/triggers/índices completos; se agregó columna `method` (`bascula` | `cinta`) vía `supabase/migrations/020_weighings_method.sql`
- `WeightFormPage` (`src/features/weights/WeightFormPage.jsx`): formulario react-hook-form+zod — selector de animal (todos, no solo hembras), fecha (no futura), peso en kg (>0), método báscula/cinta, observaciones. Soporta `?animalId=` preseleccionado. Sigue el mismo patrón de escritura Dexie→enqueue→runSync que MilkFormPage/ReproEventForm
- Ruta `/registrar/peso` agregada en `App.jsx`; `RegisterSheet` ya apuntaba ahí desde antes (i18n `register.weight`)
- **GDP** usa `calcGDP()` de `rules/weights.js` (ya existente, sin cambios de lógica) — se calcula tanto para el resumen "Último pesaje" como por cada fila del historial (comparando contra el pesaje anterior cronológico)
- `AnimalDetailPage` pestaña Peso: agregada gráfica de evolución de peso (Recharts `LineChart`, verde `#16a34a`, mismo estilo que `MilkDashboard`) y el historial ahora muestra fecha, peso, método, GDP y observaciones por registro (antes solo mostraba fecha+peso)
- No se tocó `db.js` — la tabla `weighings` ya estaba en el schema Dexie desde Sesión 1/2; `method` no necesita índice porque no se consulta por ese campo

**Build**: ✅ 3608 módulos, 0 errores. Verificado en navegador (dev server) que la app carga sin errores de consola y el guard de rutas privadas funciona; no se pudo probar el flujo autenticado completo (sin credenciales de sesión en este entorno)

**Nota de convención**: los formularios de Ordeño/Reproducción/Pesajes/Sanidad usan strings en español hardcodeados (no i18next) pese a la regla 6 de este archivo — es la convención real ya establecida en el código (`milk.json`/`health.json` existen pero no se usan en ningún componente). Se mantuvo consistencia con el patrón existente en vez de introducir i18n solo en un módulo.

**Fix PWA — actualización no llegaba a la app instalada**
- Causa raíz: `registerType: 'autoUpdate'` combinado con el script de registro auto-inyectado (`injectRegister: 'auto'`) nunca importaba `virtual:pwa-register`, así que el "autoUpdate" real de vite-plugin-pwa nunca se activaba. El service worker nuevo quedaba en estado `waiting` indefinidamente porque el ciclo de vida estándar exige cerrar *todas* las instancias abiertas para activarlo — algo que casi nunca ocurre en una PWA instalada (queda suspendida, no cerrada)
- Fix: `registerType: 'prompt'` + `injectRegister: false` en `vite.config.js`, más `src/components/shared/PwaUpdatePrompt.jsx` (hook `useRegisterSW` de `virtual:pwa-register/react`, montado en `main.jsx`) que muestra un toast "Nueva versión disponible" → botón "Actualizar" llama `updateServiceWorker(true)` (skip waiting + reload)
- Verificado end-to-end con `vite preview` (build de producción real): build v1 cargado → rebuild v2 → `registration.update()` sin recargar la pestaña (simula PWA nunca cerrada) → `waiting: true` + toast visible → clic "Actualizar" → SW nuevo activo y bundle nuevo confirmado

**Dashboard — sección Pesajes**
- `HomePage.jsx`: sección "Pesajes" (mismo patrón visual que "Producción") con card de último pesaje y card de GDP promedio de los últimos 14 días
- `WeightHistoryPage.jsx` (`/pesajes`) nueva — historial de pesajes de toda la finca con GDP por registro, no existía antes (solo había historial por animal)

**Módulo Sanidad**
- **Deslinde con Reproducción** (pedido explícito): Reproducción cubre `heat/service/pregnancy_check/calving/abortion/dry_off` — ningún tipo de evento se solapa con Sanidad. Sanidad cubre salud general: vacuna, desparasitación, tratamiento, cirugía, revisión veterinaria, enfermedad, otro. Sin duplicación.
- **Esquema existente reutilizado**: la tabla `health_events` ya existía desde Sesión 2 (`010_health_events.sql`) con RLS/triggers/índices — se amplió el `check` de `type` (agregando `surgery` y `checkup`, se mantuvo `illness` por compatibilidad) y se agregaron columnas `protocol_id` y `cost` vía `022_health_events_extend.sql`. Igual que con Pesajes, se usó `account_id`/`farm_id` (no `tenant_id`) para seguir la regla de arquitectura #1
- **Tabla nueva `health_protocols`** (`021_health_protocols.sql`): catálogo de protocolos sanitarios por finca (nombre, tipo, periodicidad en días opcional, notas), RLS igual al resto de tablas, trigger `updated_at`
- **`ProtocolsPage.jsx`** (`/protocolos`, enlazada desde `MorePage`): CRUD del catálogo — lista + Dialog crear/editar + Dialog confirmar eliminar (soft delete)
- **`HealthEventFormPage.jsx`** (`/registrar/salud`): selector de animal, tipo de evento (grid como `ReproEventForm`), selector opcional de protocolo (filtrado por tipo) que autocompleta producto y sugiere próxima dosis vía `calcNextDueDate()` de `rules/health.js`, dosis, costo (≥0), veterinario, observaciones. Validación de fecha no futura
- **Alertas de próxima dosis**: si `next_due_date` queda definida, se crea una alerta reutilizando el sistema existente — `type: 'health_due'` (ya estaba en el `check` de `alerts` y en `ALERT_CONFIG`/`ALERT_EMOJI` de `AlertsPage`/`HomePage` desde antes, solo faltaba quien la generara) con `source_table`/`source_id` apuntando al evento. No se creó ningún sistema paralelo
- **`AnimalDetailPage.jsx`** pestaña Sanidad: mismo patrón que Peso — resumen "Último evento" + historial con tipo/emoji, producto, dosis, veterinario, costo, próxima dosis y observaciones por registro
- **`HealthHistoryPage.jsx`** (`/salud`): historial completo de la finca, filtrable por tipo de evento (chips), mismo patrón que `WeightHistoryPage`
- **`HomePage.jsx`** sección "Sanidad": card de próxima dosis pendiente (alerta `health_due` más próxima) + conteo de eventos de los últimos 30 días
- **Fuera de alcance / nota para Sesión 8**: `health_events` ya soportaba eventos grupales (`group_label` + tabla `health_event_animals`, usada en el seed para "Hato completo") antes de esta sesión. El nuevo formulario registra un evento por animal (igual que Ordeño/Reproducción/Pesajes) — no se construyó UI para eventos por lote. La pestaña Sanidad de `AnimalDetailPage` solo lee `health_events.animal_id`, por lo que eventos grupales sin `animal_id` no aparecerían ahí (limitación preexistente, no introducida en esta sesión)
- No hubo ambigüedad que requiriera desviarse del alcance pedido — el sistema de alertas resultó directamente reutilizable sin cambios

**Build**: ✅ 3616 módulos, 0 errores. Verificado en navegador (dev server) que la app carga sin errores de consola; no se pudo probar el flujo autenticado completo (sin credenciales de sesión en este entorno)

#### Pendiente para Sesión 8
- **CRÍTICO — Verificar en Supabase**: confirmar que `019_fix_rls_all_tables.sql` se ejecutó, y ejecutar `020_weighings_method.sql`, `021_health_protocols.sql`, `022_health_events_extend.sql`
- **Pantalla Más (MorePage)**: rediseño con shadcn/ui — perfil, configuración de finca, cerrar sesión
- **Alertas de celo automáticas**: generar `possible_heat` cada 21 días tras último celo/servicio sin preñez confirmada (lógica en rules/reproduction.js o Supabase Edge Function)
- **Tests Vitest**: rules/reproduction.js, rules/categories.js, rules/weights.js y rules/health.js
- **PWA manifest**: actualizar `theme_color` a `#16a34a`
- **Eventos sanitarios grupales**: si se quiere exponer UI para tratar el hato completo de una vez, definir cómo `AnimalDetailPage` debe reflejar eventos sin `animal_id` (vía `health_event_animals`)

### Sesión 6 — Completada (28 jun 2026)

#### Lo que está funcionando en producción (https://hato-smart.vercel.app)

**Auth y onboarding**
- Login, registro, confirmación de email, OnboardingWizard 3 pasos
- Función RPC `create_account_and_farm` con SECURITY DEFINER crea account + farm + membership
- PrivateRoute guarda rutas; rehydratación de sesión con pull al recargar página

**Sync bidireccional (Dexie ↔ Supabase)**
- `runSync()` en `engine.js`: push Dexie → Supabase; se llama fire-and-forget tras cada `enqueue()` en MilkFormPage, AnimalFormPage y ReproEventForm
- `pullFromSupabase(farmId)`: pull Supabase → Dexie; se llama en `setActiveFarm()` (farmStore) y en `loadFarmsForUser()` (sessionStore) al montar la app. Descarga 6 tablas con ventana de 90/180 días.
- `cleanPayload()` en engine.js elimina `sync_status`, `last_synced_at`, `client_id` del payload antes del upsert (campos Dexie-only que no existen en Supabase)
- Detección de rechazo silencioso de RLS: upsert con `.select('id')` verifica que `data.length > 0`; si está vacío el item queda en la cola sin marcar como synced
- Al volver online (`online` event), `useOnlineStatus` vacía la cola con `runSync()`
- Logs visibles: `[Sync] Pushing ...`, `[Sync] ✓ ... synced`, `[Sync] Pull complete — X animals, Y milk_records...`

**RLS (migración 019 — ejecutar en Supabase SQL Editor)**
- Políticas INSERT + SELECT + UPDATE para: animals, repro_events, milk_records, milk_individual, weighings, health_events, alerts
- Todas basadas en `farm_id IN (SELECT farm_id FROM memberships WHERE user_id = auth.uid())`
- memberships: SELECT para `user_id = auth.uid()`
- Archivo: `supabase/migrations/019_fix_rls_all_tables.sql`

**Módulos implementados**
- **Animales**: lista con búsqueda + filtros categoría, ficha individual (Tabs Info/Repro/Peso/Sanidad), formulario create/edit con foto a Storage, categoría auto-sugerida
- **Ordeño**: formulario AM/PM/Total, recuerda precio en localStorage; control de duplicados — Dialog de confirmación si ya existe registro para esa fecha+jornada; opción "Reemplazar" hace update (mismo UUID)
- **Reproducción**: 6 tipos de evento, crea alertas automáticas (pregnancy_check_due 45d, calving_due FPP), crea animal cría en parto
- **Alertas**: agrupadas HOY/ESTA SEMANA/PRÓXIMAMENTE, acciones marcar/descartar, badge en BottomNav

**Dashboard y reactividad**
- `HomePage` usa `useLiveQuery` (no useEffect+useState) → se actualiza automáticamente cuando el pull escribe en Dexie
- `AnimalListPage` y `AlertsPage` también usan `useLiveQuery`
- `MilkDashboard`: lógica correcta AM/PM vs Total — si existe registro `session='total'` usa solo ese; si no, suma am+pm. Nunca mezcla ambos en la misma suma

**Design system (shadcn/ui pattern)**
- Dependencias: lucide-react, sonner, class-variance-authority, clsx, tailwind-merge, tailwindcss-animate, @radix-ui/react-slot, @radix-ui/react-tabs, @radix-ui/react-avatar, @radix-ui/react-dialog
- Componentes en `src/components/ui/`: Button (cva, spinner), Card, Badge (repro variants), Input (forwardRef), Avatar, Tabs, Skeleton, EmptyState (SVG illustrations), Dialog
- Fuente Inter (Google Fonts), CSS vars HSL en `src/index.css`
- Logo real (`/apple-touch-icon.png`) en AppLayout, LoginPage y SignupPage
- BottomNav: iconos `Beef` (animales), `Home`, `Bell`, `MoreHorizontal`; FAB central 56px; badge alertas en tiempo real

**Build**: ✅ 3606 módulos, 0 errores

#### Pendiente para Sesión 7
- **CRÍTICO — Ejecutar en Supabase**: migración `019_fix_rls_all_tables.sql` si no se ha ejecutado
- **Módulo Pesajes**: WeightFormPage + historial en AnimalDetailPage pestaña Peso
- **Módulo Sanidad**: HealthEventForm + lista en AnimalDetailPage pestaña Sanidad
- **Pantalla Más (MorePage)**: rediseño con shadcn/ui — perfil, configuración de finca, cerrar sesión
- **Alertas de celo automáticas**: generar `possible_heat` cada 21 días tras último celo/servicio sin preñez confirmada (lógica en rules/reproduction.js o Supabase Edge Function)
- **Tests Vitest**: rules/reproduction.js y rules/categories.js
- **PWA manifest**: actualizar `theme_color` a `#16a34a`
- **Prompt de inicio de sesión**: guardar resumen del estado actual como primer mensaje para retomar contexto en nuevo chat

### Sesión 4 — Completada (28 jun 2026)
- **Motor de sync**: pullFromSupabase(farmId) en engine.js descarga 6 tablas (animals, repro_events, milk_records, weighings, health_events, alerts) de Supabase → Dexie con bulkPut. Se llama automáticamente desde farmStore.setActiveFarm vía dynamic import (evita circular dep).
- **categories.js**: corregido para retornar valores del schema DB: calf (ambos sexos <6m), heifer, cow, young_bull (<24m macho), bull, steer. Antes retornaba calf_female/calf_male y steer para jóvenes.
- **AnimalListPage**: lista animales de Dexie con buscador por arete/nombre/código, filtros por categoría, tarjetas con avatar emoji, edad calculada, badge de repro_status. FAB verde "+".
- **AnimalDetailPage**: header con foto/emoji, nombre, arete, edad. Tabs Info|Repro|Peso|Sanidad. GDP calculado. FPP desde último evento. Botones rápidos → ReproEventForm con animal preseleccionado.
- **AnimalFormPage**: react-hook-form+zod, categoría auto-sugerida por suggestCategory(), selector madre (hembras de Dexie), foto → Supabase Storage (animal-photos/), modo edición con reset(existing).
- **MilkFormPage**: selector AM/PM/Total (botones grandes), inputs numéricos xl, recuerda último precio en localStorage (hs_last_price_per_liter).
- **MilkDashboard**: embebido en HomePage (solo fincas dairy/dual), gráfica barras 14 días (Recharts, hoy en verde), métricas hoy y promedio 7d.
- **ReproEventForm**: 6 tipos de evento con íconos. service → crea alert pregnancy_check_due (45d) + calving_due (FPP) + repro_status='served'. calving → crea cría con mother_id, redirige a editar cría. pregnancy_check+pregnant → repro_status='pregnant'. dry_off → cancela alertas calving, repro_status='dry'.
- **AlertsPage**: alertas pendientes de Dexie, agrupadas por tipo con color/emoji, badge días restantes (rojo si vencida, naranja ≤7d), acciones marcar/descartar. calving_due → abre ReproEventForm.
- **BottomNav**: badge rojo con conteo de alertas pendientes via useLiveQuery.
- **App.jsx**: nuevas rutas: /animales, /animales/nuevo, /animales/:id, /animales/:id/editar, /ordeño, /registrar/repro.
- **RegisterSheet**: navega a rutas reales (/ordeño, /registrar/repro, etc.).
- **HomePage**: MilkDashboard embebido, quick links apuntan a /ordeño y /animales/nuevo.
- **SignupPage**: eliminados console.log de diagnóstico.
- Build: ✅ 1262 módulos, 0 errores.

### Pendiente para Sesión 5
- Crear función RPC create_account_and_farm en Supabase SQL Editor:
  - Parámetros: p_account_name, p_farm_name, p_farm_commercial_name, p_orientation, p_currency
  - Inserta accounts + farms + memberships con SECURITY DEFINER
  - Retorna { account_id, farm_id }
- Ejecutar migración 018_fix_accounts_insert_policy.sql en SQL Editor
- Módulo Pesajes: WeightFormPage + historial en AnimalDetailPage (pestaña Peso)
- Módulo Sanidad: HealthEventForm + lista en AnimalDetailPage (pestaña Sanidad)
- Alertas de celo automáticas: cron/job que genera possible_heat cada 21 días tras último celo/servicio si no hay preñez
- Inventario: módulo básico para insumos (medicamentos, leche reemplazadora)
- Tests Vitest en rules/reproduction.js y rules/categories.js
- Quitar console.log de diagnóstico de OnboardingWizard una vez confirmado el flujo

### Sesión 3 — Completada (27 jun 2026)
- LoginPage: zod + supabase.auth.signInWithPassword, manejo de errores, routing post-login
- SignupPage: validación completa, supabase.auth.signUp, pantalla de confirmación de email
- OnboardingWizard: 3 pasos (nombre, orientación/moneda/tamaño, confirmación) → crea account+farm+membership en Supabase + seed demo
- FarmSelector: lista de fincas para usuarios multi-finca
- PrivateRoute: guarda rutas privadas, spinner de carga, redirige a /login o /onboarding
- HomePage: métricas reales de Dexie (litros, vacas ordeñadas, conteo por categoría, alertas próximas 15 días), empty states
- MorePage: logout funcional (signOut + limpiar stores + redirect)
- App.jsx: árbol completo de rutas público/guardado/privado
- Build: ✅ 453 módulos, 0 errores

### Fixes post-Sesión 3 (27 jun 2026)
- Input.jsx: agregado forwardRef para que RHF pueda leer valores del DOM
- LoginPage + SignupPage: reescritos con inputs HTML nativos (sin componente Input) para evitar problemas de forwardRef; labels en text-gray-300 visibles sobre fondo oscuro; logo solo texto "Hato"(blanco)+"Smart"(verde) sin imagen
- SignupPage: mode/reValidateMode 'onSubmit', schema con .min(1) explícito en todos los campos, requisitos de contraseña visibles en tiempo real (✓/✗), console.log de watch() y onSubmit para diagnóstico
- LoginPage: link "¿Olvidaste tu contraseña?" con alert stub
- OnboardingWizard: reemplazados INSERTs individuales por supabase.rpc('create_account_and_farm'); usa supabase.auth.getUser() en lugar del user del store
- Migración 018: política INSERT faltante en tabla accounts

### Pendiente para Sesión 4
- Crear función RPC create_account_and_farm en Supabase (SQL Editor):
  - Parámetros: p_account_name, p_farm_name, p_farm_commercial_name, p_orientation, p_currency
  - Inserta accounts + farms + memberships con security definer
  - Retorna { account_id, farm_id }
- Motor de sync: pull Supabase → Dexie al hacer login (para que el dashboard tenga datos reales)
- Módulo Animales: listado con filtros, ficha individual, formulario de creación
- Módulo Ordeño: formulario de registro diario (hato + individual por vaca)
- Módulo Reproductivo: registro de celo/servicio/preñez/parto
- Alertas: pantalla completa con marcar como hecha/descartada
- Quitar console.log de diagnóstico de SignupPage y OnboardingWizard una vez confirmado que el flujo funciona

### Sesión 2 — Completada (27 jun 2026)
- Supabase conectado: .env.local + cliente con validación de env vars
- 17 migraciones SQL: accounts, profiles, farms, memberships, animals, repro_events, milk_records, milk_individual, weighings, health_events, health_event_animals, alerts, audit_log, RLS, triggers, índices y seed demo
- all_migrations.sql consolidado para ejecutar en SQL Editor de Supabase
- Dexie v2: esquema espeja tablas remotas con sync_status/last_synced_at
- sessionStore: onAuthStateChange + init() llamado en App.jsx
- Build: ✅ 132 módulos, 0 errores

### Sesiones anteriores completadas
- **Sesión 1** — 14 jun 2026: PWA desplegada en https://hato-smart.vercel.app. 50 archivos. Logo y marca aplicados en cabecera. Esqueleto completo: Vite+React+Tailwind+PWA, rutas React Router, stores Zustand (session/farm/sync), Dexie v1, sync queue+engine, rules (reproduction, categories, weights), SyncBadge, AppLayout, páginas placeholder, i18n es-CO (5 namespaces). Build: ✅ 89 módulos, 0 errores.
