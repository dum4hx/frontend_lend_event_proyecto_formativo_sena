# ✅ QA CHECKLIST - Pre-Deployment Testing

## Antes de subir a Producción

> **Estimado:** 2-3 horas de testing completo
> **Prioridad:** CRÍTICA - No deployar sin completar

---

## 1. AUTHENTICATION & AUTHORIZATION ✅

### Login Functionality
- [ ] Email incorrecto muestra error
- [ ] Contraseña incorrecta muestra error
- [ ] Login exitoso redirige a dashboard correcto
- [ ] Token se almacena en localStorage
- [ ] Session persiste después de refresh
- [ ] Logout limpia token
- [ ] URLs protegidas sin token redirigen a login

### Role-Based Access
- [ ] User con rol `owner` → acceso a `/admin`
- [ ] User con rol `manager` → acceso a `/location-manager`
- [ ] User con rol `warehouse_operator` → acceso a `/warehouse-operator`
- [ ] User con rol `commercial_advisor` → acceso a `/commercial-advisor`
- [ ] User sin rol correcto → `/unauthorized`
- [ ] Header muestra email y nombre correcto
- [ ] Sidebar refleja datos del usuario actual

---

## 2. LOCATION MANAGER MODULE

### Dashboard Page
- [ ] Carga sin errores
- [ ] 4 stat cards muestran números correctos
  - [ ] Total Materials = número correcto
  - [ ] Total Categories = número correcto
  - [ ] Active Plans = número correcto
  - [ ] Out of Stock = número correcto
- [ ] Activity history muestra últimos 5 eventos
- [ ] Quick action cards son clickeables (visual feedback)
- [ ] "Add Material" button navega a form (cuando implementado)

### Materials Page
- [ ] Tabla carga con 5+ materiales
- [ ] Búsqueda por nombre funciona
- [ ] Búsqueda por SKU funciona
- [ ] Filtro de categoría funciona
- [ ] "Add Material" button visible y clickeable
- [ ] Edit button (icono de lápiz) es interactivo
- [ ] Delete button muestra confirmación
- [ ] Delete remueve material de tabla
- [ ] Status badges muestran color correcto
  - [ ] active = verde
  - [ ] inactive = naranja
  - [ ] discontinued = rojo

### Categories Page
- [ ] Se carga con grid de categorías
- [ ] Cada card muestra:
  - [ ] Nombre de categoría
  - [ ] Número de materiales
  - [ ] Edit button
  - [ ] Delete button
- [ ] Datos actualizados en tiempo real

### Models Page
- [ ] Tabla de modelos carga
- [ ] Category filter funciona
- [ ] Edit/Delete buttons son funcionales
- [ ] Status badges correctos

### Attributes Page
- [ ] Lista de atributos carga
- [ ] Adoption progress bar es visible
- [ ] Values se muestran correctamente
- [ ] Edit/Delete funcional

### Plans Page
- [ ] Grid de planes carga
- [ ] Cada card muestra:
  - [ ] Plan name
  - [ ] Duration
  - [ ] Price
  - [ ] Materials included
  - [ ] Status
- [ ] Category filter funciona

### Settings Page
- [ ] Form carga sin errores
- [ ] Todos los campos son editables
- [ ] Save button funciona
- [ ] Success message aparece después de guardar
- [ ] Datos persisten después de refresh
- [ ] Validación si faltan campos

---

## 3. COMMERCIAL ADVISOR MODULE

### Dashboard Page
- [ ] Carga sin errores
- [ ] 4 KPI cards correctamente poblados
  - [ ] Total Orders
  - [ ] Total Customers
  - [ ] Monthly Revenue
  - [ ] Active Rentals
- [ ] Recent orders list muestra últimos 5 órdenes
- [ ] Status coloring es consistente
- [ ] Quick action cards son funcionales

### Customers Page
- [ ] Grid de clientes carga
- [ ] Cada card muestra:
  - [ ] Cliente nombre
  - [ ] Email (clickeable)
  - [ ] Teléfono (clickeable)
  - [ ] Company
  - [ ] Ciudad
  - [ ] Status badge
  - [ ] Total orders & spent
- [ ] "Add Customer" button funciona
- [ ] Edit/Delete buttons funcionales

### Orders Page
- [ ] Tabla carga con órdenes
- [ ] Búsqueda por order ID funciona
- [ ] Búsqueda por customer name funciona
- [ ] Status filter dropdown funciona
- [ ] Muestra rental period correctamente
- [ ] Total amount es correcto
- [ ] View/Delete actions funcionales

### Contracts Page
- [ ] Grid de contratos carga
- [ ] Cada card muestra:
  - [ ] Contract ID
  - [ ] Sign date
  - [ ] Start date
  - [ ] End date
  - [ ] Total value
  - [ ] Items count
  - [ ] Status
- [ ] Download button (cuando integrado)
- [ ] View/Delete acciones funcionales

### Rentals Page
- [ ] Lista de alquileres carga
- [ ] Cada card muestra:
  - [ ] Customer name
  - [ ] Materials list
  - [ ] Start/End dates
  - [ ] Progress bar (elapsed/total days)
  - [ ] Deposit amount
  - [ ] Status con overdue icon si aplica
- [ ] Status filter funciona
- [ ] Overdue alerts visibles

### Invoices Page
- [ ] Grid de facturas carga
- [ ] Cada card muestra:
  - [ ] Invoice ID
  - [ ] Customer
  - [ ] Dates
  - [ ] Total amount
  - [ ] Payment percentage
  - [ ] Status coloring
    - [ ] paid = verde
    - [ ] pending = amarillo
    - [ ] partial = azul
    - [ ] overdue = rojo
- [ ] Download/View/Delete acciones

### Reports Page
- [ ] 4 metrics KPIs cargan
- [ ] Report generator form funciona
- [ ] Type dropdown poblado
- [ ] Period dropdown funciona
- [ ] Date range picker funciona
- [ ] Recent reports list muestra últimos 4
- [ ] Download button funciona (cuando integrado)

### Settings Page
- [ ] Personal info form carga
- [ ] Preferences (language, currency) funciona
- [ ] Preferences (language, currency) guardados
- [ ] Notifications toggles funcional
- [ ] Save button muestra success message
- [ ] Datos persisten después de refresh

---

## 4. WAREHOUSE OPERATOR MODULE

- [ ] Dashboard carga y muestra stats
- [ ] Inventory page funciona
- [ ] Locations page funciona
- [ ] Stock Movements page funciona
- [ ] Alerts page muestra alertas
- [ ] Settings page funciona

---

## 5. PERFORMANCE & UX

### Velocidad
- [ ] Página load time < 3 segundos
- [ ] Dashboard stats cargan en < 2 segundos
- [ ] Tabla con 100+ registros no se congela
- [ ] Search/filter no tiene lag noteable
- [ ] Delete action es inmediata (optimistic update)

### Responsividad (Desktop)
- [ ] Sidebar no se superpone al contenido
- [ ] Tablas scroll horizontal en pantallas pequeñas
- [ ] Grids ajustan correctamente
- [ ] Botones son clickeables (min 44x44px)
- [ ] Texto es legible (contrast ratio > 4.5:1)

### Error Handling
- [ ] Error al cargar data muestra mensaje claro
- [ ] "Try Again" button funciona
- [ ] Network error es manejado gracefully
- [ ] 404 errors muestran mensaje útil
- [ ] 500 errors muestran mensaje útil sin exponér detalles

### Loading States
- [ ] Loading spinner muestra mientras carga
- [ ] Skeleton screens (si implementado)
- [ ] No "flash" de contenido vacío
- [ ] Transiciones son smooth

---

## 6. DATA INTEGRITY

### No Data Loss
- [ ] Editar campo y cancelar no cambia data
- [ ] Navigate away sin save no pierde datos
- [ ] Refresh durante edit no pierde datos
- [ ] Delete requiere confirmación

### Data Accuracy
- [ ] Números decimales (precios) son exactos
- [ ] Fechas están en formato correcto
- [ ] Status enums son válidos
- [ ] Foreign keys son válidas

### Validation
- [ ] Campos requeridos no permiten envío vacío
- [ ] Email format es validado
- [ ] Phone format es validado
- [ ] Precio debe ser positivo
- [ ] Mensajes de error son útiles

---

## 7. VISUAL & STYLING

### Colors & Theme
- [ ] Background es #121212 (dark)
- [ ] Cards son #1a1a1a (darker)
- [ ] Borders son #333 (grid)
- [ ] Accents son #FFD700 (gold)
- [ ] Text es blanco con buenos contrasts
- [ ] Hover states son visibles

### Icons
- [ ] Icons cargan (Lucide React)
- [ ] Icons size correcta (20-32px)
- [ ] Icon colors son consistentes
- [ ] Iconos inline con texto alineados correctamente

### Spacing & Layout
- [ ] Padding es consistente (6, 12, 24px)
- [ ] Gaps entre elementos son uniformes
- [ ] Grid layouts son responsive
- [ ] No hay content overlaps

### Accessibility
- [ ] Links y buttons tienen :focus state visible
- [ ] Keyboard navigation funciona
- [ ] Labels en inputs están presentes
- [ ] Alt text en imágenes (si hay)
- [ ] Color no es único diferenciador (patterns/text también)

---

## 8. BROWSER COMPATIBILITY

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iPhone Safari (iOS 14+)
- [ ] Android Chrome

### Feature Tests
- [ ] localStorage funciona
- [ ] JWT tokens se almacenan
- [ ] Fetch API funciona
- [ ] Promises se resuelven

---

## 9. API INTEGRATION (Si estás en fase 2)

### Endpoints
- [ ] GET /api/materials ✅ conectado
- [ ] POST /api/materials ✅ conectado
- [ ] PATCH /api/materials/:id ✅ conectado
- [ ] DELETE /api/materials/:id ✅ conectado
- [ ] Otros endpoints… ✅

### Response Handling
- [ ] Success responses retornan `{success: true, data}`
- [ ] Error responses retornan `{success: false, error}`
- [ ] 401 errors logout automáticamente
- [ ] 500 errors muestran retry option
- [ ] Network timeout maneja gracefully (>5s)

### Authentication
- [ ] JWT token en Authorization header
- [ ] Token refresh automático en 401
- [ ] CORS headers correctos
- [ ] Headers `Content-Type: application/json`

---

## 10. SECURITY

- [ ] Nunca mostrar token en console/logs
- [ ] Validar input en cliente (aunque no confiable)
- [ ] HTTPS en producción (no HTTP)
- [ ] CORS policy restrictiva
- [ ] Logout limpia sensitive data de memoria
- [ ] No almacenar passwords en localStorage

---

## 11. FINAL SMOKE TEST

> Ejecuta esto al final para una validación rápida

```
1. Login con usuario correcto
   ✅ Dashboard Load
2. Navegar a cada módulo
   ✅ Location Manager Dashboard
   ✅ Location Manager Materials (crear/editar/eliminar)
   ✅ Commercial Advisor Dashboard
   ✅ Commercial Advisor Customers (crear/editar/eliminar)
3. Test búsqueda/filtros
   ✅ Search funciona
   ✅ Filters funciona
4. Test error handling
   ✅ Wrong credentials
   ✅ Unauthorized access
5. Logout
   ✅ Session limpiada
   ✅ Redirect a login
```

---

## 12. DEPLOYMENT CHECKLIST

Antes de hacer `npm run build && deploy`:

- [ ] Todos tests en sección 11 ✅
- [ ] No console errors (F12 → Console)
- [ ] No console warnings
- [ ] Network tab limpia (no failed requests)
- [ ] localStorage limpio de test data
- [ ] Environment variables configurados (API_URL)
- [ ] .env.production tiene valores correctos
- [ ] No hardcoded URLs (usar proceso.env)
- [ ] Build completa sin errores (`npm run build`)
- [ ] Build size < 1MB (compressed)

---

## 13. POST-DEPLOYMENT

Después de deployar a producción:

- [ ] Cargar sitio en navegador
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] Al menos una tabla/grid carga con data
- [ ] API calls exitosos (check Network tab)
- [ ] No 404/500 errors
- [ ] No CORS errors
- [ ] Performance es aceptable

---

## SIGN-OFF

Cuando completes TODAS las secciones arriba:

```
QA Testing Completed: _____ (fecha)
Tester Name: ___________
Issues Found: _____ (número)
Status: ⚪ PASS / 🔴 FAIL

Critical Issues to Fix:
- [list]

Nice to Have (backlog):
- [list]

Approved for Deployment: _____ (firma)
```

---

## Bug Report Template

Si encuentras un issue, completa esto:

```
**Título:** [SHORT DESCRIPTION]

**Severidad:** 
- 🔴 Critical (breaks functionality)
- 🟠 Major (feature doesn't work)
- 🟡 Minor (visual/UX issue)
- 🟢 Trivial (documentation)

**Pasos para Reproducir:**
1. ...
2. ...
3. ...

**Resultado Esperado:**
...

**Resultado Actual:**
...

**Screenshots/Video:**
[attach]

**Browser/Device:**
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop

**Environment:**
- [ ] Development
- [ ] Staging
- [ ] Production
```

---

**Documento:** QA CHECKLIST
**Versión:** 1.0
**Última actualización:** 2024
**Estado:** Ready to Use

> **Recuerda:** Un bug en producción cuesta 10x más arreglar que en QA
