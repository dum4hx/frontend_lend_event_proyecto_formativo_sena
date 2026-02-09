import { useState } from 'react'
import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'
import styles from './Paquetes.module.css'

export default function Paquetes() {
  const [extra, setExtra] = useState(0)

  const handleAddExtra = () => {
    setExtra(extra + 1)
  }

  const handleRemoveExtra = () => {
    if (extra > 0) {
      setExtra(extra - 1)
    }
  }

  const totalAccounts = 10 + extra
  const totalPrice = 99 + extra * 10

  return (
    <div className="bg-black text-white min-h-screen flex flex-col">
      <Encabezado />

      <main className="flex-grow py-16 px-4">
        <section className="max-w-6xl mx-auto text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Precios <span className="text-yellow-400">Simples</span>
          </h2>
          <p className="text-gray-400 mb-12">Elija el plan perfecto para su empresa</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Plan Básico */}
            <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 flex flex-col">
              <h3 className="text-xl font-bold text-left">Básico</h3>
              <p className="text-gray-500 text-sm text-left mb-4">
                Ideal para equipos pequeños
              </p>
              <div className="text-left mb-6">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-500">/mes</span>
              </div>
              <ul className="text-left space-y-4 mb-8 flex-grow text-sm">
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Hasta 5 cuentas de equipo
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Gestiona hasta 10 eventos
                  simultáneos
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Análisis básico de eventos
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Soporte vía email (respuesta
                  48h)
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Gestión de lista de invitados
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Check-in mediante código QR
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Plantillas de eventos
                  estándar
                </li>
              </ul>
              <button className={`bg-yellow-400 text-black font-bold py-3 rounded-xl ${styles.glowButton}`}>
                Comprar Ahora
              </button>
            </div>

            {/* Plan Pro */}
            <div className="bg-zinc-900 border-2 border-yellow-400 p-8 rounded-3xl relative flex flex-col shadow-2xl scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-4 py-1 rounded-full uppercase">
                Más Popular
              </div>
              <h3 className="text-xl font-bold text-left">Pro Plan</h3>
              <div className="text-left mb-6">
                <span className="text-5xl font-extrabold">${totalPrice}</span>
                <span className="text-gray-500 text-sm ml-2">por mes</span>
              </div>

              <div className="bg-black/50 border border-zinc-800 rounded-xl p-5 mb-8 text-left">
                <div className="flex justify-between text-xs mb-1 text-gray-400">
                  <span>Total de Cuentas</span>
                  <span className="font-bold text-white">{totalAccounts}</span>
                </div>
                <div className="flex justify-between text-xs mb-4 text-gray-500 border-b border-zinc-800 pb-2">
                  <span>Base (10 cuentas)</span>
                  <span>$99</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-2 uppercase font-bold tracking-wider">
                  Cuentas Adicionales ($10 c/u)
                </p>
                <div className="flex items-center bg-zinc-800 rounded-lg p-1">
                  <button
                    onClick={handleRemoveExtra}
                    className="w-8 h-8 flex items-center justify-center hover:text-yellow-400 transition text-xl"
                  >
                    −
                  </button>
                  <div className="flex-grow text-center font-bold text-sm">{extra}</div>
                  <button
                    onClick={handleAddExtra}
                    className="w-8 h-8 flex items-center justify-center hover:text-yellow-400 transition text-xl"
                  >
                    +
                  </button>
                </div>
              </div>

              <ul className="text-left space-y-3 mb-8 flex-grow text-[13px]">
                <li className="flex items-start text-gray-300">
                  <span className={styles.checkIcon}>✔</span> 10 cuentas base + adicionales
                  ilimitadas
                </li>
                <li className="flex items-start text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Eventos ilimitados
                </li>
                <li className="flex items-start text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Análisis y reportes avanzados
                </li>
                <li className="flex items-start text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Soporte prioritario (respuesta
                  24h)
                </li>
                <li className="flex items-start text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Marca personalizada y
                  White-label
                </li>
                <li className="flex items-start text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Acceso a la API
                </li>
                <li className="flex items-start text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Herramientas de automatización
                  avanzada
                </li>
                <li className="flex items-start text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Funciones de colaboración en
                  equipo
                </li>
                <li className="flex items-start text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Plantillas de eventos
                  personalizadas
                </li>
              </ul>
              <button className={`bg-yellow-400 text-black font-bold py-4 rounded-xl ${styles.glowButton}`}>
                Comprar Ahora
              </button>
            </div>

            {/* Plan Enterprise */}
            <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 flex flex-col">
              <h3 className="text-xl font-bold text-left">Enterprise</h3>
              <p className="text-gray-500 text-sm text-left mb-4">
                Para grandes organizaciones
              </p>
              <div className="text-left mb-6">
                <span className="text-4xl font-bold">$499</span>
                <span className="text-gray-500">/mes</span>
              </div>
              <ul className="text-left space-y-4 mb-8 flex-grow text-sm">
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Invitados ilimitados
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Analítica de nivel empresarial
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Gestor de cuenta dedicado
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Solución completa White-label
                </li>
                <li className="flex items-center text-gray-300">
                  <span className={styles.checkIcon}>✔</span> Integraciones personalizadas
                </li>
              </ul>
              <button className={`bg-yellow-400 text-black font-bold py-3 rounded-xl ${styles.glowButton}`}>
                Comprar Ahora
              </button>
            </div>
          </div>
        </section>
      </main>

      <PiePagina />
    </div>
  )
}
