interface Props {
  titulo: string
  descripcion: string
  disponible: string
  imagen: string
}

export default function TarjetaProducto({
  titulo,
  descripcion,
  disponible,
  imagen
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow hover:shadow-lg transition">
      <img
        src={imagen}
        alt={titulo}
        className="h-48 w-full object-cover rounded-t-xl"
      />

      <div className="p-4">
        <h5 className="font-semibold">{titulo}</h5>
        <p className="text-sm text-gray-500">{descripcion}</p>
        <p className="mt-2 font-medium">Disponible: {disponible}</p>

        <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded">
          Ver detalles
        </button>
      </div>
    </div>
  )
}
