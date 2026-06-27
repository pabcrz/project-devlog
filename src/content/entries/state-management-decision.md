---
title: "No usé Redux ni Zustand"
date: 2026-06-28
topics: ["architecture", "state-management", "react"]
type: "case-study"
phase: reflexiones
featured: true
excerpt: "Con Next.js App Router, Server Actions y Supabase no necesitaba un store global de cliente."
---

## La pregunta

Al armar la app operativa de SEBASAM —cotizaciones, órdenes de trabajo, ejecución de campo— surgió la pregunta natural: ¿cómo manejamos el estado? ¿Redux? ¿Zustand?

Mi respuesta: **ninguno. Por ahora.**

## El razonamiento

Para tomar esta decisión, clasifiqué el estado en tres categorías:

### 1. Estado de negocio → servidor

Cosas como clientes, cotizaciones, órdenes de trabajo, payment requests. Esto pertenece a:

- PostgreSQL vía Prisma
- Server Actions (`"use server"`)
- Server Components de Next.js

Ejemplo:

```ts
const paymentRequest = await getPaymentRequestByToken(token);
```

No necesito duplicar este estado en un store global del cliente. La fuente de verdad es la base de datos, y las Server Actions son el puente.

### 2. Estado de UI → React local

Para modales, tabs, inputs temporales, loadings:

```ts
const [isOpen, setIsOpen] = useState(false);
```

`useState`, `useReducer`, `useActionState`. No necesito Redux para colgar un modal.

### 3. Estado compartido → URL

Para filtros, búsquedas, paginación:

```txt
?status=pending&page=2&query=foo
```

La URL es mejor que cualquier store porque:
- Se puede compartir
- Sobrevive refresh
- Funciona con SSR
- Responde al botón "atrás" del navegador

## ¿Cuándo sí usaría Zustand?

Zustand antes que Redux para este proyecto. Lo usaría si aparece:
- Un wizard multi-step que cruza rutas
- Selección temporal de items en varias secciones
- Estado optimista complejo antes de persistir

Pero **hoy no es necesario**. Y no instalar algo que no necesitás es una decisión de arquitectura.

## Lo que aprendí

> Server state en el servidor. UI state local. Global client state solo si duele de verdad.

Esta regla me ahorró instalar dependencias innecesarias y me forzó a diseñar mejor las Server Actions y la separación de responsabilidades. Conceptualmente, es el mismo principio que aplicamos en el dominio de payment requests: cada capa tiene un rol claro, y no duplicamos fuentes de verdad.
