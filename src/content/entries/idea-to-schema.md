---
title: "De una idea a un esquema de base de datos"
date: 2026-02-15
topics: ["database", "architecture", "prisma", "domain-modeling"]
type: "case-study"
phase: origen
featured: true
excerpt: "Pasé de un brief a un schema de Prisma con entidades, relaciones, constraints y un modelo de dominio real."
---

## El punto de partida

El proyecto arrancó con una idea clara pero sin estructura técnica: una app operativa para un taller de reparación de vehículos. Cotizaciones, órdenes de trabajo, asignación de empleados, registro de ejecución. El dominio era conocido, pero había que traducirlo a datos.

No empecé con código. Empecé con preguntas.

## Las preguntas que modelan datos

Antes de escribir una línea de Prisma, definí las entidades respondiendo:

- ¿Quién usa la app? → `UserProfile`
- ¿Para quién se trabaja? → `Customer`
- ¿Qué vehículo? → `Vehicle`
- ¿Qué se cotiza? → `Quote`
- ¿Qué incluye una cotización? → `QuoteItem`
- ¿Cómo se convierte en trabajo? → `WorkOrder`
- ¿Quién ejecuta? → `WorkAssignment` + `ExecutionRecord`
- ¿Cómo se paga? → `PaymentRequest` + `CustomerFiscalProfile`

## Decisiones de modelado que importaron

### Quote y WorkOrder como entidades separadas

El sistema legacy modelaba todo como una `Cotización` con 15 estados. Mi decisión fue separar:

- **`Quote`**: propuesta comercial. Vive en el mundo de ventas.
- **`WorkOrder`**: orden de trabajo operativa. Vive en el mundo de ejecución.

Relación: cada `WorkOrder` nace de una `Quote` aprobada (`quoteId` único y requerido).

Esto evita que el mismo registro acumule responsabilidades de venta Y ejecución. Si mañana cambia el flujo de cotización, no rompo las órdenes de trabajo.

### Roles vs clasificación laboral

`UserProfile` tiene dos conceptos distintos:

```prisma
role       UserRole   // ADMIN, ADMIN_ASSISTANT, WORKER → acceso a la app
workerKind WorkerKind? // MASTER, HELPER → clasificación operativa
```

El rol define qué puede hacer en el sistema. El `workerKind` define qué tipo de trabajo hace en el taller. Son cosas distintas y merecen campos distintos.

### Constraints a nivel base de datos

No confié solo en la lógica de aplicación. Usé constraints de PostgreSQL:

```sql
-- Un cliente no puede tener dos vehículos con la misma placa
@@unique([customerId, plate])

-- Un trabajador no puede estar asignado dos veces a la misma orden
@@unique([workOrderId, workerId])

-- Un cliente no puede tener dos perfiles fiscales con el mismo RFC
@@unique([customerId, taxId])

-- Índice parcial: una sola solicitud de pago activa por cotización
CREATE UNIQUE INDEX ON "PaymentRequest" ("quoteId")
  WHERE status IN ('PENDING','VIEWED','FISCAL_DATA_REQUIRED','READY_TO_PAY');
```

## Lo que aprendí

Modelar datos no es listar tablas. Es tomar decisiones de diseño que van a vivir años en producción:

1. **Separar responsabilidades** en entidades distintas desde el día uno.
2. **Constraints en la DB**, no solo en el código. La lógica de negocio se puede saltar. Un `UNIQUE` de PostgreSQL no.
3. El esquema inicial define la flexibilidad futura. Si Quote y WorkOrder estuvieran unidos, hoy no podría evolucionar el flujo de pago sin arrastrar deuda del legacy.
