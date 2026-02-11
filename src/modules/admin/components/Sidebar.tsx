import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Bot,
  LogOut
} from 'lucide-react';
import { logoutUser } from '../../../services/authService';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin' },
  { id: 'events', label: 'My Events', icon: <Calendar size={20} />, path: '/admin/events' },
  { id: 'team', label: 'Team', icon: <Users size={20} />, path: '/admin/team' },
  { id: 'ia-settings', label: 'IA Settings', icon: <Bot size={20} />, path: '/admin/ia-settings' },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/admin/settings' },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await logoutUser();

      if (response.status === 'success') {
        // Clear any stored auth data if needed
        localStorage.removeItem('authToken');
        // Redirect to login
        navigate('/login');
      } else {
        alert('Error al cerrar sesión: ' + response.message);
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error al cerrar sesión');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-[#121212] border-r border-[#333] flex flex-col p-6 overflow-y-auto">
      
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#FFD700]">Lend Admin</h1>
        <p className="text-xs text-gray-500 mt-1">Event Management</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all ${
                isActive
                  ? 'bg-[#FFD700] text-black font-semibold'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-[#FFD700]'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 rounded-[8px] transition-all mt-4 disabled:opacity-50"
      >
        <LogOut size={20} />
        <span>{isLoggingOut ? 'Cerrando sesión...' : 'Logout'}</span>
      </button>
    </aside>
  );
};
