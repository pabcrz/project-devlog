---
title: "Pattern de tests de dominio: co-locación y comportamiento"
date: 2026-06-26
topics: ["testing", "architecture", "vitest"]
type: "case-study"
featured: true
excerpt: "Por qué puse los tests al lado del código de dominio, qué testeo (comportamiento, no implementación) y cómo limpio la base de datos entre tests."
---

## Dónde viven los tests

En este proyecto, los tests están al lado del código que protegen:

```txt
src/features/payment-requests/domain.ts
src/features/payment-requests/domain.test.ts
src/components/layout/admin-shell.tsx
src/components/layout/admin-shell.test.tsx
```

Esto se llama **co-locación**. El test vive cerca de lo que valida.

El argumento en contra suele ser "la carpeta queda desordenada". Mi respuesta: si una carpeta tiene 4 archivos, no está desordenada. El problema es cuando tenés 15 tipos distintos de archivo. Para features compactas como estas, funciona perfecto.

## Qué testeo: comportamiento, no implementación

Un buen test verifica reglas de negocio:

```ts
expect(request.status).toBe(PaymentRequestStatus.PENDING);
expect(request.token).toHaveLength(64);
expect(request.customerId).toBe(testCustomerId);
```

Un test frágil verifica tripas internas:

```ts
expect(createToken).toHaveBeenCalledTimes(1);
```

Si mañana cambio cómo se genera el token pero el resultado sigue siendo un string de 64 caracteres, el primer test sigue pasando y el segundo se rompe sin que el negocio esté roto.

> Testeá contratos y comportamiento. No testeás tripas internas.

## Cómo manejo la base de datos

Los tests de dominio corren contra la **base de datos real** de desarrollo. No mockeo Prisma. Esto es importante porque las constraints de PostgreSQL (índices parciales únicos, checks) no se verifican con mocks.

```ts
// @vitest-environment node
```

Este directive le dice a Vitest que corra en entorno Node, no en jsdom. Los tests de dominio no necesitan un navegador simulado.

### Limpieza entre tests

```ts
beforeEach(async () => {
  await cleanup();
  await createTestCustomer();
});

afterEach(async () => {
  await cleanup();
});
```

Antes de cada test: borro todo y creo datos base. Después: limpio de nuevo. Si los tests comparten basura de la base de datos, empiezan a fallar de forma impredecible. Esos son los peores tests.

## Cuándo no sigo este patrón

Para tests e2e o fixtures globales, sí separaría en carpetas dedicadas. Pero para tests de feature, la co-locación baja fricción y hace visible el test como documentación ejecutable del comportamiento.
