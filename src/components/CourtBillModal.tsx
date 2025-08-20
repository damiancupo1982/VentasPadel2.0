import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, DollarSign, Clock, User, Receipt, Zap, Coffee } from 'lucide-react';
import { OpenBill, CourtService, CourtServiceItem, Product, SaleItem } from '../types';

interface CourtBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: OpenBill | null;
  courtServices: CourtService[];
  products: Product[];
  onComplete: (data: {
    services: CourtServiceItem[];
    kioskItems: SaleItem[];
    paymentMethod: 'efectivo' | 'transferencia' | 'expensa';
  }) => void;
}

const CourtBillModal: React.FC<CourtBillModalProps> = ({
  isOpen,
  onClose,
  bill,
  courtServices,
  products,
  onComplete
}) => {
  const [selectedServices, setSelectedServices] = useState<CourtServiceItem[]>([]);
  const [selectedKioskItems, setSelectedKioskItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'expensa' | 'combinado'>('efectivo');
  const [paymentAmounts, setPaymentAmounts] = useState({
    efectivo: 0,
    transferencia: 0,
    expensa: 0
  });
  const [customItem, setCustomItem] = useState({ name: '', price: 0 });
  const [showCustomItem, setShowCustomItem] = useState(false);
  
  useEffect(() => {
    if (isOpen && bill) {
      setSelectedServices([]);
      setSelectedKioskItems([]);
      setPaymentMethod('efectivo');
      setPaymentAmounts({
        efectivo: 0,
        transferencia: 0,
        expensa: 0
      });
      setCustomItem({ name: '', price: 0 });
      setShowCustomItem(false);
    }
  }, [isOpen, bill]);
  
  if (!isOpen || !bill) return null;
  
  const addService = (service: CourtService) => {
    const existing = selectedServices.find(item => item.service.id === service.id);
    if (existing) {
      setSelectedServices(selectedServices.map(item =>
        item.service.id === service.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * service.price }
          : item
      ));
    } else {
      setSelectedServices([...selectedServices, {
        service,
        quantity: 1,
        subtotal: service.price
      }]);
    }
  };
  
  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(item => item.service.id !== serviceId));
  };
  
  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId);
      return;
    }
    
    setSelectedServices(selectedServices.map(item =>
      item.service.id === serviceId
        ? { ...item, quantity, subtotal: quantity * item.service.price }
        : item
    ));
  };
  
  const addKioskItem = (product: Product) => {
    const existing = selectedKioskItems.find(item => item.product.id === product.id);
    if (existing) {
      setSelectedKioskItems(selectedKioskItems.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * product.price }
          : item
      ));
    } else {
      setSelectedKioskItems([...selectedKioskItems, {
        product,
        quantity: 1,
        subtotal: product.price
      }]);
    }
  };
  
  const removeKioskItem = (productId: string) => {
    setSelectedKioskItems(selectedKioskItems.filter(item => item.product.id !== productId));
  };
  
  const updateKioskItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeKioskItem(productId);
      return;
    }
    
    setSelectedKioskItems(selectedKioskItems.map(item =>
      item.product.id === productId
        ? { ...item, quantity, subtotal: quantity * item.product.price }
        : item
    ));
  };
  
  const addCustomItem = () => {
    if (!customItem.name || customItem.price <= 0) return;
    
    const customProduct: Product = {
      id: `custom-${Date.now()}`,
      name: customItem.name,
      category: 'Personalizado',
      price: customItem.price,
      stock: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setSelectedKioskItems([...selectedKioskItems, {
      product: customProduct,
      quantity: 1,
      subtotal: customItem.price
    }]);
    
    setCustomItem({ name: '', price: 0 });
    setShowCustomItem(false);
  };
  
  const courtRate = 8000; // This should come from court data
  const now = new Date();
  const startTime = new Date(bill.startTime);
  const duration = Math.max(0, (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)); // hours
  const courtTotal = 0; // Tarifa fija por turno, no por tiempo
  const servicesTotal = selectedServices.reduce((sum, item) => sum + item.subtotal, 0);
  const kioskTotal = selectedKioskItems.reduce((sum, item) => sum + item.subtotal, 0);
  const turnRate = bill.courtRate || 0; // Tarifa fija por turno
  const grandTotal = turnRate + servicesTotal + kioskTotal;
  
  const handleComplete = () => {
    // Validar pagos combinados si está seleccionado
    if (paymentMethod === 'combinado') {
      const totalPaid = paymentAmounts.efectivo + paymentAmounts.transferencia + paymentAmounts.expensa;
      if (Math.abs(totalPaid - grandTotal) > 0.01) { // Tolerancia para decimales
        alert(`El total de los pagos ($${totalPaid}) debe ser igual al total de la factura ($${grandTotal})`);
        return;
      }
      if (totalPaid === 0) {
        alert('Debe ingresar al menos un monto de pago');
        return;
      }
    }

    onComplete({
      services: selectedServices,
      kioskItems: selectedKioskItems,
      paymentMethod,
      paymentAmounts: paymentMethod === 'combinado' ? paymentAmounts : undefined
    });
  };
  
  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(elapsed / 60);
    const minutes = elapsed % 60;
    return `${hours}h ${minutes}m`;
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'equipment': return <Coffee className="h-5 w-5 text-orange-500" />;
      case 'facility': return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'entry': return <User className="h-5 w-5 text-blue-500" />;
      default: return <Receipt className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-green-600 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Facturación - {bill.courtName}</h2>
              <p className="text-sm text-gray-500">{bill.customerName} ({bill.customerType === 'member' ? 'Socio' : 'Invitado'})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Reservation Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">Tiempo de Juego</p>
                  <p className="text-lg font-bold text-green-900">{getElapsedTime(bill.startTime)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">Tarifa por Hora</p>
                  <p className="text-lg font-bold text-green-900">${courtRate}</p>
                </div>
              </div>
              <div className="flex items-center">
                <User className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">Total Cancha</p>
                  <p className="text-lg font-bold text-green-900">${courtTotal}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Servicios Adicionales</h3>
              
              <div className="space-y-3 mb-4">
                {courtServices.map(service => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="mr-3">{getCategoryIcon(service.category)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500">${service.price}</p>
                        {service.description && (
                          <p className="text-xs text-gray-400">{service.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => addService(service)}
                      className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Selected Services */}
              {selectedServices.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Servicios Seleccionados</h4>
                  <div className="space-y-2">
                    {selectedServices.map(item => (
                      <div key={item.service.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-sm font-medium">{item.service.name}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateServiceQuantity(item.service.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateServiceQuantity(item.service.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-16 text-right">${item.subtotal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Kiosk Items Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Productos del Kiosko</h3>
                <button
                  onClick={() => setShowCustomItem(!showCustomItem)}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  + Agregar personalizado
                </button>
              </div>
              
              {/* Custom Item Form */}
              {showCustomItem && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Nombre del item"
                      value={customItem.name}
                      onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Precio"
                      value={customItem.price}
                      onChange={(e) => setCustomItem({ ...customItem, price: parseFloat(e.target.value) || 0 })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={addCustomItem}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Agregar
                    </button>
                    <button
                      onClick={() => setShowCustomItem(false)}
                      className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {products.filter(p => p.stock > 0).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">${product.price} - Stock: {product.stock}</p>
                    </div>
                    <button
                      onClick={() => addKioskItem(product)}
                      className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Selected Kiosk Items */}
              {selectedKioskItems.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Productos Seleccionados</h4>
                  <div className="space-y-2">
                    {selectedKioskItems.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm font-medium">{item.product.name}</span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateKioskItemQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateKioskItemQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center disabled:opacity-50"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-16 text-right">${item.subtotal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Método de Pago</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {(['efectivo', 'transferencia', 'expensa', 'combinado'] as const).map((method) => (
                <label key={method} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mr-3"
                  />
                  <span className="font-medium capitalize">
                    {method === 'combinado' ? 'Pago Combinado' : method}
                  </span>
                </label>
              ))}
            </div>
            
            {/* Campos de pago combinado */}
            {paymentMethod === 'combinado' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">Desglose de Pagos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      💵 Efectivo
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmounts.efectivo}
                      onChange={(e) => setPaymentAmounts({
                        ...paymentAmounts,
                        efectivo: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      💳 Transferencia
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmounts.transferencia}
                      onChange={(e) => setPaymentAmounts({
                        ...paymentAmounts,
                        transferencia: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📄 Expensa
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentAmounts.expensa}
                      onChange={(e) => setPaymentAmounts({
                        ...paymentAmounts,
                        expensa: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="mt-3 flex justify-between items-center p-2 bg-white rounded border">
                  <span className="font-medium">Total ingresado:</span>
                  <span className={`font-bold ${
                    Math.abs((paymentAmounts.efectivo + paymentAmounts.transferencia + paymentAmounts.expensa) - grandTotal) < 0.01
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ${(paymentAmounts.efectivo + paymentAmounts.transferencia + paymentAmounts.expensa).toFixed(2)}
                  </span>
                </div>
                
                <div className="mt-1 flex justify-between items-center p-2 bg-gray-100 rounded">
                  <span className="font-medium">Total requerido:</span>
                  <span className="font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Total Summary */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Tarifa por turno:</span>
                <span>${turnRate}</span>
              </div>
              {servicesTotal > 0 && (
                <div className="flex justify-between">
                  <span>Servicios adicionales:</span>
                  <span>${servicesTotal}</span>
                </div>
              )}
              {kioskTotal > 0 && (
                <div className="flex justify-between">
                  <span>Productos del kiosko:</span>
                  <span>${kioskTotal}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span className="text-green-600">${grandTotal}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Completar Facturación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourtBillModal;