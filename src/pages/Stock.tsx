import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Search, BarChart3 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getStockLevels } from '../utils/db';
import { StockLevel } from '../types';

const Stock: React.FC = () => {
  const { refreshData } = useStore();
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [summaryLevel, setSummaryLevel] = useState('');
  
  useEffect(() => {
    const loadStockLevels = async () => {
      await refreshData();
      const levels = await getStockLevels();
      setStockLevels(levels);
    };
    
    loadStockLevels();
  }, []);
  
  const filteredStock = stockLevels.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = !filterLevel || item.level === filterLevel;
    return matchesSearch && matchesLevel;
  });
  
  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'empty':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };
  
  const getStatusText = (level: string) => {
    switch (level) {
      case 'high':
        return 'Stock alto';
      case 'medium':
        return 'Stock medio';
      case 'low':
        return 'Stock bajo';
      case 'empty':
        return 'Sin stock';
      default:
        return 'Desconocido';
    }
  };
  
  const getStatusColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      case 'empty':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const stats = {
    total: stockLevels.length,
    high: stockLevels.filter(item => item.level === 'high').length,
    medium: stockLevels.filter(item => item.level === 'medium').length,
    low: stockLevels.filter(item => item.level === 'low').length,
    empty: stockLevels.filter(item => item.level === 'empty').length,
  };
  
  const handleLevelClick = (level: string) => {
    setSummaryLevel(level);
    setShowSummary(true);
  };
  
  const getSummaryProducts = () => {
    return stockLevels.filter(item => item.level === summaryLevel);
  };
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Control de Stock</h1>
          <p className="mt-2 text-sm text-gray-700">
            Monitorea los niveles de inventario con sistema de semáforo
          </p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div 
          className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setFilterLevel('')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">{stats.total}</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Total</p>
              <p className="text-sm text-gray-500">productos</p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleLevelClick('high')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{stats.high}</p>
              <p className="text-sm text-gray-500">Stock alto</p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleLevelClick('medium')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{stats.medium}</p>
              <p className="text-sm text-gray-500">Stock medio</p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleLevelClick('low')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{stats.low}</p>
              <p className="text-sm text-gray-500">Stock bajo</p>
            </div>
          </div>
        </div>
        
        <div 
          className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleLevelClick('empty')}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{stats.empty}</p>
              <p className="text-sm text-gray-500">Sin stock</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los niveles</option>
            <option value="high">Stock alto</option>
            <option value="medium">Stock medio</option>
            <option value="low">Stock bajo</option>
            <option value="empty">Sin stock</option>
          </select>
        </div>
      </div>
      
      {/* Stock Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center mb-4">
          <BarChart3 className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Gráfico de Barras - Stock por Producto</h3>
        </div>
        <div className="space-y-4">
          {stockLevels.map((item) => {
            const maxStock = Math.max(...stockLevels.map(s => s.product.stock), 1);
            const percentage = (item.product.stock / maxStock) * 100;
            
            return (
              <div key={item.product.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{item.product.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{item.product.stock} u</span>
                    {getStatusIcon(item.level)}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all ${
                      item.level === 'high' ? 'bg-green-500' :
                      item.level === 'medium' ? 'bg-yellow-500' :
                      item.level === 'low' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{item.product.category}</span>
                  <span>Min: {item.product.minStock || 5}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Stock Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Actual
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Mínimo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nivel
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStock.map((item) => (
              <tr key={item.product.id} className={item.level === 'empty' ? 'bg-red-50' : item.level === 'low' ? 'bg-yellow-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.product.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{item.product.category}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.product.stock} unidades</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{item.product.minStock || 5} unidades</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.level)}`}>
                    {getStatusIcon(item.level)}
                    <span className="ml-1">{getStatusText(item.level)}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.level === 'high' ? 'bg-green-500' :
                        item.level === 'medium' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredStock.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron productos</p>
          </div>
        )}
      </div>
      
      {/* Modal de resumen por nivel */}
      {showSummary && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSummary(false)} />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                Productos con {getStatusText(summaryLevel)}
              </h2>
              <button
                onClick={() => setShowSummary(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="space-y-3">
                {getSummaryProducts().map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {getStatusIcon(item.level)}
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-500">{item.product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{item.product.stock} u</p>
                      <p className="text-sm text-gray-500">Min: {item.product.minStock || 5}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {getSummaryProducts().length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay productos en esta categoría</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;