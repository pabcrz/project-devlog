---
title: "El hard reset: por qué tiré el primer repo y empecé de cero"
date: 2026-04-23
topics: ["architecture", "workflow", "decision"]
type: "case-study"
featured: true
excerpt: "El primer repo de SEBASAM llevaba meses de desarrollo, pero se volvió inmantenible. Tomé la decisión de hacer hard reset y contar la historia."
---

## El repo original

El proyecto no empezó con `sebasam-app`. Empezó con un repo llamado `sebasam` en febrero de 2026. Next.js, Supabase, Prisma, Vercel — el stack era el mismo de ahora.

Pero pasó algo que le pasa a muchos proyectos:

> Funcionaba, pero no entendía por qué.

Había componentes y funciones que no sabía para qué servían. Cosas mal ubicadas. "Cochinero", en mis palabras de ese momento. Problemas recurrentes como la URL de cotización que no funcionaba en deploy y nadie sabía exactamente dónde estaba la lógica que la generaba.

## El momento del reset

El 23 de abril de 2026 tomé la decisión:

> "Hard reset. Eliminar complejidad/basura y reiniciar limpio con control."

No fue una decisión técnica. Fue una decisión de **propiedad del código**. Si yo no podía explicar qué hacía cada archivo, ese archivo no debía existir.

Las reglas del reset:

1. El README debía ser la fuente de verdad del modelo de dominio.
2. Nada de abstracciones sin propósito explícito.
3. Cada componente, cada función, cada archivo debía tener una razón clara de existir.
4. TypeScript estricto. Si algo no estaba tipado, no entraba.

## Lo que pasó entre abril y junio

Abril-mayo no fueron meses perdidos. En el repo original:

- Se definió el modelo de dominio centrado en `Cotizacion` como eje.
- Se implementó `CotizacionEvento`: timeline append-only con soft-void (anulación sin borrar).
- Se trabajó el catálogo de empleados y los session guards.
- Reforcé TypeScript. Venía de JS y quería dominar tipado estático.

Pero el repo seguía cargando deuda. Cada feature nueva arrastraba código viejo que no se entendía del todo.

El 10 de junio se tomó la decisión arquitectónica final:

> "Separar el cotizador en repositorios independientes que funcionen por sí mismos."

No un monolito. Repos separados: landing, app operativa, posiblemente más.

## El nacimiento de sebasam-app

El 16 de junio se creó `migration-basics`: un paquete de documentación que extraía el conocimiento de negocio del repo original. Nada de código — solo el modelo conceptual.

De ahí se identificaron los dominios:

- **Quote**: propuesta comercial
- **WorkOrder**: orden de trabajo operativa
- **Ledger**: movimientos de cuenta del cliente
- **Payroll**: nómina semanal
- **Inventory**: inventario especializado
- **Evidence**: evidencias y fotos
- **Public Access**: link tokenizado para cliente

Ese mismo día se bootstrapeó `sebasam-app`. Desde cero. Sin deuda.

## Lo que aprendí

1. **Hard reset no es fracaso**. Es admitir que el aprendizaje generó deuda y que reescribir con conocimiento es más rápido que parchar sin entender.

2. **Extraer el conocimiento antes de tirar el código**. `migration-basics` preservó el modelo de negocio. El código se fue, pero lo que aprendí sobre el dominio se quedó.

3. **La velocidad post-reset es real**. En 11 días (junio 16-27), `sebasam-app` avanzó más que el repo original en meses. Porque cada decisión ya estaba probada y cada error ya estaba cometido.

4. **El TypeScript que reforcé en mayo fue la base de todo junio**. Sin ese mes de práctica, el schema de Prisma, los enums tipados y los contratos UI-DB no habrían salido igual.

El hard reset de abril fue la mejor decisión técnica del proyecto. No porque el código viejo fuera malo — era código de alguien aprendiendo. El problema era que ese alguien ya no era la misma persona.
