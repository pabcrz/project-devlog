---
title: "Del Figma al código: diseño visual mobile-first"
date: 2026-06-19
topics: ["design", "tailwind", "mobile", "figma"]
type: "log"
phase: reconstruccion
featured: false
excerpt: "Cómo traduje un archivo Figma a un sistema de diseño en Tailwind con tokens, temas claro/oscuro y componentes Radix."
---

## El contexto

El proyecto ya tenía funcionalidad operativa (login, clientes, cotizaciones). Pero visualmente era genérico. El usuario tenía un archivo Figma con el diseño real: pantallas, componentes, colores, tipografía, espaciado.

El desafío: traducir Figma a Tailwind sin perder fidelidad y manteniendo temas claro/oscuro.

## El approach: tokens de diseño antes que componentes

No empecé copiando componentes uno a uno. Primero extraje los tokens:

```css
:root {
  --color-primary: #004aad;
  --color-navy-700: #002b68;
  --color-navy-900: #001024;
  --color-surface: #ffffff;
  --color-border-light: #d7e0ea;
  --color-text-main: #001024;
  --color-text-muted: #64748b;
  --radius-sm: 8px;
  --radius-md: 12px;
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.07);
}
```

Luego los conecté con Tailwind v4 usando `@theme inline`:

```css
@theme inline {
  --color-primary: var(--color-primary);
  --radius-md: var(--radius-md);
  /* etc */
}
```

Esto permite usar clases Tailwind (`bg-primary`, `rounded-md`) que resuelven a los tokens del diseño real de Figma.

## Tema oscuro

El tema oscuro no es una hoja de estilos separada. Es una clase `.dark` que sobreescribe los tokens:

```css
.dark {
  --background: #001024;
  --color-surface: #001b3f;
  --color-text-main: #ffffff;
  --color-text-muted: #94a3b8;
}
```

Como los componentes usan los tokens, heredan el tema automáticamente. No hay lógica condicional de tema en cada componente.

## Componentes: Radix + Tailwind

Para comportamiento y accesibilidad usé Radix UI (dialog, select, checkbox, label). Para estilos, Tailwind con los tokens.

Ejemplo de Card:

```tsx
<div className="rounded-[var(--radius-md)] border border-[var(--color-border-light)] bg-[var(--color-surface)] shadow-sm">
```

Cada componente usa los tokens del sistema. Si mañana cambio `--radius-md`, todos los cards se actualizan solos.

## PWA y mobile-first

La app está diseñada como PWA mobile-first:

- `display: standalone` en el manifest
- `theme-color` y `viewport` configurados
- Service worker para instalabilidad
- Íconos SVG + PNG (192x192 y 512x512 pendientes)

La decisión de mobile-first no fue cosmética. El usuario del taller probablemente use la app desde un celular en campo. La UI debe funcionar con los dedos, no con mouse.

## Lo que aprendí

1. **Tokens primero, componentes después**. Si los tokens están bien, los componentes heredan consistencia.
2. Tailwind con variables CSS es más mantenible que valores hardcodeados.
3. El tema oscuro con variables es trivial de implementar: sobreescribir tokens, no estilos.
4. Radix para comportamiento, Tailwind para apariencia. Cada uno en su carril.
