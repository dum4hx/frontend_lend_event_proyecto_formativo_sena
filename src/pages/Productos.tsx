import { useState, useMemo } from 'react'
import Encabezado from '../components/Encabezado'
import PiePagina from '../components/PiePagina'

export default function Productos() {
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const productos = [
    {
      id: 1,
      nombre: 'MacBook Pro M3',
      categoria: 'Tecnología',
      eventos: ['Corporativos'],
      descripcion: 'Para presentaciones de alto rendimiento y edición en vivo.',
      disponibles: 12,
      imagen: 'img/macBook_pro_m3.png'
    },
    {
      id: 2,
      nombre: 'Proyector Láser 4K',
      categoria: 'Tecnología',
      eventos: ['Corporativos', 'Fiestas'],
      descripcion: 'Máxima nitidez para conferencias y cine al aire libre.',
      disponibles: 8,
      imagen: 'img/proyector_laser_4K.png'
    },
    {
      id: 3,
      nombre: 'iPad Pro (Registro)',
      categoria: 'Tecnología',
      eventos: ['Corporativos'],
      descripcion: 'Ideal para control de acceso y registro de invitados.',
      disponibles: 25,
      imagen: 'img/ipad_pro.png'
    },
    {
      id: 4,
      nombre: 'Mezcladora Digital',
      categoria: 'Sonido',
      eventos: ['Conciertos', 'Fiestas'],
      descripcion: 'Consola de 32 canales para bandas en vivo.',
      disponibles: 5,
      imagen: 'img/mezcladora_digital.png'
    },
    {
      id: 5,
      nombre: 'Sillas Plegables Luxe',
      categoria: 'Mobiliario',
      eventos: ['Bodas', 'Fiestas'],
      descripcion: 'Comodidad y elegancia para tus invitados.',
      disponibles: 500,
      imagen: 'img/sillas_plegables_luxe.png'
    }
  ]

  const filteredProducts = useMemo(() => {
    return productos.filter(product => {
      const matchesSearch = product.nombre.toLowerCase().includes(searchText.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || product.categoria === categoryFilter
      const matchesEvent = eventFilter === 'all' || product.eventos.includes(eventFilter)

      return matchesSearch && matchesCategory && matchesEvent
    })
  }, [searchText, categoryFilter, eventFilter, productos])

  const getCategoryBadgeColor = (categoria: string): string => {
    if (categoria === 'Tecnología') return 'bg-purple-600'
    if (categoria === 'Sonido') return 'bg-blue-500'
    if (categoria === 'Mobiliario') return 'bg-cyan-500'
    if (categoria === 'Iluminación') return 'bg-yellow-500'
    return 'bg-gray-500'
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Encabezado />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-gray-100 py-12 border-b">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Catálogo de Productos</h1>
            <p className="text-lg text-gray-600">
              Explora equipos de alta gama y tecnología para tus eventos corporativos y sociales.
            </p>
          </div>
        </section>

        {/* FILTROS SECTION */}
        <section className="max-w-7xl mx-auto px-6 my-8">
          <div className="bg-white p-6 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="col-span-1 lg:col-span-1">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Buscar laptop, proyectores, sonido..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filtro Categoría */}
            <div>
              <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas las Categorías</option>
                <option value="Tecnología">Tecnología y Electrónica</option>
                <option value="Mobiliario">Mobiliario</option>
                <option value="Sonido">Sonido y Audio</option>
                <option value="Iluminación">Iluminación</option>
                <option value="Escenarios">Escenarios</option>
              </select>
            </div>

            {/* Filtro Evento */}
            <div>
              <label htmlFor="eventFilter" className="block text-sm font-medium text-gray-700 mb-2">
                Evento
              </label>
              <select
                id="eventFilter"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Cualquier Evento</option>
                <option value="Corporativos">Corporativos / Workshops</option>
                <option value="Conciertos">Conciertos</option>
                <option value="Bodas">Bodas</option>
                <option value="Fiestas">Fiestas Privadas</option>
              </select>
            </div>

            {/* Botón Filtrar */}
            <div>
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Filtrar
              </button>
            </div>
          </div>
        </section>

        {/* PRODUCTOS SECTION */}
        <section className="max-w-7xl mx-auto px-6 pb-12">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((producto) => (
                <div key={producto.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                  <img src={producto.imagen} alt={producto.nombre} className="w-full h-48 object-cover bg-gray-200" />
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <span className={`${getCategoryBadgeColor(producto.categoria)} text-white text-xs font-bold px-3 py-1 rounded w-fit mb-2`}>
                      {producto.categoria}
                    </span>
                    
                    <h5 className="text-lg font-bold text-gray-900 mb-2">{producto.nombre}</h5>
                    <p className="text-sm text-gray-600 mb-3 flex-1">{producto.descripcion}</p>
                    
                    <p className="font-bold text-green-600 mb-4">Disponibles: {producto.disponibles}</p>
                    
                    <button className="w-full border-2 border-blue-500 text-blue-500 font-bold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors">
                      Ver detalles
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-laptop-code text-4xl text-gray-400 mb-4 block"></i>
              <p className="text-xl text-gray-600">No encontramos lo que buscas. Intenta con otra categoría.</p>
            </div>
          )}
        </section>
      </main>

      <PiePagina />
    </div>
  )
}
