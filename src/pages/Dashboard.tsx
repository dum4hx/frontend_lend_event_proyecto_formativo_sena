import { useState } from 'react'
import { Link } from 'react-router-dom'
import Encabezado from "../components/Encabezado"
import TarjetaProducto from "../components/TarjetaProducto"
import TarjetaPaquete from "../components/TarjetaPaquete"
import PiePagina from "../components/PiePagina"

export default function Dashboard() {
  const [carouselIndex, setCarouselIndex] = useState(0)

  const slides = [
    {
      imagen: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30",
      titulo: "Todo lo que necesitas para tu evento, en un solo lugar",
      subtitulo: "Préstamo de materiales para reuniones, conciertos y eventos."
    },
    {
      imagen: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
      titulo: "Eventos inolvidables",
      subtitulo: "Sonido, iluminación y mobiliario"
    },
    {
      imagen: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea",
      titulo: "Todo en un solo lugar",
      subtitulo: "Rápido, fácil y seguro"
    }
  ]

  const pasos = [
    { numero: "1", titulo: "Explora", descripcion: "Revisa los productos y paquetes disponibles." },
    { numero: "2", titulo: "Selecciona", descripcion: "Elige fechas y cantidades necesarias." },
    { numero: "3", titulo: "Solicita", descripcion: "Realiza la solicitud de préstamo." },
    { numero: "4", titulo: "Disfruta", descripcion: "Recibe los materiales y ejecuta tu evento." }
  ]

  const productos = [
    {
      titulo: "Sillas plegables",
      descripcion: "Eventos grandes y reuniones.",
      disponible: "500",
      imagen: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc"
    },
    {
      titulo: "Mesas rectangulares",
      descripcion: "Banquetes y conferencias.",
      disponible: "120",
      imagen: "https://images.unsplash.com/photo-1554080221-cbf9f4f9cff7"
    },
    {
      titulo: "Equipo de sonido",
      descripcion: "Conciertos y fiestas.",
      disponible: "20 kits",
      imagen: "https://images.unsplash.com/photo-1511379938547-c1f69b13d835"
    },
    {
      titulo: "Iluminación LED",
      descripcion: "Ambientes personalizados.",
      disponible: "60",
      imagen: "https://images.unsplash.com/photo-1516876437184-593fda40c7ce"
    }
  ]

  const paquetes = [
    {
      titulo: "Paquete Básico",
      color: "border-blue-500",
      items: ["50 sillas", "5 mesas", "Sonido básico"],
      buttonColor: "bg-blue-500 hover:bg-blue-600"
    },
    {
      titulo: "Paquete Empresarial",
      color: "border-amber-500",
      items: ["150 sillas", "15 mesas", "Sonido profesional", "Iluminación"],
      buttonColor: "bg-amber-500 hover:bg-amber-600"
    },
    {
      titulo: "Paquete Premium",
      color: "border-gray-900",
      items: ["300 sillas", "30 mesas", "Escenario", "Sonido e iluminación avanzada"],
      buttonColor: "bg-gray-900 hover:bg-black"
    }
  ]

  function nextSlide() {
    setCarouselIndex((prev) => (prev + 1) % slides.length)
  }

  function prevSlide() {
    setCarouselIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Encabezado />

      {/* HERO CAROUSEL */}
      <section className="relative h-96 md:h-[520px] overflow-hidden bg-gray-900">
        <div className="relative h-full">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === carouselIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img src={slide.imagen} alt={slide.titulo} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white max-w-2xl px-4">
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">{slide.titulo}</h2>
                  <p className="text-lg md:text-xl text-gray-200 mb-8">{slide.subtitulo}</p>
                  {index === 0 && (
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                      <Link to="/productos" className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-yellow-500 transition">
                        Ver productos
                      </Link>
                      <button onClick={() => document.getElementById('proceso')?.scrollIntoView({ behavior: 'smooth' })} className="border-2 border-yellow-400 text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 hover:text-black transition">
                        Cómo funciona
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botones navegación */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
          aria-label="Slide anterior"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
          aria-label="Siguiente slide"
        >
          <i className="fas fa-chevron-right"></i>
        </button>

        {/* Indicadores */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCarouselIndex(index)}
              className={`w-3 h-3 rounded-full transition ${
                index === carouselIndex ? 'bg-yellow-400' : 'bg-gray-400'
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <main className="flex-1">
        {/* PROCESO */}
        <section id="proceso" className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-center mb-12">¿Cómo funciona el préstamo?</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {pasos.map((paso) => (
              <div key={paso.numero} className="text-center">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {paso.numero}
                </div>
                <h5 className="text-lg font-bold mb-2">{paso.titulo}</h5>
                <p className="text-gray-600">{paso.descripcion}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PRODUCTOS */}
        <section id="productos" className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-center mb-12">Productos disponibles</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productos.map((producto, i) => (
              <TarjetaProducto
                key={i}
                titulo={producto.titulo}
                descripcion={producto.descripcion}
                disponible={producto.disponible}
                imagen={producto.imagen}
              />
            ))}
          </div>
        </section>

        {/* PAQUETES */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-3xl font-bold text-center mb-12">Paquetes de préstamo</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paquetes.map((paquete, i) => (
              <TarjetaPaquete
                key={i}
                titulo={paquete.titulo}
                color={paquete.color}
                items={paquete.items}
              />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/paquetes" className="bg-yellow-400 text-black px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition inline-block">
              Ver todos los paquetes
            </Link>
          </div>
        </section>
      </main>

      <PiePagina />
    </div>
  )
}
