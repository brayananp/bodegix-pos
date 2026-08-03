# Bodegix POS

PWA offline de ventas, caja e inventario para bodegas.

## Identidad

| Campo | Valor |
|---|---|
| Nombre comercial | **Bodegix** |
| Nombre del proyecto | **Bodegix POS** |
| Repositorio | `bodegix-pos` |
| Paquete | `bodegix-pos` |
| Base Dexie | `bodegix-pos` |

## Descripción

Bodegix POS es una aplicación web progresiva (PWA) diseñada para que bodegas pequeñas registren ventas, controlen caja e inventario de forma confiable — incluso sin conexión a internet.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | **TanStack Start** |
| UI | **React** 19 |
| Lenguaje | **TypeScript** |
| Gestor de paquetes | **pnpm** |
| Estilos | **Tailwind CSS** v4 + **shadcn/ui** |
| Validación | **Zod** |
| Formularios | **TanStack Form** |
| Base de datos local | **Dexie** + **dexie-react-hooks** |
| Tests unitarios | **Vitest** |
| Tests E2E | **Playwright** |

## Primeros pasos

### Requisitos

- Node.js ≥ 22
- pnpm ≥ 10

### Instalación

```bash
pnpm install
```

### Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Build para producción

```bash
pnpm build
```

### Previsualizar build:

```bash
pnpm preview
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm dev` | Iniciar servidor de desarrollo en puerto 3000 |
| `pnpm build` | Generar build de producción |
| `pnpm preview` | Previsualizar build de producción |
| `pnpm generate-routes` | Generar archivos de rutas TanStack Router |
| `pnpm lint` | Análisis estático con Biome |
| `pnpm format` | Formatear código con Biome |
| `pnpm check` | Lint + format + type check con Biome |
| `pnpm db:generate` | Generar migraciones Drizzle |
| `pnpm db:migrate` | Ejecutar migraciones |
| `pnpm db:push` | Push de esquema directo a BD |
| `pnpm db:pull` | Pull de esquema desde BD |
| `pnpm db:studio` | Abrir Drizzle Studio |

## Estructura del proyecto

```
bodegix-pos/
├── docs/                   # Documentación del producto y ADRs
├── public/                 # Assets públicos
├── src/
│   ├── components/       # Componentes React
│   │   └── ui/          # Componentes shadcn/ui
│   ├── db/             # Capa de persistencia (Dexie)
│   ├── integrations/    # Integraciones (auth, etc.)
│   ├── lib/            # Utilidades y librerías
│   ├── routes/         # Rutas de TanStack Router
│   ├── env.ts          # Variables de entorno tipadas
│   ├── router.tsx      # Configuración del router
│   └── styles.css     # Estilos globales Tailwind
├── AGENTS.md          # Guías para agentes de código
├── components.json    # Configuración shadcn/ui
├── documentation-manifest.json  # Manifiesto de documentación
├── package.json
├── tsconfig.json
├── tsr.config.json    # Configuración TanStack Router
└── vite.config.ts
```

## Despliegue con Nitro

El build produce un servidor Node autocontenido en `dist/`:

```bash
pnpm build
node dist/server/index.mjs
```

Para desplegar, subir el directorio `dist/` a tu host (Render, Fly.io, VPS propio, etc.) y ejecutar el comando del servidor.

Para presets específicos (Vercel, Netlify, Cloudflare, AWS Lambda, etc.): <https://v3.nitro.build/deploy>

## Documentación

La documentación de producto y arquitectura reside en `docs/`. Revisar en orden:

1. `docs/01-product-vision.md` — Visión y objetivos
2. `docs/02-mvp-scope.md` — Alcance del MVP
3. `docs/06-domain-model.md` — Modelo de dominio
4. `docs/07-database-dexie.md` — Diseño de base de datos
5. `docs/08-application-architecture.md` — Arquitectura de la app
6. `docs/adr/` — Registros de decisiones de arquitectura
