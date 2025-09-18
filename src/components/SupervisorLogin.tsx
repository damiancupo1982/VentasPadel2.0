import React, { useState } from 'react';
import { Shield, ShieldCheck, X, Lock } from 'lucide-react';
import { useStore } from '../store/useStore';

/** Cambiá el PIN acá si querés */
const SUPERVISOR_PIN = '7305';

const SupervisorLogin: React.FC = () => {
  const { isSupervisor, setSupervisor } = useStore();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (pin.trim() === SUPERVISOR_PIN) {
      setSupervisor(true);
      setPin('');
      setError('');
      setOpen(false);
    } else {
      setError('PIN incorrecto');
    }
  };

  const handleLogout = () => {
    setSupervisor(false);
    setPin('');
    setError('');
    setOpen(false);
  };

  return (
    <>
      {/* Botón compacto para la barra superior */}
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border transition-colors
          ${isSupervisor
            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        title={isSupervisor ? 'Supervisor activo' : 'Entrar como Supervisor'}
      >
        {isSupervisor ? <ShieldCheck className="h-4 w-4 mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
        {isSupervisor ? 'Supervisor' : 'Supervisor'}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold">
                  {isSupervisor ? 'Supervisor activo' : 'Ingresar PIN de Supervisor'}
                </h3>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-gray-100 rounded-md">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              {isSupervisor ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    Estás en modo <strong>Supervisor</strong>. Podés realizar acciones especiales
                    (ej.: eliminar transacciones).
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Salir de Supervisor
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PIN de Supervisor
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      autoFocus
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="••••"
                    />
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setOpen(false)}
                      className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleLogin}
                      className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupervisorLogin;
