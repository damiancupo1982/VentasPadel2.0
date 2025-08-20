import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Plus, Eye, X, DollarSign, Phone } from 'lucide-react';
import { useStore } from '../store/useStore';
import { addOpenBill, removeOpenBill, updateOpenBill, addCourtBill } from '../utils/db';
import { OpenBill, CourtServiceItem, SaleItem } from '../types';
import CourtBillModal from '../components/CourtBillModal';

interface Player {
  name: string;
  lotNumber: string;
  amountToPay: number;
}

const Courts: React.FC = () => {
  const { 
    courts, 
    courtServices, 
    products, 
    openBills, 
    addOpenBill: addOpenBillToStore,
    removeOpenBill: removeOpenBillFromStore,
    updateOpenBill: updateOpenBillInStore,
    refreshData 
  } = useStore();
  
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<OpenBill | null>(null);
  const [selectedCourt, setSelectedCourt] = useState('');
  
  // Form data for new reservation
  const [formData, setFormData] = useState({
    customerName: '',
    customerType: 'member' as 'member' | 'guest',
    lotNumber: '',
    courtId: '',
    players: [] as Player[]
  });
  
  useEffect(() => {
    refreshData();
  }, []);
  
  const handleStartReservation = async () => {
    if (!formData.customerName || !formData.lotNumber || !formData.courtId) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }
    
    const court = courts.find(c => c.id === formData.courtId);
    if (!court) return;
    
    const now = new Date();
    const newBill: OpenBill = {
      reservationId: `reservation-${Date.now()}`,
      courtId: formData.courtId,
      courtName: court.name,
      customerName: formData.customerName,
      customerType: formData.customerType,
      lotNumber: formData.lotNumber,
      startTime: now.toISOString(),
      courtRate: 8000, // Tarifa fija por turno
      startDate: now.toISOString().split('T')[0],
      players: formData.players,
      services: [],
      kioskItems: [],
      subtotal: 8000,
      createdAt: now.toISOString()
    };
    
    try {
      // Agregar a la base de datos
      await addOpenBill(newBill);
      
      // Agregar al store
      addOpenBillToStore(newBill);
      
      // Limpiar formulario
      setFormData({
        customerName: '',
        customerType: 'member',
        lotNumber: '',
        courtId: '',
        players: []
      });
      setShowNewReservationModal(false);
      
      await refreshData();
    } catch (error) {
      console.error('Error al crear reserva:', error);
      alert('Error al crear la reserva');
    }
  };
  
  const handleCompleteBill = async (
    bill: OpenBill,
    data: {
      services: CourtServiceItem[];
      kioskItems: SaleItem[];
      paymentMethod: 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
      paymentAmounts?: {
        efectivo: number;
        transferencia: number;
        expensa: number;
      };
    }
  ) => {
    try {
      const now = new Date();
      const servicesTotal = data.services.reduce((sum, service) => sum + service.subtotal, 0);
      const kioskTotal = data.kioskItems.reduce((sum, item) => sum + item.subtotal, 0);
      const total = bill.courtRate + servicesTotal + kioskTotal;
      
      // Crear paymentBreakdown
      let paymentBreakdown: { efectivo: number; transferencia: number; expensa: number };
      
      if (data.paymentMethod === 'combinado' && data.paymentAmounts) {
        paymentBreakdown = data.paymentAmounts;
      } else {
        // Para pagos simples, crear desglose asignando todo al método seleccionado
        paymentBreakdown = {
          efectivo: data.paymentMethod === 'efectivo' ? total : 0,
          transferencia: data.paymentMethod === 'transferencia' ? total : 0,
          expensa: data.paymentMethod === 'expensa' ? total : 0
        };
      }
      
      const courtBill = await addCourtBill({
        reservationId: bill.reservationId,
        courtId: bill.courtId,
        courtName: bill.courtName,
        customerName: bill.customerName,
        lotNumber: bill.lotNumber,
        startTime: bill.startTime,
        endTime: now.toISOString(),
        startDate: bill.startDate,
        endDate: now.toISOString().split('T')[0],
        players: bill.players,
        turnRate: bill.courtRate,
        lightUsage: false,
        lightCost: 0,
        racketRental: false,
        racketCost: 0,
        services: data.services,
        kioskItems: data.kioskItems,
        subtotal: bill.courtRate + servicesTotal + kioskTotal,
        total,
        paymentMethod: data.paymentMethod,
        paymentBreakdown
      });
      
      // Remover de facturas abiertas
      await removeOpenBill(bill.reservationId);
      removeOpenBillFromStore(bill.reservationId);
      
      setShowBillModal(false);
      setSelectedBill(null);
      await refreshData();
      
      alert(`Factura ${courtBill.receiptNumber} generada exitosamente`);
    } catch (error) {
      console.error('Error al completar facturación:', error);
      alert('Error al completar la facturación');
    }
  };
  
  const addPlayer = () => {
    setFormData({
      ...formData,
      players: [...formData.players, { name: '', lotNumber: '', amountToPay: 0 }]
    });
  };
  
  const removePlayer = (index: number) => {
    setFormData({
      ...formData,
      players: formData.players.filter((_, i) => i !== index)
    });
  };
  
  const updatePlayer = (index: number, field: keyof Player, value: string | number) => {
    const updatedPlayers = [...formData.players];
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value };
    setFormData({ ...formData, players: updatedPlayers });
  };
  
  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;
    return `${hours}h ${minutes}m`;
  };
  
  const getCourtColor = (courtId: string) => {
    switch (courtId) {
      case 'court-1': return 'border-green-500 bg-green-50';
      case 'court-2': return 'border-blue-500 bg-blue-50';
      case 'court-3': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 text-green-600 mr-3" />
            Gestión de Canchas
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Control de reservas y facturación de canchas de pádel
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setShowNewReservationModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </button>
        </div>
      </div>
      
      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-500">Canchas Activas</p>
              <p className="text-xl font-bold text-gray-900">{courts.filter(c => c.isActive).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-500">Reservas Abiertas</p>
              <p className="text-xl font-bold text-gray-900">{openBills.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <User className="h-6 w-6 text-purple-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-500">Socios Jugando</p>
              <p className="text-xl font-bold text-gray-900">
                {openBills.filter(bill => bill.customerType === 'member').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-orange-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-gray-500">Ingresos Pendientes</p>
              <p className="text-xl font-bold text-gray-900">
                ${openBills.reduce((sum, bill) => sum + bill.subtotal, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reservas Activas */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Reservas Activas ({openBills.length})
          </h3>
          
          {openBills.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay reservas activas</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando una nueva reserva
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openBills.map((bill) => (
                <div key={bill.reservationId} className={`border-2 rounded-lg p-4 ${getCourtColor(bill.courtId)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">{bill.courtName}</h4>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bill.customerType === 'member' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {bill.customerType === 'member' ? 'Socio' : 'Invitado'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium">{bill.customerName}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Lote {bill.lotNumber}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        Inicio: {new Date(bill.startTime).toLocaleTimeString('es-ES')}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-green-600">
                        Tiempo: {getElapsedTime(bill.startTime)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Jugadores */}
                  {bill.players.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Jugadores ({bill.players.length}):
                      </p>
                      <div className="space-y-1">
                        {bill.players.slice(0, 2).map((player, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            • {player.name} (Lote {player.lotNumber})
                          </div>
                        ))}
                        {bill.players.length > 2 && (
                          <div className="text-xs text-gray-500">
                            ... y {bill.players.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">Subtotal:</p>
                      <p className="text-lg font-bold text-green-600">${bill.subtotal.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBill(bill);
                        setShowBillModal(true);
                      }}
                      className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      Facturar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para nueva reserva */}
      {showNewReservationModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowNewReservationModal(false)} />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Plus className="h-5 w-5 mr-2 text-green-600" />
                Nueva Reserva de Cancha
              </h2>
              <button
                onClick={() => setShowNewReservationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Cliente *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Juan García"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Lote *
                  </label>
                  <input
                    type="text"
                    value={formData.lotNumber}
                    onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="123"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Cliente *
                  </label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as 'member' | 'guest' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="member">Socio</option>
                    <option value="guest">Invitado</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancha *
                  </label>
                  <select
                    value={formData.courtId}
                    onChange={(e) => setFormData({ ...formData, courtId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar cancha</option>
                    {courts.filter(court => court.isActive).map(court => (
                      <option key={court.id} value={court.id}>{court.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Jugadores */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Jugadores (Opcional)
                  </label>
                  <button
                    onClick={addPlayer}
                    className="text-sm text-green-600 hover:text-green-700 flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Jugador
                  </button>
                </div>
                
                {formData.players.length > 0 && (
                  <div className="space-y-3">
                    {formData.players.map((player, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          placeholder="Nombre del jugador"
                          value={player.name}
                          onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                          type="text"
                          placeholder="Lote"
                          value={player.lotNumber}
                          onChange={(e) => updatePlayer(index, 'lotNumber', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <input
                          type="number"
                          placeholder="Monto a pagar"
                          value={player.amountToPay}
                          onChange={(e) => updatePlayer(index, 'amountToPay', parseFloat(e.target.value) || 0)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          onClick={() => removePlayer(index)}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewReservationModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStartReservation}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Iniciar Reserva
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de facturación */}
      <CourtBillModal
        isOpen={showBillModal}
        onClose={() => {
          setShowBillModal(false);
          setSelectedBill(null);
        }}
        bill={selectedBill}
        courtServices={courtServices}
        products={products}
        onComplete={(data) => selectedBill && handleCompleteBill(selectedBill, data)}
      />
    </div>
  );
};

export default Courts;