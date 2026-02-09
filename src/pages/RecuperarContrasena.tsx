import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'
import styles from './RecuperarContrasena.module.css'

export default function RecuperarContrasena() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleGoToStep2 = () => {
    if (!email.includes('@')) {
      setError('Por favor, ingresa un correo válido.')
      return
    }
    setError('')
    setPaso(2)
  }

  const handleValidarCodigo = () => {
    if (codigo.length !== 6) {
      setError('El código debe tener 6 dígitos.')
      return
    }
    setError('')
    setPaso(3)
  }

  const handleCambiarContrasena = () => {
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError('')
    // Aquí iría la lógica para cambiar la contraseña en el servidor
    console.log({ email, codigo, newPassword })
    alert('Contraseña cambiada correctamente. Redirigiendo a login...')
    navigate('/login')
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
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white italic">
                Lend<span className="text-yellow-400">Event</span>
              </span>
            </div>

            {/* Título */}
            <h1 className="text-5xl text-white lg:text-6xl font-extrabold mb-6 leading-tight">
              Recupera tu<br />
              <span className="text-yellow-400">Acceso Seguro</span>
            </h1>

            {/* Descripción dinámica */}
            <p className="text-gray-300 text-lg max-w-md mb-12 leading-relaxed">
              {paso === 1
                ? 'Inicia el proceso de validación para restablecer tus credenciales corporativas.'
                : paso === 2
                ? 'Casi listo. Ingresa el código que acabamos de enviar a tu bandeja de entrada.'
                : 'Crea una contraseña fuerte y segura para tu cuenta.'}
            </p>
          </div>
        </div>

        {/* Sección Derecha - Formulario */}
        <div className="flex-grow md:w-1/2 flex items-center justify-center p-8 bg-black relative z-10">
          <div className="w-full max-w-md">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-500 hover:text-yellow-400 flex items-center mb-8 transition-colors group"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver
            </button>

            {/* PASO 1 */}
            {paso === 1 && (
              <div>
                <h2 className="text-4xl font-extrabold mb-2">Paso 1</h2>
                <p className="text-gray-400 mb-10">Ingresa tu correo para recibir un código de seguridad.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Correo Corporativo
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </span>
                      <input
                        type="email"
                        placeholder="nombre@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button
                    onClick={handleGoToStep2}
                    className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} shadow-xl hover:bg-yellow-300`}
                  >
                    Enviar Código
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2 */}
            {paso === 2 && (
              <div>
                <h2 className="text-4xl font-extrabold mb-2">Paso 2</h2>
                <p className="text-gray-400 mb-10">
                  Hemos enviado un código a <span className="text-yellow-400 font-bold">{email}</span>
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Código de 6 dígitos
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </span>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white font-mono text-2xl tracking-[0.5em] focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200 text-center"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button
                    onClick={handleValidarCodigo}
                    className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} shadow-xl hover:bg-yellow-300`}
                  >
                    Validar y Continuar
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    ¿No recibiste el código?{' '}
                    <button
                      onClick={() => setError('')}
                      className="text-yellow-400 font-bold hover:underline"
                    >
                      Reenviar
                    </button>
                  </p>
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {paso === 3 && (
              <div>
                <h2 className="text-4xl font-extrabold mb-2">Paso 3</h2>
                <p className="text-gray-400 mb-10">Crea tu nueva contraseña corporativa.</p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Nueva Contraseña
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </span>
                      <input
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      Confirmar Contraseña
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 group-focus-within:text-yellow-400 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </span>
                      <input
                        type="password"
                        placeholder="Repite tu contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition duration-200"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button
                    onClick={handleCambiarContrasena}
                    className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} shadow-xl hover:bg-yellow-300`}
                  >
                    Cambiar Contraseña
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    La contraseña debe tener al menos 8 caracteres
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <PiePagina />
    </div>
  )
}
