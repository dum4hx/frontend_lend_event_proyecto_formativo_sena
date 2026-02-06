import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'

export default function Paquetes() {
  const paquetes = [
    {
      id: 1,
      nombre: 'Paquete Básico',
      descripcion: 'Ideal para reuniones pequeñas',
      items: [
        '50 sillas plegables',
        '5 mesas',
        'Sonido básico',
        'Duración: 1 día'
      ],
      estado: 'Disponibilidad inmediata',
      borderColor: 'border-blue-500',
      headerBg: 'bg-blue-500',
      headerText: 'text-white',
      buttonStyle: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50'
    },
    {
      id: 2,
      nombre: 'Paquete Empresarial',
      descripcion: 'Eventos corporativos y conferencias',
      items: [
        '150 sillas',
        '15 mesas',
        'Sonido profesional',
        'Iluminación básica',
        'Duración: 2 días'
      ],
      estado: 'Alta demanda',
      borderColor: 'border-amber-500',
      headerBg: 'bg-amber-500',
      headerText: 'text-black',
      buttonStyle: 'bg-amber-500 text-black hover:bg-amber-600'
    },
    {
      id: 3,
      nombre: 'Paquete Premium',
      descripcion: 'Conciertos, bodas y eventos masivos',
      items: [
        '300 sillas',
        '30 mesas',
        'Escenario modular',
        'Sonido profesional',
        'Iluminación avanzada',
        'Duración: 3 días'
      ],
      estado: 'Paquete completo',
      borderColor: 'border-gray-900',
      headerBg: 'bg-gray-900',
      headerText: 'text-white',
      buttonStyle: 'bg-gray-900 text-white hover:bg-black'
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Encabezado />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Paquetes de Préstamo</h1>
            <p className="text-lg text-gray-600">
              Soluciones listas para diferentes tipos de eventos
            </p>
          </div>
        </section>

        {/* PAQUETES SECTION */}
        <section className="max-w-7xl mx-auto px-6 my-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {paquetes.map((paquete) => (
              <div
                key={paquete.id}
                className={`border-2 ${paquete.borderColor} rounded-lg overflow-hidden flex flex-col bg-white`}
              >
                {/* Header */}
                <div className={`${paquete.headerBg} ${paquete.headerText} py-4 px-6 text-center`}>
                  <h5 className="text-xl font-bold mb-0">{paquete.nombre}</h5>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-center text-gray-600 mb-6">
                    {paquete.descripcion}
                  </p>

                  {/* Items List */}
                  <ul className="space-y-3 mb-6 flex-1">
                    {paquete.items.map((item, index) => (
                      <li
                        key={index}
                        className="py-2 px-3 border-b border-gray-200 text-gray-700"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* Status */}
                  <p className="font-bold text-center text-green-600 mb-6">
                    {paquete.estado}
                  </p>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6">
                  <button
                    className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${paquete.buttonStyle}`}
                  >
                    Consultar paquete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PiePagina />
    </div>
  )
}
