import { Link } from 'react-router-dom'

export default function Encabezado() {
  return (
    <header className="bg-black text-white">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-xl font-bold">Lend Event</h1>
          <small className="text-gray-300">
            Préstamo de materiales para eventos
          </small>
        </div>

        <nav className="flex items-center gap-4">
          <Link to="/" className="hover:text-yellow-400">Inicio</Link>
          <Link to="/servicios" className="hover:text-yellow-400">Servicios</Link>
          <Link to="/productos" className="hover:text-yellow-400">Productos</Link>
          <Link to="/paquetes" className="hover:text-yellow-400">Paquetes</Link>

          <Link to="/login" className="bg-white text-black px-3 py-1 rounded text-sm inline-block">
            Iniciar sesión
          </Link>

          <Link to="/registro" className="bg-yellow-400 text-black px-3 py-1 rounded text-sm inline-block">
            Registrarse
          </Link>
        </nav>
      </div>
    </header>
  )
}
