import Header from '../components/Header'
import Footer from '../components/Footer'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col selection:bg-yellow-400 selection:text-black">

      <Header />

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        <section className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="mb-6">
            <span className="inline-block py-1.5 px-4 text-[10px] md:text-xs font-bold tracking-widest text-yellow-400 uppercase border border-yellow-400/20 rounded-full bg-yellow-400/5">
              Digital Era
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-[1.1]">
            Revolutionizing<br />
            <span className="text-yellow-400">Corporate Events</span>
          </h1>

          {/* Description */}
          <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 md:mb-12">
            Transform the way you manage and execute your events with our cutting-edge platform.
            Optimize guest management, get real-time data, and automate workflows.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/sign-up">
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

      <Footer />
    </div>
  )
}
