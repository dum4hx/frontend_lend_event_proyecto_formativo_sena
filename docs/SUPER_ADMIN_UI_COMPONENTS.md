**Super Admin — Componentes Visuales y Guía de Reutilización**

Resumen
- Propósito: centralizar los componentes visuales usados por el módulo `super-admin` para poder reutilizarlos en otras vistas manteniendo el mismo estilo visual.
- Ubicación propuesta para los componentes: `src/modules/shared/ui/` o `src/components/ui/` (recomiendo `src/components/ui/`).

Componentes principales (actuales)
- `SuperAdminSidebar` (src/modules/super-admin/components/SuperAdminSidebar.tsx)
  - Uso: navegación lateral con logo, items, y sección de usuario/logout.
  - Estilos clave: fondo `bg-[#121212]`, borde `border-[#333]`, acento `#FFD700` (amarillo), texto `text-white` / `text-gray-400`.
  - Reutilizable como `Sidebar` parametrizable con `navItems: NavItem[]` y `brand`.

- `SuperAdminStatCard` (src/modules/super-admin/components/SuperAdminStatCard.tsx)
  - Uso: tarjetas resumen de métricas con icono, valor, etiqueta y tendencia.
  - Estilos clave: `bg-[#121212]`, `border-[#333]`, `rounded-xl`, `p-5`, hover `border-[#FFD700]`.
  - Reutilizable como `StatCard` con props: `{ label, value, icon, trend?, trendUp? }`.

Patrones visuales y tokens
- Colores:
  - Fondo principal: `#121212`
  - Borde/contraste: `#333333`
  - Acento/primario: `#FFD700` (amarillo)
  - Texto secundario: `#9CA3AF` / `text-gray-400`
- Espaciado: usar `p-4` / `p-5` para cards; `px-4 py-3` para items de navegación.
- Radio: `rounded-lg` / `rounded-xl` para contenedores principales.
- Transiciones: `transition-all` + hover accent para interacción.

Recomendaciones para crear componentes reutilizables
1. Extraer componentes a `src/components/ui/`:
   - `Sidebar.tsx` — props: `brand: { title, subtitle, logo }`, `items: { id, label, icon, path }[]`, `onLogout?`.
   - `StatCard.tsx` — props: `label`, `value`, `icon`, `trend?`, `trendUp?`.
   - `AvatarBadge.tsx` — pequeño componente para iniciales y color de fondo `#FFD700`.
   - `ConfirmButton.tsx` / `DangerButton.tsx` — botones con estilos consistentes (disabled state).

2. Exponer un único archivo de tokens de estilos (JS/TS) o variables Tailwind:
   - `src/components/ui/theme.ts` (ejemplo):
     - export const colors = { bg: '#121212', border: '#333', accent: '#FFD700', textMuted: '#9CA3AF' }
   - Alternativa: añadir variantes en Tailwind (`tailwind.config.js`) para `--color-accent`.

3. API y patrones de uso (ejemplos)
- `StatCard` (uso):
```
import { StatCard } from 'src/components/ui/StatCard';

<StatCard label="Active Users" value={1234} icon={<Users />} trend="4%" trendUp />
```

- `Sidebar` (uso):
```
import { Sidebar } from 'src/components/ui/Sidebar';

const nav = [{ id:'x', label:'Overview', icon:<BarChart3/>, path:'/admin' }];
<Sidebar brand={{title:'Lend Event', subtitle:'Super Admin'}} items={nav} onLogout={handleLogout} />
```

Comportamiento accesible y buenas prácticas
- Asegurar `aria-label` en botones y `role="navigation"` en sidebars.
- Mantener suficiente contraste entre texto y fondo (chequear AA para la paleta).
- Soportar estados `loading`, `disabled` y `skeleton` para tarjetas y botones.

Checklist para migrar vistas al estilo común
- [ ] Extraer `StatCard` y `Sidebar` a `src/components/ui/`.
- [ ] Reemplazar imports relativos en `src/modules/super-admin/*` por los componentes compartidos.
- [ ] Añadir `theme.ts` con tokens y actualizar `tailwind.config.js` si aplica.
- [ ] Revisar otras vistas (materials, admin) y sustituir componentes visuales para un look uniforme.

Notas finales
- Mantén la API de los componentes simple y con props bien tipadas (TypeScript).  
- Si quieres, puedo: 1) generar los archivos `src/components/ui/StatCard.tsx` y `src/components/ui/Sidebar.tsx` con la API propuesta, o 2) crear el `theme.ts` y actualizar una vista de ejemplo para demostrar la reutilización. Indica qué prefieres y lo implemento.
