import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import { addMovement, updateProduct } from '../utils/db';
import { Movement } from '../types';

const Movements: React.FC = () => {
  const { products, movements, refreshData } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'entrada' as Movement['type'],
    quantity: 0,
    notes: '',
  });
  
  useEffect(() => {
    refreshData();
  }, []);
  
  const filteredMovements = movements
    .filter(movement => {
      const matchesSearch = movement.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (movement.notes && movement.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = !typeFilter || movement.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const product = products.find(p => p.id === formData.productId);
    if (!product) return;
    
    try {
      // Si es venta o salida, actualizar stock
      if (formData.type === 'venta' || formData.type === 'salida') {
        await updateProduct(product.id, {
          ...product,
          stock: product.stock - formData.quantity
        });
      }
      
      // Registrar movimiento con precio y total automático
      await addMovement({
        productId: formData.productId,
        productName: product.name,
        type: formData.type,
        quantity: formData.quantity,
        notes: formData.notes,
        total: formData.type === 'venta' ? product.price * formData.quantity : null
      });
      
      setFormData({
        productId: '',
        type: 'entrada',
        quantity: 0,
        notes: '',
      });
      setIsDialogOpen(false);
      await refreshData();
    } catch (error) {
      console.error('Error al agregar movimiento:', error);
    }
  };
  
  const getMovementIcon = (type: Movement['type']) => {
    switch (type) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'salida':
      case 'venta':
      case 'merma':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getMovementColor = (type: Movement['type']) => {
    switch (type) {
      case 'entrada':
        return 'bg-green-100 text-green-800';
      case 'venta':
        return 'bg-blue-100 text-blue-800';
      case 'salida':
        return 'bg-red-100 text-red-800';
      case 'merma':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getMovementText = (type: Movement['type']) => {
    switch (type) {
      case 'entrada':
        return 'Entrada';
      case 'salida':
        return 'Salida';
      case 'venta':
        return 'Venta';
      case 'merma':
        return 'Merma';
      default:
        return type;
    }
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Movimientos de Inventario</h1>
          <p className="mt-2 text-sm text-gray-700">
            Historial de entradas, salidas y ventas del inventario
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar movimientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="venta">Ventas</option>
            <option value="merma">Mermas</option>
          </select>
        </div>
      </div>
      
      {/* Movements Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMovements.map((movement) => (
              <tr key={movement.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(movement.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{movement.productName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementColor(movement.type)}`}>
                    {getMovementIcon(movement.type)}
                    <span className="ml-1">{getMovementText(movement.type)}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${movement.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {movement.type === 'entrada' ? '+' : '-'}{movement.quantity}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{movement.total ? `$${movement.total}` : '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{movement.notes || '-'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredMovements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron movimientos</p>
          </div>
        )}
      </div>
      
      {/* Add Movement Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setIsDialogOpen(false)} />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Nuevo Movimiento</h2>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Plus className="h-5 w-5 rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccionar producto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Movement['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="entrada">Entrada (reposición)</option>
                  <option value="venta">Venta</option>
                  <option value="salida">Salida</option>
                  <option value="merma">Merma</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movements;
