import React, { useState } from 'react';
import { X, Eye, Download, Search, Calendar, User, MapPin, Receipt, CreditCard, FileText, Banknote, DollarSign } from 'lucide-react';

interface TransactionItem {
  id?: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descuento?: number;
  categoria?: string;
}

interface TransactionDetail {
  id: string;
  fecha: string;
  hora: string;
  tipo: string;
  recibo: string;
  withdrawalId?: string;
  cliente: string;
  lote: string;
  origen: string;
  total: number;
  metodo: string;
  items: TransactionItem[];
  adminName?: string;
  notes?: string;
  paymentBreakdown?: {
    efectivo: number;
    transferencia: number;
    expensa: number;
  };
  createdAt: string;
}

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDetail | null;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  transaction 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !transaction) return null;

  const filteredItems = transaction.items.filter(item =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.categoria && item.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'efectivo': return <Banknote className="h-4 w-4 text-green-600" />;
      case 'transferencia': return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'expensa': return <FileText className="h-4 w-4 text-purple-600" />;
      case 'combinado': return (
        <div className="flex space-x-1">
          <Banknote className="h-3 w-3 text-green-600" />
          <CreditCard className="h-3 w-3 text-blue-600" />
          <FileText className="h-3 w-3 text-purple-600" />
        </div>
      );
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'kiosk': return 'Kiosco';
      case 'court': return 'Cancha';
      case 'retiro': return 'Retiro';
      case 'gasto': return 'Gasto';
      case 'caja-inicial': return 'Caja Inicial';
      default: return 'Otro';
    }
  };

  const exportTransactionCSV = () => {
    const headers = [
      'Recibo',
      'Fecha',
      'Hora',
      'Tipo',
      'Cliente',
      'Lote',
      'Origen',
      'Artículo',
      'Cantidad',
      'Precio Unitario',
      'Descuento',
      'Subtotal',
      'Total Transacción',
      'Método Pago',
      'Efectivo',
      'Transferencia',
      'Expensa',
      'Notas'
    ];

    const rows = filteredItems.map(item => [
      transaction.recibo,
      transaction.fecha,
      transaction.hora,
      getTypeLabel(transaction.tipo),
      transaction.cliente,
      transaction.lote,
      transaction.origen,
      item.nombre,
      item.cantidad,
      item.precioUnitario,
      item.descuento || 0,
      item.subtotal,
      transaction.total,
      transaction.metodo === 'combinado' ? 
        (() => {
          const methods = [];
          if (transaction.paymentBreakdown?.efectivo > 0) methods.push('Efectivo');
          if (transaction.paymentBreakdown?.transferencia > 0) methods.push('Transferencia');
          if (transaction.paymentBreakdown?.expensa > 0) methods.push('Expensa');
          return methods.join(' + ');
        })()
        : transaction.metodo,
      transaction.paymentBreakdown?.efectivo || (transaction.metodo === 'efectivo' ? transaction.total : 0),
      transaction.paymentBreakdown?.transferencia || (transaction.metodo === 'transferencia' ? transaction.total : 0),
      transaction.paymentBreakdown?.expensa || (transaction.metodo === 'expensa' ? transaction.total : 0),
      transaction.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `detalle-transaccion-${transaction.recibo}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalItems = filteredItems.reduce((sum, item) => sum + item.cantidad, 0);
  const totalDescuentos = filteredItems.reduce((sum, item) => sum + (item.descuento || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Detalle de Transacción - {transaction.recibo}
              </h2>
              <p className="text-sm text-gray-600">
                {getTypeLabel(transaction.tipo)} • {transaction.fecha} {transaction.hora}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportTransactionCSV}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              title="Exportar detalle a CSV"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Información General
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">{getTypeLabel(transaction.tipo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recibo:</span>
                  <span className="font-medium font-mono">{transaction.recibo}</span>
                </div>
                {transaction.withdrawalId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID Retiro:</span>
                    <span className="font-medium text-red-600 font-mono">{transaction.withdrawalId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Cliente:
                  </span>
                  <span className="font-medium text-right max-w-xs break-words">{transaction.cliente}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Lote:
                  </span>
                  <span className="font-medium">{transaction.lote}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Origen:</span>
                  <span className="font-medium text-right max-w-xs break-words">{transaction.origen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Fecha/Hora:
                  </span>
                  <span className="font-medium">{transaction.fecha} {transaction.hora}</span>
                </div>
                {transaction.adminName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Administrador:</span>
                    <span className="font-medium">{transaction.adminName}</span>
                  </div>
                )}
                {transaction.notes && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {transaction.tipo === 'retiro' ? 'Notas:' : 
                       transaction.tipo === 'gasto' ? 'Detalle:' : 'Notas:'}
                    </span>
                    <span className="font-medium text-right max-w-xs break-words">
                      {transaction.notes}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Información de Pago */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Información de Pago
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Método de Pago:</span>
                  <div className="flex items-center">
                    {getPaymentIcon(transaction.metodo)}
                    <span className="ml-2 font-medium capitalize">
                      {transaction.metodo === 'combinado' ? 'Pago Combinado' : transaction.metodo}
                    </span>
                  </div>
                </div>

                {/* Desglose de pago combinado */}
                {transaction.paymentBreakdown ? (
                  <div className="space-y-2 mt-4">
                    <h4 className="font-medium text-blue-900 text-sm">Desglose de Pagos:</h4>
                    {transaction.paymentBreakdown.efectivo > 0 && (
                      <div className="flex justify-between p-2 bg-green-50 rounded border border-green-200">
                        <span className="flex items-center text-sm">
                          <Banknote className="h-4 w-4 text-green-600 mr-2" />
                          Efectivo:
                        </span>
                        <span className="font-medium text-green-800">${transaction.paymentBreakdown.efectivo.toFixed(2)}</span>
                      </div>
                    )}
                    {transaction.paymentBreakdown.transferencia > 0 && (
                      <div className="flex justify-between p-2 bg-blue-50 rounded border border-blue-200">
                        <span className="flex items-center text-sm">
                          <CreditCard className="h-4 w-4 text-blue-600 mr-2" />
                          Transferencia:
                        </span>
                        <span className="font-medium text-blue-800">${transaction.paymentBreakdown.transferencia.toFixed(2)}</span>
                      </div>
                    )}
                    {transaction.paymentBreakdown.expensa > 0 && (
                      <div className="flex justify-between p-2 bg-purple-50 rounded border border-purple-200">
                        <span className="flex items-center text-sm">
                          <FileText className="h-4 w-4 text-purple-600 mr-2" />
                          Expensa:
                        </span>
                        <span className="font-medium text-purple-800">${transaction.paymentBreakdown.expensa.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Mostrar mensaje de error si no hay paymentBreakdown
                  <div className="space-y-2 mt-4">
                    <h4 className="font-medium text-blue-900 text-sm">Desglose de Pagos:</h4>
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800">
                        ❌ Esta transacción no tiene información de desglose de pagos.
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Total: ${transaction.total.toFixed(2)} - Método: {transaction.metodo}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Esta venta fue registrada antes de la corrección del sistema.
                      </p>
                    </div>
                  </div>
                )}

                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className={`text-2xl font-bold ${
                      transaction.total < 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${transaction.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Artículos Facturados */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center">
                <Receipt className="h-5 w-5 mr-2 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Artículos Facturados ({filteredItems.length})
                </h3>
              </div>
              
              {/* Buscador de artículos */}
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar artículos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="p-4 bg-blue-50 border-b">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Items</p>
                  <p className="text-lg font-bold text-blue-900">{totalItems}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Artículos Únicos</p>
                  <p className="text-lg font-bold text-blue-900">{filteredItems.length}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Descuentos</p>
                  <p className="text-lg font-bold text-blue-900">${totalDescuentos.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Subtotal Items</p>
                  <p className="text-lg font-bold text-blue-900">
                    ${filteredItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabla de artículos */}
            <div className="overflow-x-auto">
              {filteredItems.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Artículo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Precio Unit.
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descuento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.nombre}</div>
                            {item.categoria && (
                              <div className="text-xs text-gray-500">{item.categoria}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 text-center font-medium">
                            {item.cantidad}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            ${item.precioUnitario.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            (item.descuento || 0) > 0 ? 'text-red-600' : 'text-gray-400'
                          }`}>
                            {(item.descuento || 0) > 0 ? `-$${item.descuento.toFixed(2)}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-green-600">
                            ${item.subtotal.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center">
                  {searchTerm ? (
                    <div>
                      <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron artículos</h3>
                      <p className="text-gray-500">
                        No hay artículos que coincidan con "{searchTerm}"
                      </p>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Sin artículos detallados</h3>
                      <p className="text-gray-500">
                        Esta transacción no tiene artículos individuales registrados
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resumen final */}
            {filteredItems.length > 0 && (
              <div className="p-4 bg-gray-50 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Artículos</p>
                    <p className="text-lg font-bold text-gray-900">{totalItems}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Descuentos</p>
                    <p className="text-lg font-bold text-red-600">-${totalDescuentos.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Subtotal Items</p>
                    <p className="text-lg font-bold text-green-600">
                      ${filteredItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
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

export default TransactionDetailModal;