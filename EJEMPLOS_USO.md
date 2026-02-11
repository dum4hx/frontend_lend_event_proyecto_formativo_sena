"""
📚 EJEMPLOS DE USO - VALIDACIONES DE AUTENTICACIÓN
"""

═══════════════════════════════════════════════════════════════════════════════
1️⃣ EJEMPLO: USO DE VALIDADORES
═══════════════════════════════════════════════════════════════════════════════

// Validación individual de email
import { validateEmail } from '../utils/validators'

const email = "usuario@empresa.com"
const result = validateEmail(email)

if (result.isValid) {
  console.log("Email válido ✓")
} else {
  console.log(`Error: ${result.message}`)
  // "Ingresa un correo válido"
}


// Validación de contraseña
import { validatePassword } from '../utils/validators'

const password = "MyPassword123!"
const result = validatePassword(password)

if (!result.isValid) {
  alert(result.message)
  // "La contraseña debe contener al menos una mayúscula"
}


// Validación completa del formulario de login
import { validateLoginForm } from '../utils/validators'

const formData = {
  email: "usuario@empresa.com",
  password: "MyPassword123!"
}

const validation = validateLoginForm(formData)

if (validation.isValid) {
  // Enviar a la API
  console.log("Formulario válido, enviando...")
} else {
  console.log(`Error: ${validation.message}`)
}


═══════════════════════════════════════════════════════════════════════════════
2️⃣ EJEMPLO: USO DEL SERVICIO DE LOGIN
═══════════════════════════════════════════════════════════════════════════════

import { loginUser } from '../services/authService'
import { validateLoginForm } from '../utils/validators'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function LoginExample() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // 1. Validar en cliente
    const validation = validateLoginForm({ email, password })
    if (!validation.isValid) {
      setError(validation.message)
      return
    }

    // 2. Mostrar loading
    setLoading(true)

    try {
      // 3. Llamar a la API
      const response = await loginUser({ email, password })

      // 4. Manejar respuesta
      if (response.status === 'error') {
        setError(response.message || 'Error al iniciar sesión')
        return
      }

      // 5. Éxito - redirigir
      navigate('/dashboard')
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {error && <div className="error-box">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        placeholder="tu@empresa.com"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        placeholder="Contraseña"
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Iniciando...' : 'Login'}
      </button>
    </form>
  )
}


═══════════════════════════════════════════════════════════════════════════════
3️⃣ EJEMPLO: USO DEL SERVICIO DE REGISTRO
═══════════════════════════════════════════════════════════════════════════════

import { registerUser } from '../services/authService'
import { validateRegistrationForm } from '../utils/validators'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RegistroExample() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    organizationName: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 1. Validar formulario completo
    const validation = validateRegistrationForm(formData)
    if (!validation.isValid) {
      setError(validation.message)
      return
    }

    // 2. Mostrar loading
    setLoading(true)

    try {
      // 3. Llamar a la API
      const response = await registerUser({
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined
        }
      })

      // 4. Manejar respuesta
      if (response.status === 'error') {
        setError(response.message || 'Error al crear la cuenta')
        return
      }

      // 5. Éxito - ir a login
      alert('Cuenta creada exitosamente')
      navigate('/login')
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-box">{error}</div>}

      <input
        type="text"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        placeholder="Nombre"
        disabled={loading}
      />

      <input
        type="text"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        placeholder="Apellido"
        disabled={loading}
      />

      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        disabled={loading}
      />

      <input
        type="text"
        name="organizationName"
        value={formData.organizationName}
        onChange={handleChange}
        placeholder="Nombre de Empresa"
        disabled={loading}
      />

      <input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Teléfono (opcional)"
        disabled={loading}
      />

      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Contraseña"
        disabled={loading}
      />
      <small>Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial</small>

      <input
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Confirmar Contraseña"
        disabled={loading}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
      </button>
    </form>
  )
}


═══════════════════════════════════════════════════════════════════════════════
4️⃣ EJEMPLO: USO DEL SERVICIO DE CAMBIO DE CONTRASEÑA
═══════════════════════════════════════════════════════════════════════════════

import { changePassword } from '../services/authService'
import { validateChangePasswordForm } from '../utils/validators'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CambiarContrasenaExample() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 1. Validar formulario
    const validation = validateChangePasswordForm(formData)
    if (!validation.isValid) {
      setError(validation.message)
      return
    }

    // 2. Mostrar loading
    setLoading(true)

    try {
      // 3. Llamar a la API
      const response = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })

      // 4. Manejar respuesta
      if (response.status === 'error') {
        setError(response.message || 'Error al cambiar la contraseña')
        return
      }

      // 5. Éxito - redirigir
      alert('Contraseña cambiada exitosamente')
      navigate('/login')
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-box">{error}</div>}

      <label>Contraseña Actual</label>
      <input
        type="password"
        name="currentPassword"
        value={formData.currentPassword}
        onChange={handleChange}
        placeholder="Tu contraseña actual"
        disabled={loading}
      />

      <label>Nueva Contraseña</label>
      <input
        type="password"
        name="newPassword"
        value={formData.newPassword}
        onChange={handleChange}
        placeholder="Tu nueva contraseña"
        disabled={loading}
      />
      <small>Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial</small>

      <label>Confirmar Contraseña</label>
      <input
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Repite tu contraseña"
        disabled={loading}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
      </button>
    </form>
  )
}


═══════════════════════════════════════════════════════════════════════════════
5️⃣ EJEMPLO: VALIDACIÓN MANUAL PASO A PASO
═══════════════════════════════════════════════════════════════════════════════

import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateFirstName
} from '../utils/validators'

function validateMultipleCampos() {
  const campos = {
    email: 'usuario@empresa.com',
    firstName: 'John',
    password: 'MyPassword123!',
    confirmPassword: 'MyPassword123!'
  }

  // Validar email
  const emailCheck = validateEmail(campos.email)
  console.log('Email:', emailCheck.isValid ? '✓' : `✗ ${emailCheck.message}`)

  // Validar nombre
  const nameCheck = validateFirstName(campos.firstName)
  console.log('Nombre:', nameCheck.isValid ? '✓' : `✗ ${nameCheck.message}`)

  // Validar contraseña
  const pwdCheck = validatePassword(campos.password)
  console.log('Password:', pwdCheck.isValid ? '✓' : `✗ ${pwdCheck.message}`)

  // Validar confirmación
  const confirmCheck = validateConfirmPassword(
    campos.password,
    campos.confirmPassword
  )
  console.log('Confirm:', confirmCheck.isValid ? '✓' : `✗ ${confirmCheck.message}`)

  // Todo validado?
  const todoOK = emailCheck.isValid &&
    nameCheck.isValid &&
    pwdCheck.isValid &&
    confirmCheck.isValid

  return todoOK
}


═══════════════════════════════════════════════════════════════════════════════
6️⃣ EJEMPLO: MANEJO DE ERRORES COMPLETO
═══════════════════════════════════════════════════════════════════════════════

async function manejarLoginCompleto(email, password) {
  // 1. Validación local
  const validation = validateLoginForm({ email, password })
  if (!validation.isValid) {
    // Error de cliente - mostrar mensaje
    console.error('Validación fallida:', validation.message)
    mostrarError(validation.message)
    return
  }

  // 2. Intentar login
  try {
    const response = await loginUser({ email, password })

    // 3. Manejar respuesta
    if (response.status === 'error') {
      // Error de servidor
      console.error('Error de servidor:', response.message, response.code)
      mostrarError(response.message)

      // Errores específicos
      if (response.code === 'INVALID_CREDENTIALS') {
        console.log('Credenciales inválidas')
      } else if (response.code === 'ORGANIZATION_INACTIVE') {
        console.log('Organización inactiva')
      }
      return
    }

    // 4. Éxito
    console.log('Login exitoso:', response.data.user)
    irADashboard()

  } catch (error) {
    // Error de red
    console.error('Error de conexión:', error)
    mostrarError('Error de conexión. Intenta nuevamente.')
  }
}

function mostrarError(mensaje) {
  // Mostrar en UI
  document.getElementById('error-box').textContent = mensaje
  document.getElementById('error-box').style.display = 'block'
}

function irADashboard() {
  window.location.href = '/dashboard'
}


═══════════════════════════════════════════════════════════════════════════════
7️⃣ EJEMPLO: TESTING CON DIFERENTES CONTRASEÑAS
═══════════════════════════════════════════════════════════════════════════════

const validarMultiplesPwd = () => {
  const passwordsAProbar = {
    'MyPassword123!' : true,      // ✓ Válida
    'SecurePass456@' : true,      // ✓ Válida
    'password123!' : false,       // ✗ Sin mayúscula
    'Password!' : false,          // ✗ Sin número
    'Password123' : false,        // ✗ Sin especial
    'Pass1!' : false,             // ✗ Muy corta
    'ALLUPPERCASE1!' : false,     // ✗ Sin minúscula
    '123456789!' : false,         // ✗ Sin letra
  }

  Object.entries(passwordsAProbar).forEach(([pwd, debeSerValida]) => {
    const result = validatePassword(pwd)
    const esValida = result.isValid

    const estado = esValida === debeSerValida ? '✓' : '✗'
    console.log(`${estado} "${pwd}" → ${esValida ? 'Válida' : result.message}`)
  })
}


═══════════════════════════════════════════════════════════════════════════════
"""
