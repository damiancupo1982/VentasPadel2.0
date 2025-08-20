import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  TrendingUp, 
  Home, 
  Shield, 
  LogOut, 
  Calendar, 
  DollarSign, 
  Receipt, 
  Clock, 
  Users,
  Database,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import AdminLogin from './AdminLogin';

const Layout: React.FC = () => {
  const { isAdmin, setAdmin } = useStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const handleLogout = () => {
    setAdmin(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const navigationItems = [
    {
      to: "/",
      icon: ShoppingCart,
      label: "Ventas",
      description: "Sistema de ventas del kiosco",
      adminOnly: false
    },
    {
      to: "/courts",
      icon: Calendar,
      label: "Canchas",
      description: "Gestión de canchas y servicios",
      adminOnly: false
    },
    {
      to: "/turno-actual",
      icon: Clock,
      label: "Turno Actual",
      description: "Resumen del turno en curso",
      adminOnly: false
    },
    {
      to: "/carnets",
      icon: Users,
      label: "Carnets",
      description: "Gestión de carnets de socios",
      adminOnly: false
    },
    {
      to: "/agenda",
      icon: Calendar,
      label: "Agenda",
      description: "Vista de ocupación de canchas",
      adminOnly: false
    },
    {
      to: "/dashboard",
      icon: BarChart3,
      label: "Dashboard",
      description: "Analytics y métricas ejecutivas",
      adminOnly: true
    },
    {
      to: "/products",
      icon: Package,
      label: "Productos",
      description: "Catálogo de productos del kiosco",
      adminOnly: true
    },
    {
      to: "/stock",
      icon: Package,
      label: "Stock",
      description: "Control de inventario",
      adminOnly: true
    },
    {
      to: "/movements",
      icon: TrendingUp,
      label: "Movimientos",
      description: "Historial de movimientos de stock",
      adminOnly: true
    },
    {
      to: "/arqueo",
      icon: DollarSign,
      label: "Arqueo de Caja",
      description: "Cierre y arqueo de turnos",
      adminOnly: true
    },
    {
      to: "/transactions",
      icon: Receipt,
      label: "Transacciones",
      description: "Historial completo de transacciones",
      adminOnly: true
    },
  ];

  const visibleItems = navigationItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b relative z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 mr-3"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <Home className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">VNP-San Benito</h1>
                {isAdmin && (
                  <span className="text-xs text-green-600 font-medium">Modo Administrador</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {!isAdmin ? (
                <AdminLogin />
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center px-3 py-1 bg-green-100 rounded-full">
                    <Shield className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-green-700">Admin</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-1.5" />
                    Salir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-screen w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-40 flex flex-col ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-green-50 to-blue-50 flex-shrink-0">
          <div className="flex items-center">
            <Home className="h-6 w-6 text-green-600 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Villanueva Pádel</h2>
              <p className="text-sm text-gray-600">Sistema de Gestión</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Admin Status */}
        {isAdmin && (
          <div className="p-4 bg-green-50 border-b border-green-200 flex-shrink-0">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Modo Administrador</p>
                <p className="text-xs text-green-600">Acceso completo al sistema</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto">
          <div className="px-2 py-4 space-y-1 min-h-full">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-green-100 text-green-700 border-r-4 border-green-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`flex-shrink-0 h-5 w-5 mr-3 ${
                        isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.label}</span>
                          {item.adminOnly && (
                            <Shield className="h-3 w-3 text-green-500 ml-2" />
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 ${
                          isActive ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight className={`h-4 w-4 ml-2 ${
                        isActive ? 'text-green-500' : 'text-gray-300 group-hover:text-gray-400'
                      }`} />
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Home className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Sistema v1.0</p>
                <p className="text-xs text-gray-500">Con Backup Automático</p>
              </div>
            </div>
            {isAdmin && (
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Cerrar sesión de administrador"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Menu Button - Fixed Position */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-6 right-6 z-50 lg:hidden bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 hover:scale-110"
      >
        <Menu className="h-6 w-6" />
      </button>
    </div>
  );
};

export default Layout;