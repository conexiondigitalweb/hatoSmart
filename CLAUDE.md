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
- Posible celo = último celo o servicio + 21 días (solo si no hay preñez confirmada)
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
        └── dashboard/
```

## Colores de marca (design system actual)
- Verde marca: #16a34a  (brand-green en Tailwind)
- Verde oscuro: #14532d (brand-dark)
- Acento ámbar: #d97706 (brand-accent)
- Fondo: var(--background), tarjetas: var(--card), texto: var(--foreground)
- (Colores anteriores #3dbf5e / #2b3240 / #f5f5f5 reemplazados completamente en Sesión 5)

## Estado actual del proyecto
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
