---
title: "El MVP en issues incrementales"
date: 2026-06-27
topics: ["architecture", "mvp", "workflow"]
type: "log"
phase: produccion
featured: false
excerpt: "Organicé el desarrollo en issues pequeños e incrementales, desde el schema hasta el deploy."
---

## La estrategia: issues incrementales

En vez de un gran PR con "la app", partí el MVP en issues atómicos. Cada issue:

- Un cambio acotado y revisable
- Una rama dedicada
- Un PR independiente

El orden no fue aleatorio. Cada issue desbloquea el siguiente.

## La secuencia real

### Fase 1 — Fundación (issues #1-#5)

1. **Schema de base de datos**: `Customer`, `Vehicle`, `Quote`, `QuoteItem`, `WorkOrder`, `WorkAssignment`, `ExecutionRecord`, `UserProfile`. Las entidades base sin lógica de negocio.
2. **Stack y tooling**: Next.js, Prisma, Tailwind, Supabase helpers, PWA básica. El proyecto compila, tiene estructura, pero no hace nada visible.
3. **Auth y sesión**: Login con Supabase, proxy de protección, `getCurrentUser`, `requireUser`. Ahora existe el concepto de "usuario autenticado".
4. **Passwords y bootstrap**: El admin puede gestionar sus credenciales. El perfil inicial se crea desde script.
5. **Clientes**: CRUD de clientes con búsqueda. Primer feature visible con UI real.

### Fase 2 — Operaciones (issues #7-#8, #30-#42)

6. **Cotizador**: Crear cotizaciones con secciones, conceptos, subtotales automáticos. Flujo completo con validación.
7. **Órdenes de trabajo**: Convertir cotización aprobada en orden de trabajo, asignar empleados, registrar ejecución.
8. **Diseño visual**: Tokens de Figma a Tailwind, tema claro/oscuro, componentes Radix, mobile-first.
9. **Payment requests**: Dominio independiente para solicitudes de pago con token, snapshots fiscales y constraints.
10. **Página pública de pago**: `/datos-de-pago/[token]` con captura de datos fiscales desde Figma.
11. **Deploy en Vercel**: Configuración de variables, migraciones, dominio, PWA.

Cada fase construye sobre la anterior. No podés hacer payment requests sin tener el dominio de Quote/WorkOrder. No podés deployar sin tener auth.

## Lo que aprendí sobre planificación

1. **Issues chicos, PRs chicos**. Un issue de 400 líneas se parte en 3 PRs encadenados. Más fácil de revisar, menos riesgo.
2. **Dependencias explícitas**: si un issue necesita otro, se documenta. No se asume.
3. **MVP no es "todo a medias"**: es el subconjunto mínimo que entrega valor real. Elegí qué features entran y cuáles quedan post-MVP.
4. **Documentar mientras se construye**: README, ARCHITECTURE.md, MVP_ISSUES.md se actualizan con cada issue. No al final.
