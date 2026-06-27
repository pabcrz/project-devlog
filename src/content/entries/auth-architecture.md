---
title: "Arquitectura de autenticación: Supabase Auth + UserProfile interno"
date: 2026-06-18
topics: ["auth", "architecture", "supabase", "nextjs"]
type: "case-study"
featured: false
excerpt: "Cómo diseño la capa de auth con Supabase para identidad, Prisma para roles, y proxy para proteger rutas."
---

## El reto

El proyecto necesitaba login para usuarios internos del taller. No sign-up público, no OAuth social. Username + password para admins y asistentes.

La decisión clave: **Supabase Auth maneja identidad. Prisma maneja autorización y perfil.**

## La arquitectura

Tres capas:

### 1. Supabase Auth → identidad

El usuario inicia sesión. Supabase valida credenciales y establece una sesión con cookies.

Login interno con emails sintéticos:

```ts
pablo → pablo@sebasam.local
```

Esto permite usar `signInWithPassword` sin depender de casillas de correo reales.

### 2. UserProfile → autorización

Supabase Auth dice **quién** es. `UserProfile` en Prisma dice **qué puede hacer**:

```prisma
model UserProfile {
  id          String    @id @db.Uuid  // mismo UUID de Supabase Auth
  username    String    @unique
  role        UserRole  // ADMIN, ADMIN_ASSISTANT, WORKER
  workerKind  WorkerKind? // MASTER, HELPER
}
```

El `id` de `UserProfile` es el mismo UUID del usuario de Supabase Auth. Una relación 1:1 implícita.

### 3. Proxy de Next.js → protección de rutas

En Next.js App Router, la protección de rutas se hace con un proxy:

```ts
// src/proxy.ts
export async function proxy(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  if (isProtectedAdminRoute && !user) {
    return redirect("/admin/login")
  }
}
```

El proxy corre en cada request. Si la ruta es protegida y no hay sesión, redirige al login.

## Guards de rol en Server Actions

Más allá de la protección de ruta, las acciones que modifican datos verifican el rol:

```ts
export async function createPaymentRequestForQuote(quoteId: string) {
  await requireOperationalRole(); // solo ADMIN o ADMIN_ASSISTANT
  return createPaymentRequestForQuoteDomain(quoteId);
}
```

Esto es defensa en profundidad: si alguien llegara a una ruta protegida sin el rol correcto, las Server Actions igual rechazan la operación.

## Decisiones importantes

### MVP: solo admins inician sesión

En el MVP, solo `ADMIN` y `ADMIN_ASSISTANT` tienen login. Los `WORKER` existen como registros operativos (asignaciones, ejecución) pero no tienen acceso a la app. El login de trabajadores queda post-MVP.

### Un solo login, rutas según rol

No hay `/admin/login` separado de login público. Un solo `/login` y después la app redirige según `UserProfile.role`. El namespace `/admin` eventualmente desaparece a favor de rutas semánticas con guards por rol.

### Service role solo en servidor

Para operaciones admin como crear usuarios o resetear passwords, se usa `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en Server Actions, nunca en el cliente.

## Lo que aprendí

1. **Separar identidad de autorización**. Supabase Auth no debería saber qué roles de negocio existen.
2. **El proxy protege rutas, las actions protegen datos**. Dos capas, no una.
3. Los emails sintéticos (`@sebasam.local`) simplifican el MVP pero limitan la recuperación de contraseña. Requieren un flujo de provisioning propio post-MVP.
