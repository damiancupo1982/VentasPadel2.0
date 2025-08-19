import React, { useState, useEffect } from 'react';
import { ShoppingCart, X, CreditCard, Banknote, FileText, User, MapPin, Edit3, Check, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: (paymentData: {
    paymentMethod: 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
    customerName?: string;
    lotNumber?: string;
    paymentBreakdown?: {
      efectivo: number;
      transferencia: number;
      expensa: number;
    };
    customPrices?: Record<string, number>;
  }) => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose, onCheckout }) => {
  const { cart, removeFromCart, updateCartQuantity, getCartTotal } = useStore();
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'expensa' | 'combinado'>('efectivo');
  const [customerName, setCustomerName] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  
  // Estados para pagos combinados
  const [paymentAmounts, setPaymentAmounts] = useState({
    efectivo: 0,
    transferencia: 0,
    expensa: 0
  });
  
  // Estados para edición de precios
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  
  // Validaciones
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  useEffect(() => {
    // Inicializar precios editables con precios originales
    const initialPrices: Record<string, number> = {};
    cart.forEach(item => {
      initialPrices[item.product.id] = item.product.price;
    });
    setEditingPrices(initialPrices);
  }, [cart]);
  
  const resetForm = () => {
    setShowCheckout(false);
    setPaymentMethod('efectivo');
    setCustomerName('');
    setLotNumber('');
    setPaymentAmounts({ efectivo: 0, transferencia: 0, expensa: 0 });
    setEditingPrices({});
    setEditingProductId(null);
    setErrors({});
  };
  
  if (!isOpen) return null;
  
  // Calcular total con precios editados
  const getCustomTotal = () => {
    return cart.reduce((total, item) => {
      const customPrice = editingPrices[item.product.id] || item.product.price;
      return total + (customPrice * item.quantity);
    }, 0);
  };
  
  const total = getCustomTotal();
  const totalPaymentAmounts = paymentAmounts.efectivo + paymentAmounts.transferencia + paymentAmounts.expensa;
  
  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    setShowCheckout(true);
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validar pagos combinados
    if (paymentMethod === 'combinado') {
      if (totalPaymentAmounts === 0) {
        newErrors.payment = 'Debe ingresar al menos un monto de pago';
      } else if (Math.abs(totalPaymentAmounts - total) > 0.01) {
        newErrors.payment = `El total de pagos ($${totalPaymentAmounts}) debe ser igual al total ($${total})`;
      }
    }
    
    // Validar campos obligatorios para expensas
    const hasExpensaPayment = paymentMethod === 'expensa' || 
                             (paymentMethod === 'combinado' && paymentAmounts.expensa > 0);
    
    if (hasExpensaPayment) {
      if (!customerName.trim()) {
        newErrors.customerName = 'El nombre es obligatorio para pagos con expensa';
      }
      if (!lotNumber.trim()) {
        newErrors.lotNumber = 'El número de lote es obligatorio para pagos con expensa';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleConfirmSale = () => {
    if (!validateForm()) return;
    
    // Preparar datos de pago con paymentBreakdown SIEMPRE
    let finalPaymentBreakdown: { efectivo: number; transferencia: number; expensa: number };
    
    if (paymentMethod === 'combinado') {
      // Para pagos combinados, usar el desglose del usuario
      finalPaymentBreakdown = {
        efectivo: paymentAmounts.efectivo,
        transferencia: paymentAmounts.transferencia,
        expensa: paymentAmounts.expensa
      };
    } else {
      // Para pagos simples, crear desglose asignando todo al método seleccionado
      finalPaymentBreakdown = {
        efectivo: paymentMethod === 'efectivo' ? total : 0,
        transferencia: paymentMethod === 'transferencia' ? total : 0,
        expensa: paymentMethod === 'expensa' ? total : 0
      };
    }
    
    const paymentData = {
      paymentMethod,
      customerName: customerName.trim() || undefined,
      lotNumber: lotNumber.trim() || undefined,
      paymentBreakdown: finalPaymentBreakdown, // SIEMPRE incluir el desglose
      customPrices: undefined as Record<string, number> | undefined
    };
    
    // Agregar precios personalizados si hay cambios
    const hasCustomPrices = Object.keys(editingPrices).some(productId => {
      const originalPrice = cart.find(item => item.product.id === productId)?.product.price || 0;
      return editingPrices[productId] !== originalPrice;
    });
    
    if (hasCustomPrices) {
      paymentData.customPrices = editingPrices;
    }
    
    onCheckout(paymentData);
  };
  
  const handleCancel = () => {
    resetForm();
  };
  
  const handleEditPrice = (productId: string, newPrice: number) => {
    const roundedPrice = Math.max(0, Math.round(newPrice));
    setEditingPrices(prev => ({
      ...prev,
      [productId]: roundedPrice
    }));
  };
  
  const handleStartEditingPrice = (productId: string) => {
    setEditingProductId(productId);
  };
  
  const handleFinishEditingPrice = () => {
    setEditingProductId(null);
  };
  
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'efectivo':
        return <Banknote className="h-5 w-5" />;
      case 'transferencia':
        return <CreditCard className="h-5 w-5" />;
      case 'expensa':
        return <FileText className="h-5 w-5" />;
      case 'combinado':
        return (
          <div className="flex space-x-1">
            <Banknote className="h-3 w-3" />
            <CreditCard className="h-3 w-3" />
            <FileText className="h-3 w-3" />
          </div>
        );
      default:
        return <Banknote className="h-5 w-5" />;
    }
  };
  
  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'efectivo':
        return 'Efectivo';
      case 'transferencia':
        return 'Transferencia';
      case 'expensa':
        return 'Expensa';
      case 'combinado':
        return 'Pago Combinado';
      default:
        return 'Efectivo';
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Carrito ({cart.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {!showCheckout ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 mt-8">El carrito está vacío</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const customPrice = editingPrices[item.product.id] || item.product.price;
                    const customSubtotal = customPrice * item.quantity;
                    const isEditing = editingProductId === item.product.id;
                    const priceChanged = customPrice !== item.product.price;
                    
                    return (
                      <div key={item.product.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Precio editable */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Precio:</span>
                            {isEditing ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  value={customPrice}
                                  onChange={(e) => handleEditPrice(item.product.id, parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                  min="0"
                                  step="1"
                                  autoFocus
                                />
                                <button
                                  onClick={handleFinishEditingPrice}
                                  className="text-green-600 hover:text-green-800 p-1"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <span className={`font-medium ${priceChanged ? 'text-green-600' : 'text-gray-900'}`}>
                                  ${customPrice}
                                </span>
                                {priceChanged && (
                                  <span className="text-xs text-gray-500 line-through">
                                    ${item.product.price}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleStartEditingPrice(item.product.id)}
                                  className="text-gray-400 hover:text-gray-600 p-1"
                                  title="Editar precio"
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Controles de cantidad */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                            >
                              -
                            </button>
                            
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className={`font-medium ${priceChanged ? 'text-green-600' : 'text-gray-900'}`}>
                              ${customSubtotal}
                            </p>
                            {priceChanged && (
                              <p className="text-xs text-gray-500 line-through">
                                ${item.subtotal}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="border-t p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">${total}</span>
                </div>
                
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Proceder al Pago
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Finalizar Venta</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total a cobrar:</span>
                      <span className="text-2xl font-bold text-green-600">${total}</span>
                    </div>
                  </div>
                </div>
                
                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Método de Pago *
                  </label>
                  <div className="space-y-2">
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
                        <div className="flex items-center">
                          {getPaymentIcon(method)}
                          <span className="ml-2 font-medium">{getPaymentLabel(method)}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.payment && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {errors.payment}
                    </p>
                  )}
                </div>
                
                {/* Desglose de Pago Combinado */}
                {paymentMethod === 'combinado' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Desglose de Pagos</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          💵 Monto en Efectivo
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={paymentAmounts.efectivo}
                          onChange={(e) => setPaymentAmounts({
                            ...paymentAmounts,
                            efectivo: parseInt(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          💳 Monto en Transferencia
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={paymentAmounts.transferencia}
                          onChange={(e) => setPaymentAmounts({
                            ...paymentAmounts,
                            transferencia: parseInt(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          📄 Monto en Expensa
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={paymentAmounts.expensa}
                          onChange={(e) => setPaymentAmounts({
                            ...paymentAmounts,
                            expensa: parseInt(e.target.value) || 0
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      
                      {/* Resumen de pagos */}
                      <div className="mt-4 p-3 bg-white rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Total ingresado:</span>
                          <span className={`font-bold ${
                            Math.abs(totalPaymentAmounts - total) < 0.01 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${totalPaymentAmounts}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total requerido:</span>
                          <span className="font-bold text-gray-900">${total}</span>
                        </div>
                        {Math.abs(totalPaymentAmounts - total) >= 0.01 && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Los montos no coinciden
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Campos de Cliente */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Nombre del Cliente {(paymentMethod === 'expensa' || (paymentMethod === 'combinado' && paymentAmounts.expensa > 0)) && '*'}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.customerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ingrese el nombre del cliente"
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {errors.customerName}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Número de Lote {(paymentMethod === 'expensa' || (paymentMethod === 'combinado' && paymentAmounts.expensa > 0)) && '*'}
                  </label>
                  <input
                    type="text"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      errors.lotNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Lote 123"
                  />
                  {errors.lotNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      {errors.lotNumber}
                    </p>
                  )}
                </div>
                
                {/* Aviso para expensas */}
                {(paymentMethod === 'expensa' || (paymentMethod === 'combinado' && paymentAmounts.expensa > 0)) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Pago con Expensa
                        </p>
                        <p className="text-xs text-yellow-700">
                          El nombre y número de lote son obligatorios para este tipo de pago
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t p-4">
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmSale}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Confirmar Venta
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;