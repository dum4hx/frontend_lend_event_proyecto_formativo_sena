export default function Hero() {
  return (
    <section className="h-[520px] bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        <h2 className="text-4xl font-bold">
          Todo lo que necesitas para tu evento
        </h2>

        <p className="mt-4 text-gray-300">
          Préstamo de materiales para reuniones, conciertos y eventos
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <button className="bg-yellow-400 text-black px-6 py-3 rounded-lg">
            Ver productos
          </button>
          <button className="border border-yellow-400 px-6 py-3 rounded-lg">
            Cómo funciona
          </button>
        </div>
      </div>
    </section>
  )
}
