---
title: "Arquitectura de solicitudes de pago independientes"
date: 2026-06-24
topics: ["architecture", "domain", "database"]
type: "case-study"
featured: true
excerpt: "Cómo diseñé un dominio de solicitudes de pago separado de la aceptación de cotizaciones, usando transacciones, snapshots fiscales y prevención de duplicados."
---

## Contexto

El flujo de pagos necesitaba ser independiente de la aceptación de una cotización. No alcanzaba con decir "el cliente aceptó, ahora que pague". Había que manejar links de pago con token único, preferencias de facturación y datos fiscales snapshotteados por solicitud.

## Decisión de modelo

Creé dos modelos nuevos en lugar de acoplar todo a `Quote`:

- **`PaymentRequest`**: solicitud de pago con token único, estado, expiración y snapshot fiscal.
- **`CustomerFiscalProfile`**: perfil fiscal reutilizable del cliente (RFC, razón social, etc.), pero snapshotteado al momento de la solicitud para mantener integridad histórica.

### ¿Por qué snapshot y no relación viva?

Si el cliente cambia su razón social mañana, el comprobante fiscal de hoy no debería cambiar. El snapshot congela los datos al momento de la solicitud. La relación con `CustomerFiscalProfile` queda como referencia administrativa, no como fuente del comprobante.

## Restricciones a nivel base de datos

Usé índices parciales únicos en PostgreSQL para evitar solicitudes activas duplicadas:

```sql
CREATE UNIQUE INDEX ON "PaymentRequest" ("quoteId")
  WHERE status IN ('PENDING','VIEWED','FISCAL_DATA_REQUIRED','READY_TO_PAY');
```

Esto no se puede expresar en schema de Prisma, así que lo agregué en la migración SQL. Prisma lo ignora sin generar drift.

## Estados y transiciones

```txt
PENDING → VIEWED → (FISCAL_DATA_REQUIRED ↔ READY_TO_PAY) → completado
                  ↘ EXPIRED
                  ↘ CANCELLED
```

- `VIEWED` se marca automáticamente al abrir el link.
- `FISCAL_DATA_REQUIRED` salta si el cliente marcó "requiere factura" pero no completó datos fiscales.
- La expiración se fuerza en runtime al consultar por token.

## Resultado

El dominio quedó autocontenido: recibe token o IDs externos, valida, opera y responde. La capa de Server Actions (`actions.ts`) solo maneja auth, sin reglas de negocio.

Concepto importante aplicado: **separar el modelo de datos del flujo de UI**. La cotización y el pago son procesos distintos. Merecen dominios distintos.
