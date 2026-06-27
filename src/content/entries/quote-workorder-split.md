---
title: "Separé Quote de WorkOrder"
date: 2026-06-17
topics: ["architecture", "domain-modeling", "prisma", "database"]
type: "case-study"
phase: reconstruccion
featured: true
excerpt: "El diseño original unificaba cotización y orden de trabajo. Decidí dividirlas."
---

## Dos caminos posibles

El diseño original modelaba todo como una sola entidad `Cotizacion` con 10 estados:

```txt
BORRADOR → ENVIADA → APROBADA → EN_PROCESO → AJUSTE_FINAL
→ NOTA → PAGADA → PAGO_PARCIAL → FACTURADA → CANCELADA
```

La ventaja: trazabilidad simple. Todo —items, pagos, trabajos, nómina— apunta a la misma entidad. No hay joins entre tablas de "presupuesto" y "trabajo".

Pero cuando empecé a construir la app nueva, decidí lo contrario.

## Las entidades separadas

```prisma
model Quote {
  status    QuoteStatus // DRAFT, SENT, APPROVED, REJECTED, CANCELLED
  workOrder WorkOrder?  // 1:1 opcional
}

model WorkOrder {
  quoteId String @unique  // cada WorkOrder nace de una Quote
  status  WorkOrderStatus // PLANNED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
}
```

Una `WorkOrder` **siempre** nace de una `Quote` aprobada. Pero son entidades distintas con sus propios estados, sus propias relaciones y sus propias responsabilidades.

## El razonamiento

### 1. Responsabilidades distintas

Una cotización es un **documento comercial**. Precios, ítems, IVA, margen. Vive en el mundo de ventas.

Una orden de trabajo es un **documento operativo**. Asignación de empleados, ejecución, materiales consumidos. Vive en el mundo de producción.

Si las junto en una sola entidad, esa entidad acumula responsabilidades de dos dominios distintos. Cambiar reglas de cotización (ej. autorización parcial) no debería afectar el modelo de órdenes de trabajo.

### 2. Estados más simples

10 estados en una entidad vs 5 + 5 en dos entidades. La complejidad total es similar, pero cada entidad es más fácil de razonar por separado.

`QuoteStatus`: 5 estados de ciclo de venta.
`WorkOrderStatus`: 5 estados de ciclo de producción.

No mezclo lógica de "fue facturada" con "fue asignada". Son conceptos ortogonales.

### 3. Relaciones más claras

```prisma
WorkOrder → WorkAssignment → UserProfile
WorkOrder → ExecutionRecord
```

Si todo fuera `Cotizacion`, tendría:

```prisma
Cotizacion → WorkAssignment
Cotizacion → ExecutionRecord
Cotizacion → QuoteItem
Cotizacion → PaymentRequest
```

Una entidad con 4+ tipos de hijos distintos es difícil de mantener. Las relaciones se vuelven una bolsa.

## El costo de separar

- **Joins adicionales**: para obtener el historial completo de una cotización, necesito `Quote → WorkOrder → ExecutionRecord`. Con el modelo unificado era una sola tabla.
- **Sincronización de estados**: si cancelo una cotización, ¿qué pasa con su `WorkOrder`? Hay que definir cascadas explícitas.

Pero estos costos son menores comparados con la deuda de tener una entidad que es "todo".

## Lo que aprendí

> Una entidad no debería tener más de una responsabilidad. Si un registro representa dos conceptos distintos del negocio, eventualmente uno de los dos va a necesitar evolucionar y el otro va a pagar el costo.

Dividir Quote y WorkOrder fue la decisión correcta para este proyecto. No porque 10 estados sea "mucho", sino porque ventas y producción son dominios distintos que merecen modelos distintos.
