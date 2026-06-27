---
title: "Por qué Android no muestra 'Instalar app' en mi PWA"
date: 2026-06-27
topics: ["pwa", "mobile", "deployment"]
type: "log"
featured: false
excerpt: "La app tenía manifest y service worker, pero Chrome en Android no ofrecía instalar. Faltaban íconos PNG y criterios de installability."
---

## El problema

La app está deployada en Vercel. En otras PWAs, Chrome me muestra "Instalar aplicación" o "Agregar a pantalla principal". En esta, no.

Revisé la configuración: tenía `manifest.ts` con `display: standalone`, `theme_color`, y un service worker registrado en producción. ¿Qué faltaba?

## Diagnóstico

El manifest solo declaraba un ícono SVG:

```ts
icons: [
  {
    src: "/icon.svg",
    sizes: "any",
    type: "image/svg+xml",
  },
],
```

Chrome en Android **requiere íconos PNG** para considerar la app instalable. Específicamente:

- 192×192 (o 512×512 como mínimo)
- Tipo `image/png`
- `purpose: "any"` o `"maskable"` para adaptarse a launcher de Android

Además, el service worker (`sw.js`) era mínimo — solo `install` y `activate`. Sin un `fetch` handler, Chrome igual puede instalarla, pero algunos dispositivos son más exigentes.

## Lo que aprendí

Los criterios de installability de Chrome no son subjetivos. Son chequeables con Lighthouse (Audit → PWA). Si no pasa, no aparece el prompt. Las tres condiciones mínimas:

1. HTTPS
2. Manifest válido con `name`, `short_name`, `start_url`, `display` e íconos PNG
3. Service worker registrado

En este proyecto faltaba el punto 2 (íconos PNG).

## Acción

Creé [un issue](https://github.com/pabcrz/sebasam-app/issues/53) para generar íconos PNG alineados con la identidad visual de la app y completar la configuración PWA.

Concepto importante: **"funciona en el navegador" ≠ "es instalable como PWA"**. Son dos chequeos distintos. La installability no se testea durante el desarrollo normal; hay que verificarla explícitamente.
