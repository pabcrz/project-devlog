---
title: "Stack inicial: por qué Next.js, Prisma y Supabase"
date: 2026-06-16
topics: ["architecture", "nextjs", "prisma", "supabase", "typescript"]
type: "case-study"
featured: false
excerpt: "Las decisiones de tecnología inicial del proyecto y el razonamiento detrás de cada una."
---

## Las opciones sobre la mesa

Al arrancar un proyecto nuevo desde cero, la pregunta no es "¿qué sé usar?" sino "¿qué resuelve mejor este problema específico?".

Para una app operativa de taller —admin panel con login, formularios complejos, móvil— evalué:

| Necesidad | Opción elegida | Alternativas descartadas |
|---|---|---|
| Frontend/Fullstack | Next.js App Router | Remix, SvelteKit, Laravel |
| Base de datos | PostgreSQL + Prisma | Raw SQL, Drizzle, Sequelize |
| Auth | Supabase Auth | NextAuth, Clerk, Firebase Auth |
| Estilos | Tailwind CSS v4 | CSS Modules, Styled Components |
| Hosting | Vercel + Supabase | Railway, Fly.io, Docker/VPS |
| Testing | Vitest + Testing Library | Jest, Playwright |

## ¿Por qué Next.js y no otra cosa?

- **App Router + Server Components**: la app es mayormente admin panel. Muchas pantallas son solo lectura que puedo resolver completamente en servidor sin JS en el cliente.
- **Server Actions**: formularios de creación/edición sin necesidad de API routes manuales. El patrón `"use server"` mantiene el código de feature autocontenido.
- **Estabilidad**: Next 16 ya maduró el modelo de App Router. No es la versión experimental de hace 2 años.

Lo que NO usé: `pages/` router, `getServerSideProps`, API routes sueltas. App Router es el camino forward.

## ¿Por qué Prisma?

- **Type safety**: el schema de Prisma genera tipos TypeScript automáticamente. Si cambio una columna, el compilador me grita en todos lados donde se usa.
- **Migraciones**: `prisma migrate dev` gestiona el historial de cambios de schema. No hay SQL manual suelto.
- **`$transaction`**: para operaciones que requieren atomicidad (crear payment request + validar que no haya duplicado activo).

Lo que sacrifico con Prisma: no puedo expresar índices parciales de PostgreSQL en el schema. Pero los agrego en la migración SQL y Prisma los respeta sin drift.

## ¿Por qué Supabase?

Supabase me da dos cosas:

1. **Auth gestionado**: login, sesiones, cookies. No tengo que implementar hash de passwords ni manejo de tokens.
2. **PostgreSQL gestionado**: con pooler para serverless (conexiones limitadas) y connection string separada para migraciones.

Separación importante:

```env
DATABASE_URL=postgresql://...pooler...?pgbouncer=true&connection_limit=1  # runtime serverless
DIRECT_URL=postgresql://...session...:5432/postgres                       # migraciones
```

La app usa `DATABASE_URL` para consultas. Las migraciones usan `DIRECT_URL`. Esto evita problemas de conexión en Vercel con serverless functions.

## Lo que aprendí

Elegir stack no es un concurso de popularidad. Es alinear cada herramienta con el problema real:

- ¿App mayormente admin? → Server Components ahorran JS innecesario.
- ¿Necesito type safety en DB? → Prisma sobre raw SQL.
- ¿Auth y DB gestionado? → Supabase sobre implementación manual.
- ¿Quiero deploy simple? → Vercel + pnpm + build automático.

Y una decisión que parece chica pero importa: **pnpm** sobre npm. El lockfile de pnpm es determinista y Vercel lo detecta automáticamente.
