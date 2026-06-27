---
title: "Chained PRs: cómo partí un cambio grande en slices revisables"
date: 2026-06-24
topics: ["git", "pull-requests", "workflow"]
type: "log"
phase: produccion
featured: false
excerpt: "La implementación de payment requests superó las 400 líneas. En vez de un PR gigante, usé chained PRs para mantener el foco del revisor."
---

## El problema

La feature de payment requests —modelo, migración, dominio, acciones, schemas y tests— sumaba más de 400 líneas cambiadas. Un solo PR con todo eso es difícil de revisar bien.

## La solución: PRs encadenados

En vez de un PR monolítico, partí el trabajo en slices:

1. **PR #1**: Schema de Prisma + migración. Solo estructura de datos.
2. **PR #2**: Dominio y schemas Zod. Lógica de negocio pura.
3. **PR #3**: Server Actions e integración. La capa de frontera.

Cada PR era revisable en minutos, no en horas. El revisor ve un diff de ~150 líneas en vez de 500+.

## El concepto

> El límite no es cuánto código podés escribir. Es cuánto puede absorber un revisor en una sentada.

Un PR de 400 líneas revisado a las apuradas es peor que 3 PRs de 150 líneas revisados con atención. Los bugs se cuelan en los PRs grandes porque nadie los lee completos.

## Cómo funciona técnicamente

Usé **feature-branch-chain**:

```
feature/41-payment-requests  (tracker branch, acumula todo)
  ↑ feature/41-prisma-schema   (PR #1)
  ↑ feature/41-domain-logic    (PR #2, base = anterior)
  ↑ feature/41-server-actions  (PR #3, base = anterior)
```

Cada PR hijo apunta al PR anterior como base, no a `develop`. El diff que ve el revisor es solo lo nuevo. El tracker branch se mergea a `develop` al final.

Este flujo me obligó a pensar en dependencias: ¿qué necesita estar listo antes de qué? Eso mejora el diseño.
