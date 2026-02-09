import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Paquetes from './pages/Paquetes'
import Login from './pages/Login'
import Registro from './pages/Registro'
import SobreNosotros from './pages/SobreNosotros'
import RecuperarContrasena from './pages/RecuperarContrasena'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/paquetes" element={<Paquetes />} />
        <Route path="/sobre-nosotros" element={<SobreNosotros />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
