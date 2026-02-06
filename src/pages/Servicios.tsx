import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'

export default function Servicios() {
  const servicios = [
    {
      id: 1,
      titulo: 'Préstamo de Materiales',
      descripcion: 'Alquiler de equipos y materiales para eventos como conciertos, bodas, fiestas y reuniones corporativas.'
    },
    {
      id: 2,
      titulo: 'Paquetes para Eventos',
      descripcion: 'Combos de materiales predefinidos según el tipo de evento, optimizando costos y tiempos.'
    },
    {
      id: 3,
      titulo: 'Gestión de Reservas',
      descripcion: 'Control visual de disponibilidad, fechas de préstamo y devolución de los materiales.'
    },
    {
      id: 4,
      titulo: 'Asesoría para Eventos',
      descripcion: 'Orientación en la selección de materiales adecuados según el tipo y tamaño del evento.'
    },
    {
      id: 5,
      titulo: 'Control Administrativo',
      descripcion: 'Seguimiento de préstamos, clientes y estados de los materiales desde un panel administrativo.'
    },
    {
      id: 6,
      titulo: 'Soporte para Grandes Eventos',
      descripcion: 'Gestión de materiales para conciertos, ferias y eventos masivos con alta demanda logística.'
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Encabezado />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Nuestros Servicios</h1>
            <p className="text-lg text-gray-600">
              Soluciones completas para la gestión y préstamo de materiales para eventos de cualquier escala.
            </p>
          </div>
        </section>

        {/* SERVICIOS SECTION */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio) => (
              <div key={servicio.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h5 className="text-xl font-bold text-gray-900 mb-3">{servicio.titulo}</h5>
                <p className="text-gray-600">{servicio.descripcion}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">¿Listo para organizar tu evento?</h2>
            <p className="text-lg text-gray-300 mb-6">
              Descubre nuestros materiales y paquetes diseñados para facilitar tu evento.
            </p>
            <a href="#" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
              Ver Catálogo
            </a>
          </div>
        </section>
      </main>

      <PiePagina />
    </div>
  )
}
