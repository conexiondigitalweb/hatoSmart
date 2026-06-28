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

## Colores de marca
- Verde principal: #3dbf5e
- Azul oscuro: #2b3240
- Fondo claro: #f5f5f5

## Estado actual del proyecto
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
