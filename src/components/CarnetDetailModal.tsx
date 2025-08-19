import React from 'react';
import { X, User, Phone, MapPin, Calendar, AlertTriangle, Mail, Users, FileText, UserCheck, UserX } from 'lucide-react';
import { CarnetSocio } from '../types/carnets';

interface CarnetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  carnet: CarnetSocio | null;
}

const CarnetDetailModal: React.FC<CarnetDetailModalProps> = ({ isOpen, onClose, carnet }) => {
  if (!isOpen || !carnet) return null;

  const getCondicionColor = (condicion: string) => {
    switch (condicion) {
      case 'TITULAR':
        return 'bg-blue-100 text-blue-800';
      case 'FAMILIAR_1':
        return 'bg-green-100 text-green-800';
      case 'FAMILIAR_2':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAMILIAR_3':
        return 'bg-purple-100 text-purple-800';
      case 'FAMILIAR_ADHERENTE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCondicionLabel = (condicion: string) => {
    switch (condicion) {
      case 'TITULAR': return 'Titular';
      case 'FAMILIAR_1': return 'Familiar 1';
      case 'FAMILIAR_2': return 'Familiar 2';
      case 'FAMILIAR_3': return 'Familiar 3';
      case 'FAMILIAR_ADHERENTE': return 'Adherente';
      default: return condicion;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDIDO':
        return 'bg-yellow-100 text-yellow-800';
      case 'BAJA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl bg-white rounded-lg shadow-xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Carnet {carnet.numeroCarnet} - {carnet.tipo}
              </h2>
              <p className="text-sm text-gray-600">
                {carnet.titular.nombreCompleto} • Lote {carnet.lote}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Información General del Carnet */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-600" />
              Información del Carnet
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Número de Carnet</p>
                <p className="text-lg font-semibold text-gray-900 font-mono">{carnet.numeroCarnet}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tipo</p>
                <div className="flex items-center">
                  {carnet.tipo === 'INDIVIDUAL' ? (
                    <User className="h-4 w-4 text-purple-600 mr-1" />
                  ) : (
                    <Users className="h-4 w-4 text-indigo-600 mr-1" />
                  )}
                  <span className="text-lg font-semibold text-gray-900">{carnet.tipo}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Estado</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getEstadoColor(carnet.estado)}`}>
                  {carnet.estado === 'ACTIVO' && <UserCheck className="h-4 w-4 mr-1" />}
                  {carnet.estado === 'SUSPENDIDO' && <AlertTriangle className="h-4 w-4 mr-1" />}
                  {carnet.estado === 'BAJA' && <UserX className="h-4 w-4 mr-1" />}
                  {carnet.estado}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Miembros</p>
                <p className="text-lg font-semibold text-gray-900">{carnet.metadata.totalMiembros}</p>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Ubicación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-blue-800">Barrio</p>
                <p className="text-lg font-semibold text-blue-900">{carnet.barrio}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Número de Lote</p>
                <p className="text-lg font-semibold text-blue-900">{carnet.lote}</p>
              </div>
            </div>
          </div>

          {/* Fechas Importantes */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Fechas Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-green-800">Fecha de Creación</p>
                <p className="text-sm text-green-700">
                  {new Date(carnet.fechaCreacion).toLocaleDateString('es-ES')}
                </p>
                <p className="text-xs text-green-600">Creado por: {carnet.creadoPor}</p>
              </div>
              
              {carnet.fechaVencimiento && (
                <div>
                  <p className="text-sm font-medium text-green-800">Fecha de Vencimiento</p>
                  <p className="text-sm text-green-700">
                    {new Date(carnet.fechaVencimiento).toLocaleDateString('es-ES')}
                  </p>
                </div>
              )}
              
              {carnet.estado === 'BAJA' && carnet.fechaBaja && (
                <div>
                  <p className="text-sm font-medium text-red-800">Fecha de Baja</p>
                  <p className="text-sm text-red-700">
                    {new Date(carnet.fechaBaja).toLocaleDateString('es-ES')}
                  </p>
                  {carnet.dadoDeBajaPor && (
                    <p className="text-xs text-red-600">Por: {carnet.dadoDeBajaPor}</p>
                  )}
                  {carnet.motivoBaja && (
                    <p className="text-xs text-red-600 mt-1">Motivo: {carnet.motivoBaja}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Titular */}
          <div className="border rounded-lg p-4 bg-blue-50 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Titular del Carnet
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Nombre Completo</p>
                <p className="text-lg font-semibold text-gray-900">{carnet.titular.nombreCompleto}</p>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Teléfono</p>
                  <p className="text-sm text-gray-900">{carnet.titular.telefono}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">DNI</p>
                <p className="text-sm text-gray-900 font-mono">{carnet.titular.dni}</p>
              </div>
              
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-sm text-gray-900">{carnet.titular.email}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Vínculo</p>
                <p className="text-sm text-gray-900">{carnet.titular.vinculo}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600">Fecha de Alta</p>
                <p className="text-sm text-gray-900">
                  {new Date(carnet.titular.fechaAlta).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>

          {/* Familiares */}
          {carnet.familiares.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                Familiares ({carnet.familiares.length})
              </h3>
              
              <div className="space-y-4">
                {carnet.familiares.map((familiar, index) => (
                  <div key={familiar.id} className="border rounded-lg p-4 bg-indigo-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <User className="h-5 w-5 text-gray-600 mr-2" />
                        <h4 className="text-lg font-medium text-gray-900">
                          {familiar.nombreCompleto}
                        </h4>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCondicionColor(familiar.condicion)}`}>
                        {getCondicionLabel(familiar.condicion)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Teléfono</p>
                          <p className="text-sm text-gray-900">{familiar.telefono}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">DNI</p>
                        <p className="text-sm text-gray-900 font-mono">{familiar.dni || 'No especificado'}</p>
                      </div>
                      
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Email</p>
                          <p className="text-sm text-gray-900">{familiar.email || 'No especificado'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">Vínculo</p>
                        <p className="text-sm text-gray-900">{familiar.vinculo}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fecha de Alta</p>
                        <p className="text-sm text-gray-900">
                          {new Date(familiar.fechaAlta).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">Estado</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(familiar.estado)}`}>
                          {familiar.estado === 'ACTIVO' && <UserCheck className="h-3 w-3 mr-1" />}
                          {familiar.estado === 'SUSPENDIDO' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {familiar.estado === 'BAJA' && <UserX className="h-3 w-3 mr-1" />}
                          {familiar.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observaciones */}
          {carnet.observaciones && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-yellow-600" />
                Observaciones
              </h3>
              <p className="text-sm text-gray-700">{carnet.observaciones}</p>
            </div>
          )}

          {/* Metadatos */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">🔧 Información Técnica</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">ID del Carnet</p>
                <p className="font-mono text-gray-900">{carnet.id}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Versión</p>
                <p className="text-gray-900">{carnet.metadata.version}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Última Actualización</p>
                <p className="text-gray-900">
                  {new Date(carnet.metadata.ultimaActualizacion).toLocaleString('es-ES')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarnetDetailModal;