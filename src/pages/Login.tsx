import { useState } from 'react'
import { Link } from 'react-router-dom'
import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log({ email, password, remember })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Encabezado />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Bienvenido</h2>
                <p className="text-gray-500 text-sm">Ingresa tus credenciales para continuar</p>
              </div>

              <button className="w-full mb-4 flex items-center justify-center gap-3 py-2 rounded-lg border">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" width={18} alt="Google" />
                <span className="font-bold text-sm">Continuar con Google</span>
              </button>

              <div className="relative my-4">
                <hr className="border-gray-200" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-3 text-gray-500 text-sm">o usa tu correo</span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <span className="px-3 text-gray-400"><i className="fas fa-envelope"></i></span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                      className="w-full px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <span className="px-3 text-gray-400"><i className="fas fa-lock"></i></span>
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      className="px-3"
                      aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span>Recordarme</span>
                  </label>
                  <Link to="#" className="text-sm font-bold text-gray-700">¿Olvidaste tu contraseña?</Link>
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow">
                  Iniciar sesión
                </button>

                <p className="text-center text-sm text-gray-600 mt-4">¿No tienes una cuenta? <Link to="#" className="font-bold">Regístrate ahora</Link></p>
              </form>
            </div>
          </div>
        </div>
      </main>

      <PiePagina />
    </div>
  )
}
