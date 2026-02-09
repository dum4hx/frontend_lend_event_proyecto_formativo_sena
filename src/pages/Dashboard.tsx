import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col selection:bg-yellow-400 selection:text-black">

      <Encabezado />

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <section className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-6">
            <span className="inline-block py-1.5 px-4 text-[10px] md:text-xs font-bold tracking-widest text-yellow-400 uppercase border border-yellow-400/20 rounded-full bg-yellow-400/5">
              Nueva Era Digital
            </span>
          </div>

          {/* Titulo */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
            Revolucionando<br />
            <span className="text-yellow-400">Eventos corporativos</span>
          </h1>

          {/* Descripcion */}
          <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 md:mb-12">
            Transforme la forma en que gestiona y ejecuta sus eventos con nuestra plataforma de vanguardia.
            Optimice invitados, obtenga datos en tiempo real y automatice flujos de trabajo.
          </p>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/registro">
            <button className={`w-full sm:w-auto bg-yellow-400 text-black px-10 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 ${styles.glow_button}`}>
              Comenzar ahora
            </button>
            </a>
            <button className="w-full sm:w-auto bg-transparent border border-gray-700 hover:border-gray-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all hover:bg-gray-900/50">
              Ver demo
            </button>
          </div>
        </section>
      </main>

      <PiePagina />
    </div>
  )
}
