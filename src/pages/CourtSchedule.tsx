import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Eye, X, Phone, DollarSign } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getOpenBills } from '../utils/db';
import { OpenBill } from '../types';

interface TimeSlot {
  hour: number;
  label: string;
}

interface CourtOccupancy {
  courtId: string;
  courtName: string;
  reservations: {
    [hour: string]: OpenBill | null;
  };
}

interface ReservationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: OpenBill | null;
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({ isOpen, onClose, reservation }) => {
  if (!isOpen || !reservation) return null;

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;
    return `${hours}h ${minutes}m`;
  };

  const calculateCurrentTotal = () => {
    const servicesTotal = reservation.services.reduce((sum, service) => sum + service.subtotal, 0);
    const kioskTotal = reservation.kioskItems.reduce((sum, item) => sum + item.subtotal, 0);
    return reservation.courtRate + servicesTotal + kioskTotal;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Reserva - {reservation.courtName}
              </h2>
              <p className="text-sm text-gray-600">
                {reservation.customerName} • {reservation.customerType === 'member' ? 'Socio' : 'Invitado'}
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
          {/* Información Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Información del Cliente
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium">{reservation.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className={`font-medium ${
                    reservation.customerType === 'member' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {reservation.customerType === 'member' ? 'Socio' : 'Invitado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Lote:
                  </span>
                  <span className="font-medium">{reservation.lotNumber}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                Información de Tiempo
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Inicio:</span>
                  <span className="font-medium">
                    {new Date(reservation.startTime).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">
                    {new Date(reservation.startDate).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiempo Jugado:</span>
                  <span className="font-medium text-green-600">
                    {getElapsedTime(reservation.startTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Jugadores */}
          {reservation.players && reservation.players.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">👥 Jugadores ({reservation.players.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reservation.players.map((player, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{player.name}</p>
                        <p className="text-sm text-gray-500">Lote: {player.lotNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          ${player.amountToPay.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Servicios Adicionales */}
          {reservation.services && reservation.services.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">⚡ Servicios Adicionales</h3>
              <div className="space-y-2">
                {reservation.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                    <div>
                      <span className="font-medium">{service.service.name}</span>
                      <span className="text-sm text-gray-500 ml-2">x{service.quantity}</span>
                    </div>
                    <span className="font-medium text-yellow-600">
                      ${service.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items del Kiosco */}
          {reservation.kioskItems && reservation.kioskItems.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">🛒 Productos del Kiosco</h3>
              <div className="space-y-2">
                {reservation.kioskItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                    <div>
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-sm text-gray-500 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-medium text-green-600">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumen Financiero */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Resumen Financiero
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Tarifa de Cancha:</span>
                <span className="font-medium">${reservation.courtRate.toFixed(2)}</span>
              </div>
              {reservation.services.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Servicios Adicionales:</span>
                  <span className="font-medium">
                    ${reservation.services.reduce((sum, s) => sum + s.subtotal, 0).toFixed(2)}
                  </span>
                </div>
              )}
              {reservation.kioskItems.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Productos del Kiosco:</span>
                  <span className="font-medium">
                    ${reservation.kioskItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>TOTAL ACTUAL:</span>
                <span className="text-green-600">${calculateCurrentTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const CourtSchedule: React.FC = () => {
  const { courts, refreshData } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [courtOccupancy, setCourtOccupancy] = useState<CourtOccupancy[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<OpenBill | null>(null);
  const [showReservationDetail, setShowReservationDetail] = useState(false);

  // Generar slots de tiempo (de 8:00 a 23:00)
  const timeSlots: TimeSlot[] = [];
  for (let hour = 8; hour <= 23; hour++) {
    timeSlots.push({
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`
    });
  }

  useEffect(() => {
    refreshData();
    loadCourtOccupancy();
  }, [selectedDate]);

  const loadCourtOccupancy = async () => {
    try {
      const openBills = await getOpenBills();
      
      // Filtrar reservas del día seleccionado
      const dayReservations = openBills.filter(bill => {
        const billDate = new Date(bill.startDate).toISOString().split('T')[0];
        return billDate === selectedDate;
      });

      // Crear estructura de ocupación por cancha
      const occupancy: CourtOccupancy[] = courts.map(court => {
        const reservations: { [hour: string]: OpenBill | null } = {};
        
        // Inicializar todos los slots como vacíos
        timeSlots.forEach(slot => {
          reservations[slot.hour.toString()] = null;
        });

        // Llenar con reservas existentes
        dayReservations
          .filter(bill => bill.courtId === court.id)
          .forEach(bill => {
            const startHour = new Date(bill.startTime).getHours();
            const endHour = bill.endTime ? new Date(bill.endTime).getHours() : new Date().getHours();
            
            // Marcar las horas ocupadas
            for (let hour = startHour; hour <= Math.min(endHour, 23); hour++) {
              if (hour >= 8) {
                reservations[hour.toString()] = bill;
              }
            }
          });

        return {
          courtId: court.id,
          courtName: court.name,
          reservations
        };
      });

      setCourtOccupancy(occupancy);
    } catch (error) {
      console.error('Error loading court occupancy:', error);
    }
  };

  const handleSlotClick = (reservation: OpenBill) => {
    setSelectedReservation(reservation);
    setShowReservationDetail(true);
  };

  const getSlotColor = (reservation: OpenBill | null) => {
    if (!reservation) return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const isActive = now >= startTime;
    
    if (reservation.customerType === 'member') {
      return isActive 
        ? 'bg-green-200 border-green-400 hover:bg-green-300 cursor-pointer' 
        : 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer';
    } else {
      return isActive 
        ? 'bg-blue-200 border-blue-400 hover:bg-blue-300 cursor-pointer' 
        : 'bg-blue-100 border-blue-300 hover:bg-blue-200 cursor-pointer';
    }
  };

  const getSlotContent = (reservation: OpenBill | null) => {
    if (!reservation) return null;
    
    return (
      <div className="p-2 text-xs">
        <div className="font-medium text-gray-900 truncate">
          {reservation.customerName}
        </div>
        <div className="text-gray-600 truncate">
          Lote {reservation.lotNumber}
        </div>
        <div className="text-gray-500">
          {reservation.customerType === 'member' ? '👥 Socio' : '👤 Invitado'}
        </div>
      </div>
    );
  };

  const getTodayStats = () => {
    const totalReservations = courtOccupancy.reduce((total, court) => {
      return total + Object.values(court.reservations).filter(r => r !== null).length;
    }, 0);

    const memberReservations = courtOccupancy.reduce((total, court) => {
      return total + Object.values(court.reservations).filter(r => r?.customerType === 'member').length;
    }, 0);

    const guestReservations = totalReservations - memberReservations;

    return { totalReservations, memberReservations, guestReservations };
  };

  const stats = getTodayStats();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            Agenda de Canchas
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Vista de ocupación en tiempo real de las canchas de pádel
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Estadísticas del día */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Reservas</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalReservations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <User className="h-6 w-6 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-500">Socios</p>
              <p className="text-xl font-bold text-gray-900">{stats.memberReservations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <User className="h-6 w-6 text-purple-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-500">Invitados</p>
              <p className="text-xl font-bold text-gray-900">{stats.guestReservations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(selectedDate).toLocaleDateString('es-ES', { 
                  weekday: 'short', 
                  day: 'numeric', 
                  month: 'short' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">📋 Leyenda</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-200 border border-green-400 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Socio (Activo)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Socio (Programado)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Invitado (Activo)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
            <span className="text-sm text-gray-600">Invitado (Programado)</span>
          </div>
        </div>
      </div>

      {/* Agenda de Canchas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Cancha
                </th>
                {timeSlots.map(slot => (
                  <th key={slot.hour} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courtOccupancy.map((court) => (
                <tr key={court.courtId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10 border-r">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        court.courtId === 'court-1' ? 'bg-green-500' :
                        court.courtId === 'court-2' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }`}></div>
                      <div>
                        <div className="font-medium">{court.courtName}</div>
                        <div className="text-xs text-gray-500">
                          {Object.values(court.reservations).filter(r => r !== null).length} reservas
                        </div>
                      </div>
                    </div>
                  </td>
                  {timeSlots.map(slot => {
                    const reservation = court.reservations[slot.hour.toString()];
                    return (
                      <td key={slot.hour} className="p-1">
                        <div
                          className={`h-16 border-2 rounded-lg transition-all ${getSlotColor(reservation)}`}
                          onClick={() => reservation && handleSlotClick(reservation)}
                        >
                          {getSlotContent(reservation)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {courtOccupancy.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay datos de canchas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Las canchas aparecerán aquí cuando haya reservas registradas
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalle de reserva */}
      <ReservationDetailModal
        isOpen={showReservationDetail}
        onClose={() => setShowReservationDetail(false)}
        reservation={selectedReservation}
      />
    </div>
  );
};

export default CourtSchedule;