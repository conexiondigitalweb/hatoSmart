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
### Sesión 2 — Pendiente
(por definir)

### Sesiones anteriores completadas
- **Sesión 1** — 14 jun 2026: Esqueleto completo. 50 archivos creados. Vite+React+Tailwind+PWA, rutas React Router, stores Zustand (session/farm/sync), lib/db.js (Dexie v1), lib/sync/ (queue+engine), lib/rules/ (reproduction, categories, weights), SyncBadge, AppLayout, páginas placeholder para todas las rutas, i18n es-CO (5 namespaces). Build: ✅ 89 módulos, 0 errores. PWA desplegada en Vercel: https://hato-smart.vercel.app
