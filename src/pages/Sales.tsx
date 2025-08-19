import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Coffee, Package, Zap, AlertTriangle, User, Clock } from 'lucide-react';
import { useStore } from '../store/useStore';
import { addSale, updateAdminTurn, addAdminTurn } from '../utils/db';
import ProductCard from '../components/ProductCard';
import Cart from '../components/Cart';

const Sales: React.FC = () => {
  const { 
    products, 
    cart, 
    activeTurn,
    setActiveTurn,
    isAdmin,
    addToCart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    getCartTotal,
    refreshData
  } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [showTurnModal, setShowTurnModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [initialCash, setInitialCash] = useState(0);
  
  useEffect(() => {
    refreshData();
  }, []);
  
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  const categories = [...new Set(products.map(p => p.category))];
  
  const getQuantityInCart = (productId: string) => {
    const item = cart.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };
  
  const handleCheckout = async (paymentData: {
    paymentMethod: 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
    customerName?: string;
    lotNumber?: string;
    paymentBreakdown?: {
      efectivo: number;
      transferencia: number;
      expensa: number;
    };
    customPrices?: Record<string, number>;
  }) => {
    if (cart.length === 0) return;
    
    // Verificar que hay un turno activo
    if (!activeTurn) {
      alert('No hay un turno activo. Debe abrir un turno antes de realizar ventas.');
      setShowTurnModal(true);
      return;
    }
    
    try {
      // Preparar items con precios personalizados si existen
      const finalItems = cart.map(item => {
        if (paymentData.customPrices && paymentData.customPrices[item.product.id]) {
          const customPrice = paymentData.customPrices[item.product.id];
          return {
            ...item,
            product: {
              ...item.product,
              price: customPrice
            },
            subtotal: customPrice * item.quantity
          };
        }
        return item;
      });
      
      // Calcular el total final con precios personalizados
      const finalTotal = finalItems.reduce((sum, item) => sum + item.subtotal, 0);
      
      // El paymentBreakdown ya viene correctamente del Cart
      const finalPaymentBreakdown = paymentData.paymentBreakdown!; // Siempre existe ahora
      
      const newSale = await addSale({
        items: finalItems,
        total: finalTotal,
        paymentMethod: paymentData.paymentMethod,
        customerName: paymentData.customerName,
        lotNumber: paymentData.lotNumber,
        courtId: selectedCourt || undefined,
        paymentBreakdown: finalPaymentBreakdown,
      });
      
      // Actualizar el turno activo con la nueva venta
      const updatedSales = [...activeTurn.sales, newSale];
      
      // Calcular incrementos por método de pago
      const efectivoIncrement = finalPaymentBreakdown.efectivo;
      const transferenciaIncrement = finalPaymentBreakdown.transferencia;
      const expensaIncrement = finalPaymentBreakdown.expensa;
      
      const newTotals = {
        efectivo: activeTurn.totals.efectivo + efectivoIncrement,
        transferencia: activeTurn.totals.transferencia + transferenciaIncrement,
        expensa: activeTurn.totals.expensa + expensaIncrement,
        total: activeTurn.totals.total + (efectivoIncrement + transferenciaIncrement + expensaIncrement)
      };
      
      const updatedTurn = await updateAdminTurn(activeTurn.id, {
        sales: updatedSales,
        totals: newTotals
      });
      
      if (updatedTurn) {
        setActiveTurn(updatedTurn);
      }
      
      // Play success sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsgBTuRsqSF');
      audio.play().catch(() => {});
      
      clearCart();
      setIsCartOpen(false);
      setSelectedCourt('');
      await refreshData();
    } catch (error) {
      console.error('Error al registrar la venta:', error);
      alert('Error al registrar la venta');
    }
  };
  
  const handleOpenTurn = async () => {
    if (!adminName.trim()) {
      alert('Debe ingresar el nombre del administrativo');
      return;
    }
    
    if (initialCash < 0) {
      alert('El monto de apertura no puede ser negativo');
      return;
    }
    
    if (initialCash === 0) {
      if (!window.confirm('¿Está seguro de abrir el turno sin monto inicial?')) {
        return;
      }
    }
    
    try {
      // Crear transacción de caja inicial si hay monto
      const initialTransactions = [];
      if (initialCash > 0) {
        const cajaInicialTransaction = {
          id: `caja-inicial-${Date.now()}`,
          receiptNumber: `CI-${Date.now()}`,
          items: [{
            product: {
              id: 'caja-inicial',
              name: 'Caja Inicial',
              category: 'Administrativo',
              price: initialCash,
              stock: 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            quantity: 1,
            subtotal: initialCash
          }],
          total: initialCash,
          paymentMethod: 'efectivo' as const,
          customerName: `Caja Inicial - ${adminName.trim()}`,
          createdAt: new Date().toISOString()
        };
        initialTransactions.push(cajaInicialTransaction);
      }

      const newTurn = await addAdminTurn({
        adminName: adminName.trim(),
        startDate: new Date().toISOString(),
        status: 'active',
        sales: initialTransactions,
        courtBills: [],
        transactions: [],
        totals: {
          efectivo: initialCash,
          transferencia: 0,
          expensa: 0,
          total: initialCash
        }
      });
      
      setActiveTurn(newTurn);
      setShowTurnModal(false);
      setAdminName('');
      setInitialCash(0);
      await refreshData();
    } catch (error) {
      console.error('Error al abrir turno:', error);
    }
  };
  
  // Si no hay turno activo, mostrar mensaje
  if (!activeTurn) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-yellow-100 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No hay turno activo
            </h2>
            <p className="text-gray-600 mb-6">
              Debe abrir un turno administrativo antes de realizar ventas.
            </p>
            <button
              onClick={() => setShowTurnModal(true)}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Abrir Nuevo Turno
            </button>
          </div>
        </div>
        
        {/* Modal para abrir turno */}
        {showTurnModal && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" />
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <User className="h-5 w-5 mr-2 text-green-600" />
                  Abrir Nuevo Turno
                </h2>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Administrativo
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Ingrese su nombre"
                    autoFocus
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto de Caja Inicial
                  </label>
                  <input
                    type="number"
                    value={initialCash}
                    onChange={(e) => setInitialCash(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowTurnModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleOpenTurn}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Abrir Turno
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Información del turno activo */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="space-y-4">
          {/* Información del administrativo y hora */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Turno Activo</p>
                <p className="text-lg font-bold text-green-900">{activeTurn.adminName}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-green-600 mr-2" />
              <div className="text-right">
                <p className="text-sm font-medium text-green-800">Inicio</p>
                <p className="text-sm text-green-700">
                  {new Date(activeTurn.startDate).toLocaleString('es-ES')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Totales por método de pago */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💵</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Efectivo</p>
                  <p className="text-lg font-bold text-green-900">${activeTurn.totals.efectivo}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💳</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Transferencia</p>
                  <p className="text-lg font-bold text-green-900">${activeTurn.totals.transferencia}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📄</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Expensa</p>
                  <p className="text-lg font-bold text-green-900">${activeTurn.totals.expensa}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 rounded-lg p-3 border border-green-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Total General</p>
                  <p className="text-lg font-bold text-green-900">${activeTurn.totals.total}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Section with Logo Background */}
      <div className="relative bg-gradient-to-r from-blue-600 to-green-600 rounded-lg mb-8 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url("/logo celeste.jpg")' }}
        ></div>
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative px-6 py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <ShoppingCart className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Villanueva Pádel - SAN BENITO
          </h1>
          <p className="text-blue-100 text-lg">
            {isAdmin 
              ? 'Panel completo de ventas creado por Damian Cupo' 
              : 'Sistema de ventas rápidas para empleados'
            }
          </p>
          <div className="mt-6 flex justify-center space-x-8 text-white">
            <div className="text-center">
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-sm text-blue-100">Productos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{cart.length}</div>
              <div className="text-sm text-blue-100">En Carrito</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${getCartTotal()}</div>
              <div className="text-sm text-blue-100">Total</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">Productos Disponibles</h2>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 relative transition-all"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Carrito ({cart.length})
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={selectedCourt}
            onChange={(e) => setSelectedCourt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Seleccionar cancha</option>
            <option value="court-1">SILICON (Cancha 1)</option>
            <option value="court-2">REMAX (Cancha 2)</option>
            <option value="court-3">PHIA RENTAL (Cancha 3)</option>
          </select>
        </div>
      </div>
      
      {/* Category Icons */}
      <div className="flex justify-center space-x-8 mb-6">
        {categories.map(category => {
          const getIcon = () => {
            switch (category.toLowerCase()) {
              case 'bebidas': return <Coffee className="h-8 w-8 text-blue-500" />;
              case 'snacks': return <Package className="h-8 w-8 text-orange-500" />;
              case 'deportes': return <Zap className="h-8 w-8 text-green-500" />;
              default: return <Package className="h-8 w-8 text-gray-500" />;
            }
          };
          
          return (
            <button
              key={category}
              onClick={() => setCategoryFilter(categoryFilter === category ? '' : category)}
              className={`flex flex-col items-center p-4 rounded-lg transition-all ${
                categoryFilter === category 
                  ? 'bg-green-100 text-green-700 shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {getIcon()}
              <span className="text-sm font-medium mt-2">{category}</span>
            </button>
          );
        })}
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={getQuantityInCart(product.id)}
            onAdd={(quantity) => addToCart(product, quantity)}
            onRemove={() => removeFromCart(product.id)}
            onUpdateQuantity={(quantity) => updateCartQuantity(product.id, quantity)}
          />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron productos</p>
        </div>
      )}
      
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </div>
  );
};

export default Sales;