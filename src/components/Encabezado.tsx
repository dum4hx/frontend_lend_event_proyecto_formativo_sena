import { Link } from 'react-router-dom'
import styles from './Encabezado.module.css'

export default function Encabezado() {
  return (
    <header className="w-full bg-black text-white border-b border-zinc-800">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-8">
        <div className="text-2xl font-extrabold tracking-tighter">
          <Link to="/" className="flex items-center hover:opacity-90 transition">
            <span className="text-white">Lend</span>
            <span className="text-yellow-400">Event</span>
          </Link>
        </div>

        <ul className="hidden md:flex items-center space-x-10 text-sm font-medium text-gray-400">
          <li>
            <Link to="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
          </li>
          <li>
            <Link to="/paquetes" className="hover:text-white transition-colors">
              Paquetes
            </Link>
          </li>
          <li>
            <Link to="/sobre-nosotros" className="hover:text-white transition-colors">
              Sobre nosotros
            </Link>
          </li>
        </ul>

        <div className="flex items-center space-x-4 md:space-x-6">
          <Link
            to="/login"
            className="hidden sm:block text-sm font-semibold text-white hover:text-gray-300 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            to="/registro"
            className={`bg-yellow-400 text-black px-4 py-2 md:px-6 md:py-2.5 rounded-lg font-bold text-sm ${styles.glow_button}`}
          >
            Registrarse
          </Link>
        </div>
      </nav>
    </header>
  )
}
