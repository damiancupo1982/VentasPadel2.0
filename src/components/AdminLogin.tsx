import React, { useState } from 'react';
import { Shield, Eye, EyeOff, X } from 'lucide-react';
import { useStore } from '../store/useStore';

const AdminLogin: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { setAdmin } = useStore();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === '2580') {
      setAdmin(true);
      setIsOpen(false);
      setPassword('');
      setError('');
      
      // Success sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsgBTuRsqSF');
      audio.play().catch(() => {});
    } else {
      setError('Contraseña incorrecta');
      
      // Error sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsgBTuRsqSF');
      audio.play().catch(() => {});
      
      setTimeout(() => setError(''), 3000);
    }
  };
  
  const handleClose = () => {
    setIsOpen(false);
    setPassword('');
    setError('');
  };
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
      >
        <Shield className="h-4 w-4 mr-1.5" />
        Administrador
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <Shield className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Acceso Administrador</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña de Administrador
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      error 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-green-500'
                    }`}
                    placeholder="Ingrese la contraseña"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center mr-2">
                      !
                    </span>
                    {error}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!password}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Acceder
                </button>
              </div>
            </form>
            
            <div className="px-6 pb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-700">
                  <strong>Modo Administrador:</strong> Acceso completo a productos, stock, movimientos y configuración del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminLogin;