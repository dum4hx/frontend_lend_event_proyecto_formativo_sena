# LendEvent — Frontend

React 19 + TypeScript + Vite SPA para la plataforma de gestión de alquileres de eventos **LendEvent**.

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar la plantilla de entorno y ajustar según sea necesario
cp .env.example .env

# 3. Iniciar el servidor de desarrollo
npm run dev
```

## Variables de entorno

| Variable            | Descripción                       | Predeterminado                  |
| ------------------- | --------------------------------- | ------------------------------- |
| `VITE_API_BASE_URL` | URL base de la API REST LendEvent | `https://api.test.local/api/v1` |

> Cree un archivo `.env` en la raíz del proyecto (ver `.env.example`).

## Scripts disponibles

| Script                  | Propósito                             |
| ----------------------- | ------------------------------------- |
| `npm run dev`           | Iniciar servidor Vite con HMR         |
| `npm run build`         | Verificación de tipos y build de prod |
| `npm run lint`          | Ejecutar ESLint                       |
| `npm run format`        | Formatear archivos con Prettier       |
| `npm run format:check`  | Verificar formato sin escribir        |
| `npm run test`          | Ejecutar todos los tests (Vitest)     |
| `npm run test:watch`    | Ejecutar tests en modo watch          |
| `npm run test:coverage` | Reporte de cobertura con V8           |
| `npm run preview`       | Previsualizar build de producción     |

## Aspectos destacados de la arquitectura

- **Wrapper de fetch tipado** — `src/lib/api.ts`. Cada llamada HTTP pasa por este módulo (sin axios/ky). Maneja serialización JSON, parámetros de consulta, `credentials: 'include'`, errores y 401 → refresh de token.
- **Servicios de dominio** — `src/services/*.ts`. Un archivo por entidad (usuarios, clientes, materiales, préstamos …). Cada función está completamente tipada.
- **Tipos de API** — `src/types/api.ts`. Interfaces TypeScript derivadas directamente de `API_DOCUMENTATION.md`.
- **Auth vía cookies HttpOnly** — el backend establece `access_token` (15 min) y `refresh_token` (7 días) como cookies HttpOnly. El frontend nunca usa `localStorage` para tokens.

## Pruebas

Las pruebas utilizan **Vitest** + **MSW** (Mock Service Worker).
