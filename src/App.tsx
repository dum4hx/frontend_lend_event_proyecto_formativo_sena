import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// Páginas públicas
import Dashboard from './pages/Dashboard'
import Paquetes from './pages/Paquetes'
import Login from './pages/Login'
import Registro from './pages/Registro'
import SobreNosotros from './pages/SobreNosotros'
import RecuperarContrasena from './pages/RecuperarContrasena'

// Admin
import AdminLayout from './modules/admin/layouts/AdminLayout'
import AdminDashboard from './modules/admin/pages/AdminDashboard'
import MyEvents from './modules/admin/pages/MyEvents'
import Team from './modules/admin/pages/Team'
import IASettings from './modules/admin/pages/IA_Settings'
import Settings from './modules/admin/pages/Settings'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/paquetes" element={<Paquetes />} />
          <Route path="/sobre-nosotros" element={<SobreNosotros />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

          {/* Rutas admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<MyEvents />} />
            <Route path="team" element={<Team />} />
            <Route path="ia-settings" element={<IASettings />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
