import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'
import { registerUser } from '../services/authService'
import { validateRegistrationForm } from '../utils/validators'
import styles from './Registro.module.css'

export default function Registro() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [legalName, setLegalName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate form
    const validation = validateRegistrationForm({
      firstName,
      lastName,
      email,
      organizationName,
      legalName,
      taxId,
      street,
      city,
      country,
      postalCode,
      password,
      confirmPassword,
      phone,
    })

    if (!validation.isValid) {
      setError(validation.message || 'Validación fallida')
      return
    }

    setLoading(true)

    try {
      // Build payload matching API documentation: organization + owner
      const payload = {
        organization: {
          name: organizationName,
          legalName: legalName || undefined,
          email: email,
          phone: phone || undefined,
          taxId: taxId,
          address: {
            street,
            city,
            country,
            postalCode,
          },
        },
        owner: {
          email: email,
          password: password,
          phone: phone || undefined,
          name: {
            firstName: firstName,
            secondName: undefined,
            firstSurname: lastName || undefined,
            secondSurname: undefined,
          },
        },
      }

      const response = await registerUser(payload)

      if (response.status === 'error') {
        setError(response.message || 'Error al crear la cuenta. Por favor intenta nuevamente.')
        return
      }

      // Success - navigate to login
      alert('Cuenta creada exitosamente. Por favor inicia sesión.')
      navigate('/login')
    } catch (err: any) {
      setError('Error de conexión. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Encabezado />

      <main className="flex-grow flex flex-col md:flex-row">
        {/* Sección Izquierda - Solo en Desktop */}
        <div className={`hidden md:flex md:w-1/2 ${styles.bgOverlay} p-12 lg:p-20 flex-col justify-center relative border-r border-zinc-800 z-0`}>
          <div className="z-20">
            {/* Logo */}
            <div className="flex items-center space-x-2 mb-12">
              <div className="bg-yellow-400 p-2 rounded-lg shadow-lg">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>

            {/* Título */}
            <h1 className="text-5xl text-white lg:text-6xl font-extrabold mb-6 leading-tight">
              Cree su cuenta<br />
              <span className="text-yellow-400">Corporativa</span>
            </h1>

            {/* Descripción */}
            <p className="text-gray-300 text-lg max-w-md mb-12 leading-relaxed">
              Únase a las empresas que ya están revolucionando sus eventos con nuestra tecnología
              de vanguardia.
            </p>

            {/* Características */}
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center border border-yellow-400/30">
                  <span className="text-yellow-400 text-xl font-bold">✓</span>
                </div>
                <div>
                  <p className="font-bold text-white">Configuración Instantánea</p>
                  <p className="text-sm text-gray-400">Acceda a su panel de control en menos de 2 minutos.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Derecha - Formulario */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black relative z-10 overflow-y-auto">
          <div className="w-full max-w-md py-12">
            <h2 className="text-4xl font-extrabold mb-2">Comenzar</h2>
            <p className="text-gray-400 mb-10">Cree su cuenta de Lend Event hoy mismo</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-red-400 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Nombre de la Empresa */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  placeholder="Tu Empresa Inc."
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Razón Social (Legal Name) - Opcional */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Razón Social (Legal Name) <span className="text-gray-600">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Tu Empresa S.A."
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* NIT / Tax ID */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  NIT / Tax ID
                </label>
                <input
                  type="text"
                  placeholder="123-456-789"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="tu@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Teléfono (Opcional) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Teléfono <span className="text-gray-600">(Opcional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Calle 123"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  placeholder="Bogotá"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  País
                </label>
                <input
                  type="text"
                  placeholder="Colombia"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  placeholder="110111"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Contraseña
                </label>
                <div className="text-xs text-gray-400 mb-2">
                  Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial (!@#$%^&*)
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Repita su contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200 disabled:opacity-50"
                />
              </div>

              {/* Botón Crear Cuenta */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} mt-4 shadow-xl hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition`}
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>

            {/* Link a Login */}
            <p className="text-center text-sm text-gray-500 mt-8">
              ¿Ya tiene una cuenta?{' '}
              <Link to="/login" className="text-yellow-400 font-bold hover:underline">
                Inicie sesión
              </Link>
            </p>
          </div>
        </div>
      </main>

      <PiePagina />
    </div>
  )
}