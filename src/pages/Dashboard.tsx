import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Calendar,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useStore } from '../store/useStore';

const Dashboard: React.FC = () => {
  const { products, sales, movements, courtBills, refreshData } = useStore();
  const [dateRange, setDateRange] = useState('today');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  
  useEffect(() => {
    refreshData();
  }, []);
  
  // Filtrar datos por rango de fechas
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: new Date() };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: new Date() };
      case 'custom':
        const startDate = customDateStart ? new Date(customDateStart) : today;
        const endDate = customDateEnd ? new Date(customDateEnd + 'T23:59:59') : new Date();
        return { start: startDate, end: endDate };
      default:
        return { start: today, end: new Date() };
    }
  };
  
  const { start, end } = getDateRange();
  
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    return saleDate >= start && saleDate < end;
  });
  
  const filteredCourtBills = courtBills.filter(bill => {
    const billDate = new Date(bill.createdAt);
    return billDate >= start && billDate < end;
  });
  
  const filteredMovements = movements.filter(movement => {
    const movementDate = new Date(movement.createdAt);
    return movementDate >= start && movementDate < end;
  });
  
  // Métricas principales
  const kioskRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const courtRevenue = filteredCourtBills.reduce((sum, bill) => sum + bill.total, 0);
  const totalRevenue = kioskRevenue + courtRevenue;
  const totalSales = filteredSales.length + filteredCourtBills.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  
  const lowStockProducts = products.filter(p => p.stock < (p.minStock || 5));
  const outOfStockProducts = products.filter(p => p.stock === 0);
  
  // Productos más vendidos
  const productSales = filteredSales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const productId = item.product.id;
      if (!acc[productId]) {
        acc[productId] = {
          product: item.product,
          quantity: 0,
          revenue: 0
        };
      }
      acc[productId].quantity += item.quantity;
      acc[productId].revenue += item.subtotal;
    });
    return acc;
  }, {} as Record<string, { product: any; quantity: number; revenue: number }>);
  
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
  
  // Ventas por categoría
  const categorySales = filteredSales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const category = item.product.category;
      if (!acc[category]) {
        acc[category] = { quantity: 0, revenue: 0 };
      }
      acc[category].quantity += item.quantity;
      acc[category].revenue += item.subtotal;
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);
  
  // Predicciones simples
  const getPredictions = () => {
    if (totalSales < 2) return null;
    
    const dailyRevenue = [...filteredSales, ...filteredCourtBills].reduce((acc, transaction) => {
      const date = new Date(transaction.createdAt).toDateString();
      acc[date] = (acc[date] || 0) + transaction.total;
      return acc;
    }, {} as Record<string, number>);
    
    const revenues = Object.values(dailyRevenue);
    const avgDailyRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    
    return {
      projectedWeekly: avgDailyRevenue * 7,
      projectedMonthly: avgDailyRevenue * 30,
      trend: revenues.length > 1 ? 
        (revenues[revenues.length - 1] > revenues[revenues.length - 2] ? 'up' : 'down') : 'stable'
    };
  };
  
  const predictions = getPredictions();
  
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Ejecutivo</h1>
          <p className="mt-2 text-sm text-gray-700">
            Análisis visual y predictivo del negocio
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>
      </div>
      
      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900">${averageTicket.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Stock Bajo</p>
              <p className="text-2xl font-bold text-gray-900">{lowStockProducts.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Ingresos por fuente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por Fuente</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-green-800">Kiosko</span>
              <span className="font-bold text-green-900">${kioskRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-blue-800">Canchas</span>
              <span className="font-bold text-blue-900">${courtRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transacciones por Tipo</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium text-green-800">Ventas Kiosko</span>
              <span className="font-bold text-green-900">{filteredSales.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium text-blue-800">Facturas Canchas</span>
              <span className="font-bold text-blue-900">{filteredCourtBills.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Predicciones */}
      {predictions && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Proyecciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Proyección Semanal</p>
              <p className="text-xl font-bold text-green-600">${predictions.projectedWeekly.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Proyección Mensual</p>
              <p className="text-xl font-bold text-blue-600">${predictions.projectedMonthly.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tendencia</p>
              <div className="flex items-center justify-center">
                {predictions.trend === 'up' ? (
                  <TrendingUp className="h-6 w-6 text-green-500" />
                ) : predictions.trend === 'down' ? (
                  <TrendingDown className="h-6 w-6 text-red-500" />
                ) : (
                  <div className="h-6 w-6 bg-gray-400 rounded-full" />
                )}
                <span className={`ml-2 font-medium ${
                  predictions.trend === 'up' ? 'text-green-600' : 
                  predictions.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {predictions.trend === 'up' ? 'Creciendo' : 
                   predictions.trend === 'down' ? 'Decreciendo' : 'Estable'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Productos más vendidos */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Productos Más Vendidos
          </h3>
          <div className="space-y-4">
            {topProducts.map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-500">{item.product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{item.quantity} u</p>
                  <p className="text-sm text-gray-500">${item.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Ventas por categoría */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Ventas por Categoría
          </h3>
          <div className="space-y-4">
            {Object.entries(categorySales).map(([category, data]) => {
              const percentage = kioskRevenue > 0 ? (data.revenue / kioskRevenue) * 100 : 0;
              return (
                <div key={category} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">{category}</span>
                    <span className="text-sm text-gray-500">${data.revenue.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{data.quantity} unidades</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Alertas de stock */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Alertas de Inventario
          </h3>
          
          {outOfStockProducts.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-red-700 mb-2">Sin Stock ({outOfStockProducts.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {outOfStockProducts.map(product => (
                  <span key={product.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {product.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {lowStockProducts.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-700 mb-2">Stock Bajo ({lowStockProducts.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowStockProducts.map(product => (
                  <span key={product.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {product.name} ({product.stock}u)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;