interface Props {
  titulo: string
  items: string[]
  color: string
}

export default function TarjetaPaquete({ titulo, items, color }: Props) {
  return (
    <div className={`border-2 ${color} rounded-xl p-6`}>
      <h5 className="font-semibold mb-4">{titulo}</h5>

      <ul className="list-disc pl-5 text-sm space-y-1">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <button className="mt-4 w-full bg-black text-white py-2 rounded">
        Consultar
      </button>
    </div>
  )
}
