import { useState } from 'react'
import { Link } from 'react-router-dom'
import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'

export default function Registro() {
  const [doc, setDoc] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [pass1, setPass1] = useState('')
  const [pass2, setPass2] = useState('')
  const [showPass1, setShowPass1] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [news, setNews] = useState(false)
  const [terms, setTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!terms) {
      setError('Debe aceptar los términos y condiciones')
      return
    }
    if (pass1.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (pass1 !== pass2) {
      setError('Las contraseñas no coinciden')
      return
    }

    console.log({ doc, nombre, email, telefono, news })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Encabezado />

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-3">Crear cuenta</h2>
              <p className="text-gray-500 mb-6">Únete a Lend Event y gestiona tus materiales de forma profesional.</p>

              <button className="w-full mb-4 flex items-center justify-center gap-3 py-2 rounded-lg border">
                <img src="https://lh3.googleusercontent.com/COxitqgJr1sICpeqCu7IFHICvmetssZPnYqghXY3CoYw-nZWTyz62n-buSAsz1YOTjn8wvB9i7as6W1OEIn8W47K6XyX-H6A6VmshQ=s0" width={20} alt="Google" />
                <span className="font-bold text-sm">Registrarse con Google</span>
              </button>

              <div className="relative my-4">
                <hr className="border-gray-200" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-3 text-gray-500 text-sm">o usa tu correo</span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="doc" className="block text-sm font-medium text-gray-700 mb-2">Documento de identificación</label>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <span className="px-3 text-gray-400"><i className="fas fa-id-card"></i></span>
                    <input id="doc" type="text" required value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="CC / NIT / CE" className="w-full px-3 py-2 focus:outline-none" />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <span className="px-3 text-gray-400"><i className="fas fa-user"></i></span>
                    <input id="nombre" type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" className="w-full px-3 py-2 focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <span className="px-3 text-gray-400"><i className="fas fa-envelope"></i></span>
                      <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@ejemplo.com" className="w-full px-3 py-2 focus:outline-none" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <span className="px-3 text-gray-400"><i className="fas fa-phone"></i></span>
                      <input id="telefono" type="tel" required value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="310..." className="w-full px-3 py-2 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div className="mb-4 mt-4">
                  <label htmlFor="pass1" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <span className="px-3 text-gray-400"><i className="fas fa-lock"></i></span>
                    <input id="pass1" type={showPass1 ? 'text' : 'password'} required value={pass1} onChange={(e) => setPass1(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full px-3 py-2 focus:outline-none" />
                    <button type="button" onClick={() => setShowPass1(s => !s)} className="px-3" aria-label={showPass1 ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      <i className={`fas ${showPass1 ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="pass2" className="block text-sm font-medium text-gray-700 mb-2">Confirmar contraseña</label>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <span className="px-3 text-gray-400"><i className="fas fa-check-double"></i></span>
                    <input id="pass2" type={showPass2 ? 'text' : 'password'} required value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="Repite tu contraseña" className="w-full px-3 py-2 focus:outline-none" />
                    <button type="button" onClick={() => setShowPass2(s => !s)} className="px-3" aria-label={showPass2 ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                      <i className={`fas ${showPass2 ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} />
                    <span>Acepto recibir novedades y promociones.</span>
                  </label>
                </div>

                <div className="mb-4">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                    <span>Acepto los <a href="#" className="text-blue-600">Términos</a> y <a href="#" className="text-blue-600">Privacidad</a>.</span>
                  </label>
                </div>

                {error && <p className="text-red-600 mb-4">{error}</p>}

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow mb-4">Crear mi cuenta</button>

                <p className="text-center">¿Ya tienes cuenta? <Link to="/login" className="font-bold">Inicia sesión</Link></p>
              </form>
            </div>

            <div className="hidden lg:block relative">
              <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622" alt="Evento" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center">
                <div className="p-8 text-white">
                  <h2 className="text-3xl font-bold mb-4">Lleva tus eventos al siguiente nivel</h2>
                  <p className="mb-6">Únete a la red más grande de gestión de materiales tecnológicos y logísticos.</p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3"><i className="fas fa-check-circle text-blue-400"></i><span>Materiales de última tecnología</span></li>
                    <li className="flex items-center gap-3"><i className="fas fa-check-circle text-blue-400"></i><span>Seguro de protección incluido</span></li>
                    <li className="flex items-center gap-3"><i className="fas fa-check-circle text-blue-400"></i><span>Soporte técnico 24/7</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PiePagina />
    </div>
  )
}
