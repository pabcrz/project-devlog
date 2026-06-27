---
title: "Separación visual de roles: badges como contrato, no como condicionales"
date: 2026-06-19
topics: ["architecture", "design", "react", "typescript"]
type: "log"
phase: reconstruccion
featured: false
excerpt: "Qué ve cada rol en la UI no debería decidirse con if/else en el componente. Modelé badges tipados contra enums de Prisma para que la separación sea estructural."
---

## El problema

La app tiene tres roles con visibilidad distinta:

| Rol | Ve finanzas | Ve operaciones |
|---|---|---|
| Admin | ✅ Todo | ✅ Todo |
| Empleado | ❌ Nada | ✅ Sus trabajos |
| Cliente | ✅ Solo lo propio | ✅ Su cotización |

Un empleado NO debe ver montos, pagos ni saldos del cliente. Pero sí debe ver en qué estado está su trabajo asignado.

Si resuelvo esto con `if (role === 'ADMIN')` en cada componente, tengo un problema de mantenimiento cada vez que agrego un badge nuevo.

## La solución: componentes tipados contra el dominio

En lugar de condicionales por rol, modelé la visibilidad como **componentes distintos**:

### `QuoteOperationalBadge`

Mapea `QuoteStatus` a etapas operativas. Visible para todos los roles.

```tsx
// DRAFT → "Borrador"
// APPROVED → "Aprobada"
// IN_PROGRESS → "En proceso"
```

### `QuoteFinancialBadges`

Muestra `PaymentStatus` + estado de facturación. Solo para Admin y Cliente.

```tsx
// PAID → badge verde "Pagada"
// PARTIAL → badge amarillo "Pago parcial"
// PENDING → badge gris "Pendiente"
```

### El contrato

Ambos componentes reciben el mismo objeto `Quote` del backend. Pero:

- `QuoteOperationalBadge` se renderiza siempre.
- `QuoteFinancialBadges` se renderiza condicionalmente a nivel de layout (según ruta/rol), no a nivel de componente.

El componente no pregunta "¿qué rol sos?". Simplemente existe o no en el árbol.

## Por qué esto es mejor que if/else

**if/else en cada badge:**

```tsx
{role === 'ADMIN' && <PaymentBadge />}
{role === 'ADMIN' && <AmountBadge />}
```

Si mañana agrego un tercer badge financiero, tengo que acordarme de poner el condicional en todos lados. Y si cambia la regla ("ahora los empleados SÍ ven el total de su trabajo"), tengo que buscar todos los `if (role)`.

**Componentes separados con contrato de layout:**

```tsx
// Layout admin
<QuoteCard>
  <QuoteOperationalBadge />
  <QuoteFinancialBadges />
</QuoteCard>

// Layout empleado
<QuoteCard>
  <QuoteOperationalBadge />
  {/* Sin badges financieros */}
</QuoteCard>
```

La decisión de qué se muestra vive en el layout, no en el componente. El layout conoce el rol. El componente solo conoce el dato.

## Tipado contra Prisma enums

Los badges usan los enums de Prisma como fuente de verdad:

```ts
import { QuoteStatus, PaymentStatus } from "@prisma/client";

const STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  SENT: "Enviada",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
};
```

Si agrego un nuevo estado en Prisma, TypeScript me obliga a agregar su label en el Record. UI y DB no pueden divergir.

## Lo que aprendí

1. **La visibilidad por rol es una decisión de arquitectura, no de UI**. Modelala en componentes, no en condicionales.
2. **Tipar contra enums de Prisma** elimina una clase entera de bugs de divergencia UI-DB.
3. Separar badges operativos de financieros desde el principio es más barato que intentar separarlos después con un refactor cross-cutting.
