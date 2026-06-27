---
title: "La evolución del schema de Prisma: 10 migraciones, 0 rollbacks"
date: 2026-06-17
topics: ["database", "prisma", "architecture", "domain-modeling"]
type: "case-study"
featured: true
excerpt: "Cómo arrancó el schema de base de datos, qué decisiones cambiaron entre migraciones y qué aprendí sobre modelar con Prisma y PostgreSQL."
---

## Migración #0: el problema antes del código

El taller operaba sin sistema. Cotizaciones en PDF, pagos por WhatsApp, nómina calculada a mano. Tres dolores concretos:

1. No había **historial** de clientes ni cotizaciones. Si un cliente preguntaba "¿cuánto me cobraste la vez pasada?", había que buscar archivos.
2. Los **datos de pago** se dictaban por teléfono. CLABEs, montos, referencias — todo de palabra.
3. La **nómina semanal** usaba reglas de porcentaje implícitas que solo estaban en la cabeza del dueño.

El objetivo: una app que reemplace esos tres dolores.

## Migración #1: el schema inicial

La primera versión del schema (`20260617000000_init`) definió 6 entidades y 6 enums:

```prisma
enum UserRole    { ADMIN, COORDINATOR, WORKER }
enum QuoteStatus { DRAFT, SENT, APPROVED, REJECTED, CANCELLED }
// ...más enums
```

**Entidades**: `UserProfile`, `Customer`, `Quote`, `QuoteItem`, `WorkOrder`, `WorkAssignment`, `ExecutionRecord`.

Una decisión explícita desde el día uno: **Quote y WorkOrder como entidades separadas**. La cotización es el documento comercial; la orden de trabajo es el documento operativo. Cada una con sus propios estados.

Lo que NO estaba en esta primera migración:
- Sin `Vehicle` (las unidades del cliente)
- Sin `CustomerFiscalProfile` ni `PaymentRequest`
- Sin `username` en UserProfile (solo email)
- Sin `workerKind` (la clasificación MASTER/HELPER)
- Sin `taxEnabled` ni `validUntil` en Quote

## Migración #2: perfiles y roles

La segunda migración (`20260617040000`) refinó `UserProfile` basado en el uso real de la app:

- **Se agregó `username`**: el login usa username, no email. El email se deriva internamente (`username@sebasam.local`).
- **`COORDINATOR` se renombró a `ADMIN_ASSISTANT`**: más claro semánticamente. Un coordinador es un admin asistente, no un rol distinto.
- **Se agregó `workerKind`**: separa el acceso a la app (`role`) de la clasificación laboral (`MASTER` o `HELPER`). Un usuario puede ser `WORKER` en rol pero `MASTER` en clasificación.

Esto fue un refinamiento basado en entender mejor el dominio, no un cambio de arquitectura. Los buenos schemas no nacen perfectos; nacen funcionales y mejoran con el uso.

## Migración #3–#5: vehículos

Entre migraciones 3 y 5, el modelo de `Vehicle` tomó forma:

- Se agregó `Vehicle` como entidad separada vinculada al `Customer`
- La placa (`plate`) pasó de requerida a opcional (no todos los vehículos tienen placa visible)
- Se agregó `@@unique([customerId, plate])` para evitar duplicados

Y en `Quote` se agregó `vehicleId` opcional. Una cotización puede o no estar asociada a un vehículo.

Reflexión: el diseño de `Vehicle` pasó por 3 migraciones. Si hubiera intentado clavarlo perfecto en la primera, probablemente habría tardado el doble y el resultado sería peor. Iterar el schema es natural.

## Migración #6–#7: payment requests

La feature más compleja hasta ahora agregó `PaymentRequest` y `CustomerFiscalProfile` (migración `20260624053009`):

- Una `PaymentRequest` se vincula a una `Quote` O a un `WorkOrder`, nunca a ambos (validado con CHECK en BD).
- El snapshot fiscal congela los datos al momento de la solicitud — si el cliente cambia su razón social, el comprobante viejo no se altera.
- Índice parcial único para evitar solicitudes activas duplicadas.

Pero acá hubo un error: el CHECK constraint que escribí en la migración SQL tenía una falla sintáctica (`&&` en vez de `AND`), y `prisma migrate dev` la aplicó sin fallar porque PostgreSQL lo interpretó distinto. Lo detecté en los tests de integración y lo corregí en una migración adicional (`20260624060000`).

Moraleja: no confiar ciegamente en que el SQL se aplicó. Los tests de integración contra la DB real detectan cosas que `prisma migrate dev` puede pasar por alto.

## Migración #8: perfil fiscal SAT

El Figma reveló que el flujo de captura fiscal necesitaba campos del SAT:

- `personType`: persona física o empresa
- `taxRegime`: régimen fiscal
- `cfdiUse`: uso de CFDI

Estos se agregaron a `CustomerFiscalProfile` (migración `20260625200000`). El schema creció para ajustarse al diseño de Figma, no al revés.

## Migración #9: IVA y vigencia

Los últimos campos en `Quote` (`20260626120000`):

- `taxEnabled`: el IVA es configurable por cotización, no global. Algunos trabajos no llevan IVA.
- `validUntil`: 7 días por defecto, generado por la base de datos.

## El estado actual

El schema hoy tiene **10 enums** y **10 modelos**, incluyendo relaciones, constraints únicos, índices parciales y defaults manejados por la DB.

```txt
Enums:    UserRole, WorkerKind, CustomerStatus, QuoteStatus, QuoteItemType,
          WorkOrderStatus, AssignmentStatus, PaymentRequestStatus, PersonType
         
Modelos:  UserProfile, Customer, Vehicle, Quote, QuoteItem, WorkOrder,
          WorkAssignment, ExecutionRecord, CustomerFiscalProfile, PaymentRequest
```

## Lo que aprendí sobre modelar con Prisma

1. **El schema inicial no tiene que ser perfecto**. Tiene que ser funcional y dejar espacio para iterar. 10 migraciones en 2 semanas, cero rollbacks. Eso es buena señal.

2. **Los enums de Prisma son el contrato UI-DB**. Si agrego un estado en el enum, TypeScript me obliga a actualizar todos los badges y labels. Es imposible que UI y DB diverjan.

3. **Constraints en la base de datos, no solo en el código**. `@@unique`, CHECK constraints, índices parciales — PostgreSQL es la última línea de defensa. Si la lógica de app falla, la DB protege la integridad.

4. **Las migraciones cuentan una historia**. Si alguien lee `migration.sql` en orden, debería entender cómo evolucionó el modelo de negocio. De `UserProfile` sin username a `PaymentRequest` con fiscal snapshot: cada migración es un capítulo.

5. **Prisma no expresa todo**. Índices parciales y CHECK constraints avanzados van en SQL crudo en la migración. Prisma los respeta sin drift, pero no los genera. Hay que conocer PostgreSQL además de Prisma.

6. **Testear las migraciones contra la DB real**. El CHECK constraint roto que `prisma migrate dev` aplicó sin error se detectó en tests de integración. Sin esos tests, el bug vivía en producción.
