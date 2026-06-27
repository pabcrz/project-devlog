---
title: "El patrón ledger: por qué no usé un campo 'saldo'"
date: 2026-06-19
topics: ["architecture", "database", "domain-modeling"]
type: "case-study"
featured: false
excerpt: "Para registrar pagos y adeudos de clientes, un campo `saldo` parece lo obvio. Pero modelé un ledger de movimientos signados. Explico el trade-off."
---

## El problema

En un taller mecánico, los clientes no siempre pagan el total exacto de una cotización. Pueden:

- Pagar parcialmente ("te doy $5000 y la próxima semana el resto")
- Dejar un ajuste ("redondéame a $2000")
- Tener deudas cruzadas (deben de dos trabajos distintos y pagan una cantidad que no cubre ninguno completo)
- Recibir créditos o ajustes administrativos

Un campo `saldo` en la tabla `Customer` no soporta esto. ¿Cómo sabés a qué cotización se aplicó qué pago? ¿Cómo rastreás un ajuste de $50 que el dueño autorizó verbalmente?

## La solución: ledger de movimientos signados

En lugar de un campo `saldo`, modelé movimientos:

```
MovimientoCuenta
├── tipo: CARGO_COTIZACION | ABONO_PAGO | AJUSTE
├── importe: positivo o negativo
├── cotizacionId: a qué cotización pertenece
└── fecha
```

Cada cotización genera un cargo. Cada pago genera un abono. Los ajustes son movimientos con tipo `AJUSTE`.

La "deuda" de un cliente no es un campo. Es la suma de todos sus movimientos:

```sql
SELECT SUM(monto) FROM MovimientoCuenta WHERE clienteId = ?
```

## Aplicación de pagos con FIFO

Cuando un cliente paga $3000 y debe de dos cotizaciones ($2000 y $1500), ¿a cuál se aplica el pago?

El modelo usa **FIFO con override manual**:

```prisma
model AplicacionMovimiento {
  movimientoId String   // el abono
  cargoId      String   // el cargo al que se aplica
  monto        Decimal  // cuánto de ese abono cubre este cargo
}
```

Por defecto, el sistema aplica el pago a los cargos más antiguos primero (FIFO). Pero el admin puede sobrescribir manualmente: "aplicá estos $3000 completos a la cotización más reciente".

## Por qué no un campo `saldo`

Un campo `saldo` en `Customer` o en `Cotizacion`:

- ❌ No permite rastrear **quién** pagó **cuándo** ni **cómo**.
- ❌ Se vuelve inconsistente con ajustes manuales.
- ❌ No soporta pagos que cubren múltiples cotizaciones.
- ❌ Perdés el historial si corregís un error.

Un ledger:

- ✅ Cada movimiento es inmutable. Los errores se corrigen con movimientos de ajuste, no editando registros.
- ✅ El "saldo actual" es una consulta, no un campo. Siempre es derivable.
- ✅ Auditoría completa: sabés exactamente qué pasó con cada centavo.

## El costo

- **Más complejidad de queries**: obtener el saldo requiere `SUM` y `GROUP BY`, no `SELECT saldo`.
- **Más tablas**: `MovimientoCuenta` + `AplicacionMovimiento` vs un campo en `Customer`.
- **UI más compleja**: mostrar el estado de cuenta requiere renderizar un historial, no solo un número.

Pero para el dominio real del taller —con pagos irregulares, ajustes frecuentes y clientes recurrentes— el ledger es la opción correcta.

## Lo que aprendí

> Un campo `saldo` es tentador porque es simple. Pero si el dominio tiene pagos parciales, ajustes y deudas cruzadas, un ledger de movimientos es la única forma de mantener integridad.

Modelar para el caso feliz ("el cliente paga el total exacto") es fácil. Modelar para el caso real ("el cliente paga $5000 de un trabajo que costó $5200 y además debe $800 de otro") es lo que separa un sistema que escala de uno que se rompe en producción.
