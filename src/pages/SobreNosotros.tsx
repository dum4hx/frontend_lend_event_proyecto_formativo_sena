import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'
import styles from './SobreNosotros.module.css'

export default function SobreNosotros() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <Encabezado />

      <main className="flex-grow flex items-center justify-center px-6 py-20">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Contenido de texto */}
          <div className="space-y-8">
            <h2 className="text-5xl font-extrabold tracking-tight">
              Acerca de <span className="text-yellow-400">Lend Event</span>
            </h2>

            <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
              <p>
                Tenemos la misión de transformar la manera en que las empresas planifican y
                ejecutan sus eventos corporativos. Fundada en 2024, Lend Event combina
                tecnología de vanguardia y una profunda experiencia en la industria para
                ofrecer una plataforma que realmente entiende sus necesidades.
              </p>
              <p>
                Nuestro equipo de profesionales de eventos e ingenieros de software trabaja
                incansablemente para garantizar que cada función que construimos resuelve
                problemas reales y entrega un valor medible a nuestros clientes.
              </p>
            </div>

            <a href="/paquetes">
              <button className={`bg-yellow-400 text-black font-bold py-4 px-10 rounded-xl text-lg ${styles.glowButton}`}>
                Únete a Nosotros Hoy
              </button>
            </a>
          </div>

          {/* Tarjeta de característica */}
          <div className={`${styles.featureCard} rounded-3xl p-12 flex flex-col items-center justify-center text-center aspect-video lg:aspect-square`}>
            <div className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>

            <p className="text-2xl md:text-3xl font-medium text-gray-300">
              Impulsando <span className="text-yellow-400 font-bold">10,000+</span> eventos en
              todo el mundo
            </p>
          </div>
        </div>
      </main>

      <PiePagina />
    </div>
  )
}
