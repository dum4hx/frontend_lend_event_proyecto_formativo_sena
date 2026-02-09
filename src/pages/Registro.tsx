import { useState } from 'react'
import { Link } from 'react-router-dom'
import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'
import styles from './Registro.module.css'

export default function Registro() {
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log({ nombreCompleto, empresa, email, password, confirmPassword })
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
              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200"
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
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200"
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200"
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 px-4 text-white focus:border-yellow-400 outline-none transition duration-200"
                />
              </div>

              {/* Botón Crear Cuenta */}
              <button
                type="submit"
                className={`w-full bg-yellow-400 text-black font-extrabold py-4 rounded-xl text-lg ${styles.glowButton} mt-4 shadow-xl hover:bg-yellow-300`}
              >
                Crear Cuenta
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