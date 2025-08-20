import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Eye, X, Phone, DollarSign, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getOpenBills, getReservations, getCourtBills } from '../utils/db';
import { OpenBill, CourtReservation, CourtBill } from '../types';

interface TimeSlot {
  hour: number;
  label: string;
}

interface CourtOccupancy {
  courtId: string;
  courtName: string;
  reservations: {
    [hour: string]: OpenBill | CourtReservation | CourtBill | null;
  };
}

interface ReservationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: OpenBill | CourtReservation | CourtBill | null;
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
    // Para OpenBill
    if ('services' in reservation && 'kioskItems' in reservation) {
      const servicesTotal = reservation.services.reduce((sum, service) => sum + service.subtotal, 0);
      const kioskTotal = reservation.kioskItems.reduce((sum, item) => sum + item.subtotal, 0);
      return reservation.courtRate + servicesTotal + kioskTotal;
    }
    
    // Para CourtReservation o CourtBill
    if ('total' in reservation) {
      return reservation.total;
    }
    
    // Para reservas simples
    if ('turnRate' in reservation) {
      return reservation.turnRate;
    }
    
    return 0;
  };

  const getReservationType = () => {
    if ('services' in reservation) return 'open-bill';
    if ('status' in reservation) return 'reservation';
    if ('receiptNumber' in reservation) return 'completed-bill';
    return 'unknown';
  };

  const getCustomerType = () => {
    if ('customerType' in reservation) return reservation.customerType;
    return 'guest'; // Por defecto
  };

  const getStartTime = () => {
    if ('startTime' in reservation) return reservation.startTime;
    return new Date().toISOString();
  };

  const getStartDate = () => {
    if ('startDate' in reservation) return reservation.startDate;
    return new Date().toISOString();
  };

  const getCustomerName = () => {
    return reservation.customerName || 'Cliente';
  };

  const getLotNumber = () => {
    return reservation.lotNumber || '0';
  };

  const getCourtName = () => {
    if ('courtName' in reservation) return reservation.courtName;
    return 'Cancha';
  };

  const getPlayers = () => {
    if ('players' in reservation && reservation.players) return reservation.players;
    return [];
  };

  const getServices = () => {
    if ('services' in reservation && reservation.services) return reservation.services;
    return [];
  };

  const getKioskItems = () => {
    if ('kioskItems' in reservation && reservation.kioskItems) return reservation.kioskItems;
    return [];
  };

  const getCourtRate = () => {
    if ('courtRate' in reservation) return reservation.courtRate;
    if ('turnRate' in reservation) return reservation.turnRate;
    return 0;
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
                Reserva - {getCourtName()}
              </h2>
              <p className="text-sm text-gray-600">
                {getCustomerName()} • {getCustomerType() === 'member' ? 'Socio' : 'Invitado'}
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
                  <span className="font-medium">{getCustomerName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className={`font-medium ${
                    getCustomerType() === 'member' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {getCustomerType() === 'member' ? 'Socio' : 'Invitado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Lote:
                  </span>
                  <span className="font-medium">{getLotNumber()}</span>
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
                    {new Date(getStartTime()).toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">
                    {new Date(getStartDate()).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiempo Jugado:</span>
                  <span className="font-medium text-green-600">
                    {getElapsedTime(getStartTime())}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Jugadores */}
          {getPlayers().length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">👥 Jugadores ({getPlayers().length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getPlayers().map((player, index) => (
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
          {getServices().length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">⚡ Servicios Adicionales</h3>
              <div className="space-y-2">
                {getServices().map((service, index) => (
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
          {getKioskItems().length > 0 && (
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">🛒 Productos del Kiosco</h3>
              <div className="space-y-2">
                {getKioskItems().map((item, index) => (
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
                <span className="font-medium">${getCourtRate().toFixed(2)}</span>
              </div>
              {getServices().length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Servicios Adicionales:</span>
                  <span className="font-medium">
                    ${getServices().reduce((sum, s) => sum + s.subtotal, 0).toFixed(2)}
                  </span>
                </div>
              )}
              {getKioskItems().length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Productos del Kiosco:</span>
                  <span className="font-medium">
                    ${getKioskItems().reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)}
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
  const { courts, reservations, courtBills, refreshData } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [courtOccupancy, setCourtOccupancy] = useState<CourtOccupancy[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<OpenBill | CourtReservation | CourtBill | null>(null);
  const [showReservationDetail, setShowReservationDetail] = useState(false);

  // Función para cambiar fecha
  const changeDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };
  
  // Función para ir directamente a una fecha con reservas
  const goToDateWithReservations = async () => {
    try {
      // Leer todas las reservas
      const reservasFromLocalStorage = localStorage.getItem('reservas-canchas-v2');
      if (reservasFromLocalStorage) {
        const allReservations = JSON.parse(reservasFromLocalStorage);
        if (allReservations.length > 0) {
          // Tomar la fecha de la primera reserva
          const firstReservation = allReservations[0];
          const reservationDate = firstReservation.startDate || firstReservation.fecha || firstReservation.startTime || firstReservation.horarioInicio;
          if (reservationDate) {
            const normalizedDate = new Date(reservationDate).toISOString().split('T')[0];
            setSelectedDate(normalizedDate);
            console.log('🎯 Saltando a fecha con reservas:', normalizedDate);
          }
        }
      }
    } catch (error) {
      console.error('Error finding date with reservations:', error);
    }
  };

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

  useEffect(() => {
    loadCourtOccupancy();
  }, [reservations, courtBills]);

  const loadCourtOccupancy = async () => {
    try {
      console.log('🔍 Cargando ocupación para fecha:', selectedDate);
      
      // DEBUGGING: Verificar todas las claves en localStorage e IndexedDB
      console.log('🗄️ Verificando almacenamiento local...');
      
      // Verificar localStorage
      const localStorageKeys = Object.keys(localStorage);
      console.log('📦 Claves en localStorage:', localStorageKeys);
      
      // Buscar claves relacionadas con reservas/canchas
      const courtRelatedKeys = localStorageKeys.filter(key => 
        key.includes('court') || 
        key.includes('reserv') || 
        key.includes('cancha') || 
        key.includes('bill') ||
        key.includes('villanueva')
      );
      console.log('🏓 Claves relacionadas con canchas:', courtRelatedKeys);
      
      // Mostrar contenido de cada clave relacionada
      courtRelatedKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          const parsed = value ? JSON.parse(value) : null;
          console.log(`📋 ${key}:`, parsed);
        } catch (e) {
          console.log(`❌ Error parseando ${key}:`, e);
        }
      });
      
      // Cargar todas las fuentes de reservas - CORREGIDO para leer las claves correctas
      const openBills = await getOpenBills();
      
      // Leer reservas desde la clave correcta que usa el módulo de canchas
      let allReservations: any[] = [];
      try {
        const reservasFromLocalStorage = localStorage.getItem('reservas-canchas-v2');
        if (reservasFromLocalStorage) {
          allReservations = JSON.parse(reservasFromLocalStorage);
          console.log('✅ Reservas leídas desde reservas-canchas-v2:', allReservations);
        }
      } catch (error) {
        console.error('❌ Error leyendo reservas-canchas-v2:', error);
      }
      
      // También intentar leer desde facturas abiertas
      let facturasAbiertas: any[] = [];
      try {
        const facturasFromLocalStorage = localStorage.getItem('facturas-abiertas-v2');
        if (facturasFromLocalStorage) {
          facturasAbiertas = JSON.parse(facturasFromLocalStorage);
          console.log('✅ Facturas abiertas leídas:', facturasAbiertas);
        }
      } catch (error) {
        console.error('❌ Error leyendo facturas-abiertas-v2:', error);
      }
      
      const allCourtBills = await getCourtBills();
      
      // Debug: mostrar estructura de datos
      console.log('🔍 Datos cargados:', {
        openBills: openBills.map(b => ({ id: b.reservationId, courtId: b.courtId, startDate: b.startDate, startTime: b.startTime })),
        reservations: allReservations.map(r => ({ 
          id: r.id || r.reservaId, 
          courtId: r.courtId || r.cancha, 
          startDate: r.startDate || r.fecha, 
          startTime: r.startTime || r.horarioInicio,
          customerName: r.customerName || r.nombreCliente
        })),
        facturasAbiertas: facturasAbiertas.map(f => ({
          id: f.id || f.reservaId,
          courtId: f.courtId || f.cancha,
          startDate: f.startDate || f.fecha,
          startTime: f.startTime || f.horarioInicio,
          customerName: f.customerName || f.cliente
        })),
        courtBills: allCourtBills.map(b => ({ id: b.id, courtId: b.courtId, startDate: b.startDate, startTime: b.startTime }))
      });
      
      // Filtrar todas las reservas del día seleccionado
      console.log('📅 Filtrando reservas para:', selectedDate);
      
      const dayOpenBills = openBills.filter(bill => {
        // Probar múltiples campos de fecha
        const billDate = bill.startDate || bill.startTime || bill.createdAt;
        const normalizedDate = new Date(billDate).toISOString().split('T')[0];
        console.log('OpenBill fecha:', billDate, '-> normalizada:', normalizedDate, '== selectedDate:', selectedDate, '?', normalizedDate === selectedDate);
        return normalizedDate === selectedDate;
      });
      
      // Filtrar reservas desde reservas-canchas-v2
      const dayReservations = allReservations.filter(reservation => {
        // Probar múltiples campos de fecha con diferentes formatos
        const reservationDate = reservation.startDate || reservation.fecha || reservation.startTime || reservation.horarioInicio || reservation.createdAt;
        const normalizedDate = new Date(reservationDate).toISOString().split('T')[0];
        console.log('Reservation fecha:', reservationDate, '-> normalizada:', normalizedDate, '== selectedDate:', selectedDate, '?', normalizedDate === selectedDate);
        return normalizedDate === selectedDate;
      });
      
      // Filtrar facturas abiertas
      const dayFacturasAbiertas = facturasAbiertas.filter(factura => {
        const facturaDate = factura.startDate || factura.fecha || factura.startTime || factura.horarioInicio || factura.createdAt;
        const normalizedDate = new Date(facturaDate).toISOString().split('T')[0];
        console.log('Factura Abierta fecha:', facturaDate, '-> normalizada:', normalizedDate, '== selectedDate:', selectedDate, '?', normalizedDate === selectedDate);
        return normalizedDate === selectedDate;
      });
      
      const dayCourtBills = allCourtBills.filter(bill => {
        // Probar múltiples campos de fecha
        const billDate = bill.startDate || bill.startTime || bill.createdAt;
        const normalizedDate = new Date(billDate).toISOString().split('T')[0];
        console.log('CourtBill fecha:', billDate, '-> normalizada:', normalizedDate, '== selectedDate:', selectedDate, '?', normalizedDate === selectedDate);
        return normalizedDate === selectedDate;
      });

      console.log('📊 Reservas encontradas:', {
        openBills: dayOpenBills.length,
        reservations: dayReservations.length,
        facturasAbiertas: dayFacturasAbiertas.length,
        courtBills: dayCourtBills.length
      });

      // Debug: mostrar las reservas filtradas
      console.log('📋 Reservas del día filtradas:', {
        openBills: dayOpenBills,
        reservations: dayReservations,
        facturasAbiertas: dayFacturasAbiertas,
        courtBills: dayCourtBills
      });
      // Crear estructura de ocupación por cancha
      const occupancy: CourtOccupancy[] = courts.map(court => {
        const reservations: { [hour: string]: OpenBill | CourtReservation | CourtBill | null } = {};
        
        // Inicializar todos los slots como vacíos
        timeSlots.forEach(slot => {
          reservations[slot.hour.toString()] = null;
        });

        // Llenar con facturas abiertas (OpenBills)
        dayOpenBills
          .filter(bill => bill.courtId === court.id)
          .forEach(bill => {
            const startTime = bill.startTime || bill.startDate || bill.createdAt;
            const startHour = new Date(startTime).getHours();
            const endHour = bill.endTime ? new Date(bill.endTime).getHours() : startHour + 2; // Default 2 horas
            
            console.log(`🏓 OpenBill en ${court.name}: ${startHour}:00 - ${endHour}:00`);
            
            // Marcar las horas ocupadas
            for (let hour = startHour; hour <= Math.min(endHour, 23); hour++) {
              if (hour >= 8) {
                reservations[hour.toString()] = bill;
              }
            }
          });
        
        // Llenar con reservas desde reservas-canchas-v2
        dayReservations
          .filter(reservation => {
            const courtId = reservation.courtId || reservation.cancha;
            return courtId === court.id || courtId === court.name;
          })
          .forEach(reservation => {
            const startTime = reservation.startTime || reservation.horarioInicio || reservation.startDate || reservation.fecha || reservation.createdAt;
            const startHour = new Date(startTime).getHours();
            const endHour = reservation.endTime ? new Date(reservation.endTime).getHours() : 
                           reservation.horarioFin ? new Date(reservation.horarioFin).getHours() : 
                           startHour + 2; // Default 2 horas
            
            console.log(`🏓 Reservation en ${court.name}: ${startHour}:00 - ${endHour}:00`);
            
            // Marcar las horas ocupadas
            for (let hour = startHour; hour <= Math.min(endHour, 23); hour++) {
              if (hour >= 8) {
                // Solo ocupar si no hay ya una factura abierta
                if (!reservations[hour.toString()]) {
                  // Normalizar la reserva al formato esperado
                  const normalizedReservation = {
                    ...reservation,
                    customerName: reservation.customerName || reservation.nombreCliente || 'Cliente',
                    lotNumber: reservation.lotNumber || reservation.numeroLote || '0',
                    courtName: reservation.courtName || court.name,
                    startTime: startTime,
                    endTime: reservation.endTime || reservation.horarioFin,
                    startDate: reservation.startDate || reservation.fecha,
                    customerType: reservation.customerType || 'guest'
                  };
                  reservations[hour.toString()] = normalizedReservation;
                }
              }
            }
          });
        
        // Llenar con facturas abiertas desde facturas-abiertas-v2
        dayFacturasAbiertas
          .filter(factura => {
            const courtId = factura.courtId || factura.cancha;
            return courtId === court.id || courtId === court.name;
          })
          .forEach(factura => {
            const startTime = factura.startTime || factura.horarioInicio || factura.startDate || factura.fecha || factura.createdAt;
            const startHour = new Date(startTime).getHours();
            const endHour = factura.endTime ? new Date(factura.endTime).getHours() : 
                           factura.horarioFin ? new Date(factura.horarioFin).getHours() : 
                           startHour + 2; // Default 2 horas
            
            console.log(`🏓 Factura Abierta en ${court.name}: ${startHour}:00 - ${endHour}:00`);
            
            // Marcar las horas ocupadas
            for (let hour = startHour; hour <= Math.min(endHour, 23); hour++) {
              if (hour >= 8) {
                // Solo ocupar si no hay ya una reserva
                if (!reservations[hour.toString()]) {
                  // Normalizar la factura al formato esperado
                  const normalizedFactura = {
                    ...factura,
                    customerName: factura.customerName || factura.cliente || 'Cliente',
                    lotNumber: factura.lotNumber || factura.numeroLote || '0',
                    courtName: factura.courtName || court.name,
                    startTime: startTime,
                    endTime: factura.endTime || factura.horarioFin,
                    startDate: factura.startDate || factura.fecha,
                    customerType: factura.customerType || 'guest'
                  };
                  reservations[hour.toString()] = normalizedFactura;
                }
              }
            }
          });
        
        // Llenar con facturas completadas (CourtBill)
        dayCourtBills
          .filter(bill => bill.courtId === court.id)
          .forEach(bill => {
            const startTime = bill.startTime || bill.startDate || bill.createdAt;
            const startHour = new Date(startTime).getHours();
            const endHour = bill.endTime ? new Date(bill.endTime).getHours() : startHour + 2; // Default 2 horas
            
            console.log(`🏓 CourtBill en ${court.name}: ${startHour}:00 - ${endHour}:00`);
            
            // Marcar las horas ocupadas
            for (let hour = startHour; hour <= Math.min(endHour, 23); hour++) {
              if (hour >= 8) {
                // Solo ocupar si no hay ya una reserva activa
                if (!reservations[hour.toString()]) {
                  reservations[hour.toString()] = bill;
                }
              }
            }
          });

        console.log(`📋 Ocupación final para ${court.name}:`, 
          Object.entries(reservations)
            .filter(([hour, res]) => res !== null)
            .map(([hour, res]) => ({ hour, cliente: res?.customerName }))
        );
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

  const handleSlotClick = (reservation: OpenBill | CourtReservation | CourtBill) => {
    setSelectedReservation(reservation);
    setShowReservationDetail(true);
  };

  const getSlotColor = (reservation: OpenBill | CourtReservation | CourtBill | null) => {
    if (!reservation) return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    
    const now = new Date();
    const startTime = new Date(reservation.startTime || reservation.createdAt);
    const isActive = now >= startTime;
    
    // Determinar tipo de cliente
    const customerType = ('customerType' in reservation) ? reservation.customerType : 'guest';
    
    if (customerType === 'member') {
      return isActive 
        ? 'bg-green-200 border-green-400 hover:bg-green-300 cursor-pointer' 
        : 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer';
    } else {
      return isActive 
        ? 'bg-blue-200 border-blue-400 hover:bg-blue-300 cursor-pointer' 
        : 'bg-blue-100 border-blue-300 hover:bg-blue-200 cursor-pointer';
    }
  };

  const getSlotContent = (reservation: OpenBill | CourtReservation | CourtBill | null) => {
    if (!reservation) return null;
    
    const customerType = ('customerType' in reservation) ? reservation.customerType : 'guest';
    
    return (
      <div className="p-2 text-xs">
        <div className="font-medium text-gray-900 truncate">
          {reservation.customerName}
        </div>
        <div className="text-gray-600 truncate">
          Lote {reservation.lotNumber}
        </div>
        <div className="text-gray-500">
          {customerType === 'member' ? '👥 Socio' : '👤 Invitado'}
        </div>
      </div>
    );
  };

  const getTodayStats = () => {
    const totalReservations = courtOccupancy.reduce((total, court) => {
      return total + Object.values(court.reservations).filter(r => r !== null).length;
    }, 0);

    const memberReservations = courtOccupancy.reduce((total, court) => {
      return total + Object.values(court.reservations).filter(r => {
        if (!r) return false;
        const customerType = ('customerType' in r) ? r.customerType : 'guest';
        return customerType === 'member';
      }).length;
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
          <div className="flex items-center space-x-2">
            <button
              onClick={goToDateWithReservations}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              title="Ir a fecha con reservas"
            >
              📅 Ver Reservas
            </button>
            <div className="flex flex-col">
              <button
                onClick={() => changeDate(1)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Día siguiente"
              >
                <ChevronUp className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => changeDate(-1)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Día anterior"
              >
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas del día */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Fecha actual: {new Date(selectedDate).toLocaleDateString('es-ES')}
              </p>
              <p className="text-xs text-yellow-700">
                {stats.totalReservations === 0 
                  ? 'No hay reservas para esta fecha. Usa las flechas o el botón "Ver Reservas" para navegar.'
                  : `${stats.totalReservations} reservas encontradas para esta fecha`
                }
              </p>
            </div>
          </div>
          {stats.totalReservations === 0 && (
            <button
              onClick={goToDateWithReservations}
              className="px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
            >
              📅 Ir a Reservas Existentes
            </button>
          )}
        </div>
      </div>
      
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
                  month: 'short',
                  year: 'numeric'
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