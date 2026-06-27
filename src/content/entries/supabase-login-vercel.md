---
title: "Debugging login con Supabase en Vercel"
date: 2026-06-27
topics: ["auth", "deployment", "supabase", "debugging"]
type: "log"
featured: false
excerpt: "El login funcionaba en local pero en Vercel devolvía /admin/login?error=invalid. Qué pasó y cómo lo resolví."
---

## El síntoma

Deployé la app en Vercel. Todo bien. Voy a `/admin/login`, pongo usuario y contraseña, y:

```txt
/admin/login?error=invalid
```

En local funcionaba perfecto.

## Lo que NO era

Mi primera hipótesis fue "Supabase no autoriza la URL de Vercel". Agregué el dominio en Supabase Auth → URL Configuration. No cambió nada.

También revisé las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Estaban correctas.

## Lo que SÍ era

El proyecto no usa login por email directo. Transforma el username internamente:

```ts
pablo → pablo@sebasam.local
```

Estos emails (`@sebasam.local`) son sintéticos. No existen como casillas reales. Son solo identificadores internos en Supabase Auth.

El problema: el usuario `pablo@sebasam.local` **no existía** en Supabase Auth del proyecto de producción. Lo creé localmente para desarrollo, pero en el entorno de producción de Supabase no estaba.

## Solución

Creé el usuario manualmente en Supabase Auth (producción):

1. Authentication → Users → Add user
2. Email: `pablo@sebasam.local`
3. Password: el correspondiente

Login funcionó inmediatamente después.

## Aprendizaje

1. **Supabase Auth no se migra con `prisma migrate`**. Es un servicio separado. Si tenés entornos distintos (local vs producción), los usuarios de Auth también son distintos.
2. Para apps internas con pocos usuarios, esto se puede manejar manualmente. Pero si escalás, necesitás un flujo de provisioning propio.
3. El error `?error=invalid` era genérico. Mejoraría el logging para distinguir "usuario no existe" de "password incorrecto" de "falta UserProfile".

Este debugging derivó en [el issue de provisioning de usuarios](https://github.com/pabcrz/sebasam-app/issues/51).
