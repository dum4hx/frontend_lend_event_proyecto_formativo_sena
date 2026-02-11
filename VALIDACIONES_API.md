# Validaciones de Autenticación - Documentación

## Resumen de Cambios

Se han implementado todas las validaciones según el manual de API y mejores prácticas de seguridad para los módulos de:
- **Login**
- **Registro**
- **Cambio de Contraseña**

---

## Archivos Modificados

### 1. `/src/services/authService.ts` (Nuevo)
Servicio centralizado para todas las llamadas a la API de autenticación.

**Funcionalidades:**
- `registerUser()` - Registro de nueva organización y propietario
- `loginUser()` - Inicio de sesión
- `changePassword()` - Cambio de contraseña
- `logoutUser()` - Cierre de sesión
- `getCurrentUser()` - Obtener usuario actual
- `refreshToken()` - Refrescar token de acceso

**Base URL:** `http://localhost:8080/api/v1`

**Features:**
- Manejo de cookies HTTP-only automático
- Manejo de errores estructurado
- Respuestas tipadas con TypeScript

---

### 2. `/src/utils/validators.ts` (Nuevo)
Funciones de validación reutilizables para todos los formularios de autenticación.

#### Validadores Disponibles:

##### Email
```typescript
validateEmail(email: string): ValidationResult
```
- Formato válido de email requerido
- Validación según patrón de email estándar

##### Password
```typescript
validatePassword(password: string): ValidationResult
```
**Requisitos según API:**
- ✓ Mínimo 8 caracteres
- ✓ Al menos una mayúscula
- ✓ Al menos un número
- ✓ Al menos un carácter especial (!@#$%^&*)

##### FirstName / LastName
```typescript
validateFirstName(firstName: string): ValidationResult
validateLastName(lastName: string): ValidationResult
```
- Mínimo 2 caracteres
- Máximo 50 caracteres
- No puede estar vacío

##### OrganizationName
```typescript
validateOrganizationName(name: string): ValidationResult
```
- Mínimo 2 caracteres
- Máximo 100 caracteres
- Requerido

##### Phone (Opcional)
```typescript
validatePhone(phone?: string): ValidationResult
```
- Validación de teléfono internacional
- Acepta formatos con y sin formato
- Mínimo 7 dígitos, máximo 15

##### Code (6 dígitos para cambio de contraseña)
```typescript
validateCode(code: string): ValidationResult
```
- Exactamente 6 dígitos numéricos
- Validación strict

##### Confirm Password
```typescript
validateConfirmPassword(password: string, confirmPassword: string): ValidationResult
```
- Las contraseñas deben coincidir
- Ambas requeridas

##### Current Password (Para cambio de contraseña)
```typescript
validateCurrentPassword(password: string): ValidationResult
```
- Requerida para cambio de contraseña
- No puede ser igual a la nueva contraseña

#### Validadores de Formularios Completos:

```typescript
validateRegistrationForm(formData): ValidationResult
validateLoginForm(formData): ValidationResult
validateChangePasswordForm(formData): ValidationResult
```

Estos validadores ejecutan todas las validaciones necesarias en orden.

---

### 3. `/src/pages/Login.tsx` (Modificado)

**Cambios Principales:**

#### Imports Agregados
```typescript
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/authService'
import { validateLoginForm } from '../utils/validators'
```

#### Estado Nuevo
```typescript
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
```

#### Lógica de Validación
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setError('')

  // Validar formulario
  const validation = validateLoginForm({ email, password })
  if (!validation.isValid) {
    setError(validation.message || 'Validación fallida')
    return
  }

  // Llamar a API
  setLoading(true)
  const response = await loginUser({ email, password })
  
  if (response.status === 'error') {
    setError(response.message)
    return
  }
  
  // Redirigir a dashboard
  navigate('/dashboard')
}
```

#### UI Mejorada
- ✓ Mensaje de error prominent (box rojo)
- ✓ Loading state en botón
- ✓ Inputs deshabilitados durante carga
- ✓ Feedback visual de estado

---

### 4. `/src/pages/Registro.tsx` (Modificado)

**Cambios Principales:**

#### Estructura de Datos Actualizada
Cambio de estados simples a estructura que coincida con API:
```typescript
// Antes
const [nombreCompleto, setNombreCompleto] = useState('')
const [empresa, setEmpresa] = useState('')

// Ahora
const [firstName, setFirstName] = useState('')
const [lastName, setLastName] = useState('')
const [organizationName, setOrganizationName] = useState('')
const [phone, setPhone] = useState('')
```

#### Payload hacia API
```typescript
const response = await registerUser({
  email,
  password,
  organizationName,
  profile: {
    firstName,
    lastName,
    phone: phone || undefined,
  },
})
```

#### Campos Agregados
- ✓ Nombre (firstName)
- ✓ Apellido (lastName)
- ✓ Teléfono (opcional)
- ✓ Instrucciones de contraseña fuerte

#### UI Mejorada
- ✓ Mensaje de error
- ✓ Loading state
- ✓ Inputs deshabilitados durante carga
- ✓ Instrucciones claras de requisitos de contraseña

---

### 5. `/src/pages/RecuperarContrasena.tsx` (Modificado)

**Cambios Principales:**

#### Lógica de Cambio de Contraseña
Ahora usa el endpoint `/auth/change-password` real:
```typescript
async function handleCambiarContrasena() {
  // Validaciones completas
  const formValidation = validateChangePasswordForm({
    currentPassword,
    newPassword,
    confirmPassword,
  })

  if (!formValidation.isValid) {
    setError(formValidation.message)
    return
  }

  // Llamar a API
  const response = await changePassword({
    currentPassword,
    newPassword,
  })
}
```

#### Estados Nuevos
```typescript
const [currentPassword, setCurrentPassword] = useState('')
const [error, setError] = useState('')
const [loading, setLoading] = useState(false)
```

#### Mejoras en Validaciones
- **Paso 1:** Email válido requerido
- **Paso 2:** Código de 6 dígitos exactos
- **Paso 3:** 
  - Contraseña actual requerida
  - Nueva contraseña con requisitos fuertes
  - Confirmación de contraseña
  - Verificación de que sea diferente a la actual

#### UI Mejorada (Todos los pasos)
- ✓ Mensajes de error en boxes rojos
- ✓ Loading states
- ✓ Inputs deshabilitados durante carga
- ✓ Instrucciones de requisitos claras

---

## Requisitos de Contraseña (API)

```
✓ Mínimo 8 caracteres
✓ Al menos una mayúscula (A-Z)
✓ Al menos un número (0-9)
✓ Al menos un carácter especial (!@#$%^&*)
```

### Ejemplos Válidos:
- `MyPassword123!`
- `SecurePass456@`
- `CompanyName789#`

### Ejemplos Inválidos:
- `password123!` - Sin mayúscula
- `Password!` - Sin número
- `Password123` - Sin carácter especial
- `Pass1!` - Menos de 8 caracteres

---

## Flujo de Autenticación

### 1. Registro (POST /auth/register)
```
Usuario → Llena formulario → Validación local → API Register
        ↓
        Si error: Muestra mensaje
        Si éxito: Redirige a Login
```

### 2. Login (POST /auth/login)
```
Usuario → Llena formulario → Validación local → API Login
       ↓
       Token guardado en cookie HTTP-only
       Si error: Muestra mensaje
       Si éxito: Redirige a Dashboard
```

### 3. Cambio de Contraseña (POST /auth/change-password)
```
Usuario → Paso 1: Email → Paso 2: Código → Paso 3: Nueva contraseña
       ↓
       Validación local en cada paso
       Si error: Muestra mensaje en rojo
       Si éxito: Redirige a Login
```

---

## Manejo de Errores

### Errores de Validación Local
Se muestran inmediatamente:
```
"El correo es requerido"
"Ingresa un correo válido"
"La contraseña debe contener al menos una mayúscula"
```

### Errores de API
Se obtienen de la respuesta:
```typescript
{
  "status": "error",
  "message": "Error al iniciar sesión",
  "code": "INVALID_CREDENTIALS"
}
```

Todos mostrados en un box rojo con:
```
🔴 Tu mensaje de error aquí
```

---

## Seguridad Implementada

### ✓ Cookies HTTP-only
Los tokens se almacenan en cookies HTTP-only, no accesibles desde JavaScript.

### ✓ Validación en Cliente
Previene solicitudes inválidas a la API.

### ✓ Requisitos Fuertes de Contraseña
Mayúscula + Número + Carácter especial + Mínimo 8 caracteres.

### ✓ Rate Limiting (API)
- Global: 100 req/min por IP
- Auth: 5 req/min por IP
- Password Reset: 3 req/hora por email

### ✓ CORS
API configurada en `http://localhost:3000`

---

## Testing Recomendado

### Casos de Prueba - Login
- [ ] Login con credenciales válidas
- [ ] Login con email inválido
- [ ] Login con contraseña vacía
- [ ] Login con contraseña incorrecta

### Casos de Prueba - Registro
- [ ] Registro con todos los datos válidos
- [ ] Registro con email ya existente
- [ ] Registro con contraseña débil
- [ ] Registro con contraseñas no coincidentes
- [ ] Registro sin nombre o apellido

### Casos de Prueba - Cambio de Contraseña
- [ ] Cambio con contraseña actual correcta
- [ ] Cambio con contraseña actual incorrecta
- [ ] Cambio a contraseña igual a la actual
- [ ] Cambio con código inválido
- [ ] Cambio con código expirado

---

## Variables de Entorno Necesarias

```bash
# .env
VITE_API_BASE_URL=http://api.test.local/api/v1
```

---

## Próximos Pasos

1. Implementar persistencia de sesión
2. Agregar refresh token automático
3. Implementar logout en el componente
4. Agregar integración con rutas protegidas
5. Implementar recuperación de contraseña real (sin código hardcodeado)

---

## Notas Importantes

- **Cookies:** Las cookies se manejan automáticamente en `authService.ts` con `credentials: 'include'`
- **Base URL:** Actualizar en `authService.ts` según ambiente (dev/prod)
- **Token Expiry:** Access token: 15min, Refresh token: 7 días
- **Teléfono:** Campo opcional en registro

