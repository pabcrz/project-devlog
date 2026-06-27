---
title: "Validación en runtime con Zod: por qué TypeScript no alcanza"
date: 2026-06-28
topics: ["typescript", "validation", "zod"]
type: "log"
phase: reflexiones
featured: false
excerpt: "TypeScript protege en compilación, pero cuando recibís datos de un formulario, API o URL, necesitás validación real en runtime. Así uso Zod en el proyecto."
---

## El problema

TypeScript es excelente para detectar errores mientras programás. Pero cuando un usuario envía un formulario, TypeScript ya se fue a dormir. En runtime, el tipo `string` no garantiza que el dato sea un email válido, un RFC bien formado, o que no esté vacío.

## La solución: Zod como aduana de datos

En el proyecto, todo dato externo —formulario, Server Action, query param— pasa por Zod antes de tocar la lógica de dominio o la base de datos.

### Schema declarativo

```ts
export const fiscalDataInputSchema = z.object({
  businessName: z.string().trim().min(1).max(200),
  taxId: z.string().trim().min(1).max(20),
  email: z.string().trim().email().optional(),
});
```

### Uso en el dominio

```ts
const data = fiscalDataInputSchema.parse(input);
```

Si `input` no cumple, Zod lanza error ANTES de que el dato llegue a la base de datos. Esto evita guardar basura y hace que los errores sean predecibles.

## Preprocess para limpiar inputs

Un helper que uso en varias features:

```ts
const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);
```

Un input vacío de formulario llega como `""`. La app lo trata como `undefined` ("no me pasaron este campo"). Esto evita guardar strings vacíos en la base de datos.

## Tipo inferido automáticamente

```ts
export type FiscalDataInput = z.infer<typeof fiscalDataInputSchema>;
```

No duplico tipos. El schema es la fuente de verdad. TypeScript infiere el tipo desde Zod automáticamente. Si cambio el schema, el tipo se actualiza solo.

## Dónde se usa

En el proyecto, cada feature tiene su archivo de schemas:

```txt
src/features/customers/schemas.ts
src/features/quotes/schemas.ts
src/features/vehicles/schemas.ts
src/features/work-orders/schemas.ts
src/features/payment-requests/schemas.ts
```

La regla: **todo dato externo es sospechoso hasta que Zod lo valida**. TypeScript protege tu código. Zod protege tu aplicación.
