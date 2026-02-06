export default function PiePagina() {
  return (
    <footer className="bg-black text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 text-sm">

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">

          {/* Producto */}
          <div>
            <h6 className="font-bold mb-4 text-white">Producto</h6>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Panel de control</a></li>
              <li><a href="#" className="hover:text-white">Apps e Integraciones</a></li>
              <li><a href="#" className="hover:text-white">Empresarial</a></li>
              <li><a href="#" className="hover:text-white">Accesibilidad</a></li>
              <li><a href="#" className="hover:text-white">Registro de cambios</a></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h6 className="font-bold mb-4 text-white">Soporte técnico</h6>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Contacto</a></li>
              <li><a href="#" className="hover:text-white">Pagos</a></li>
            </ul>
          </div>

          {/* Corporativo */}
          <div>
            <h6 className="font-bold mb-4 text-white">Corporativo</h6>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Sobre nosotros</a></li>
              <li><a href="#" className="hover:text-white">Negocios</a></li>
              <li><a href="#" className="hover:text-white">Precios</a></li>
              <li><a href="#" className="hover:text-white">Publicaciones</a></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h6 className="font-bold mb-4 text-white">Recursos</h6>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Novedades</a></li>
              <li><a href="#" className="hover:text-white">Centro de ayuda</a></li>
            </ul>
          </div>

          {/* Ubicación + redes */}
          <div className="col-span-2">
            <h6 className="font-bold mb-4 text-white">Ubicación</h6>

            <div className="flex items-center gap-2 mb-6">
              <img
                src="https://flagcdn.com/w20/co.png"
                alt="Colombia"
                className="w-5 h-auto"
              />
              <span>Colombia</span>
            </div>

            <div className="flex gap-4 text-lg">
              <a href="#" className="hover:text-white"><i className="fab fa-instagram"></i></a>
              <a href="#" className="hover:text-white"><i className="fab fa-facebook"></i></a>
              <a href="#" className="hover:text-white"><i className="fab fa-youtube"></i></a>
              <a href="#" className="hover:text-white"><i className="fab fa-x-twitter"></i></a>
            </div>
          </div>
        </div>

        {/* LINEA INFERIOR */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-wrap gap-6 items-center text-xs text-gray-400">
          <span>© 2026 Lend-Event</span>
          <a href="#" className="hover:text-white">Términos de servicio</a>
          <a href="#" className="hover:text-white">Política de cookies</a>
        </div>

      </div>
    </footer>
  )
}
