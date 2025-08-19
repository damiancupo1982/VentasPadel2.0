import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Calendar, 
  Package,
  CreditCard,
  FileText,
  Banknote,
  DollarSign,
  Plus,
  Minus,
  User,
  MapPin,
  Receipt,
  Eye,
  X,
  Clock,
  Printer,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../store/useStore';
import TransactionDetailModal from '../components/TransactionDetailModal';

interface TurnTransaction {
  id: string;
  fecha: string;
  hora: string;
  tipo: 'kiosk' | 'court' | 'retiro' | 'caja-inicial';
  recibo: string;
  cliente: string;
  lote: string;
  origen: string;
  total: number;
  metodo: 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
  items?: any[];
  paymentBreakdown?: {
    efectivo: number;
    transferencia: number;
    expensa: number;
  };
  createdAt: string;
}

// ===== Helpers sin decimales =====
const toInt = (v: any): number => {
  const n = typeof v === 'string' ? parseFloat(v) : (v ?? 0);
  const num = Number.isFinite(n) ? n : 0;
  return Math.round(num);
};

const fmtMoney = (v: any): string =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(toInt(v));

const CurrentTurn: React.FC = () => {
  const { sales, courtBills, activeTurn, refreshData } = useStore();
  const [turnTransactions, setTurnTransactions] = useState<TurnTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TurnTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TurnTransaction | null>(null);

  useEffect(() => {
    try {
      refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTurn) {
      try {
        loadTurnTransactions();
      } catch (error) {
        console.error('Error loading turn transactions:', error);
        setTurnTransactions([]);
      }
    } else {
      setTurnTransactions([]);
    }
  }, [activeTurn, sales, courtBills]);

  useEffect(() => {
    applyFilters();
  }, [turnTransactions, searchTerm, paymentFilter, typeFilter]);

  const loadTurnTransactions = () => {
    if (!activeTurn) return;

    try {
      const turnStart = new Date(activeTurn.startDate);
      const transactions: TurnTransaction[] = [];

      // Ventas kiosco
      const turnSales = (sales || []).filter(sale => {
        if (!sale || !sale.createdAt) return false;
        try {
          const saleDate = new Date(sale.createdAt);
          return saleDate >= turnStart;
        } catch {
          return false;
        }
      });

      turnSales.forEach(sale => {
        if (!sale || !sale.id || !sale.receiptNumber) return;
        try {
          const saleDate = new Date(sale.createdAt);
          const transaction: TurnTransaction = {
            id: sale.id,
            fecha: saleDate.toLocaleDateString('es-ES'),
            hora: saleDate.toLocaleTimeString('es-ES'),
            tipo: sale.total < 0 ? 'retiro' : 
                  sale.customerName?.includes('Caja Inicial') ? 'caja-inicial' : 'kiosk',
            recibo: sale.receiptNumber,
            cliente: sale.customerName || 'Cliente general',
            lote: sale.lotNumber || '0',
            origen: sale.total < 0 ? 'Retiro de Caja' : 
                    sale.customerName?.includes('Caja Inicial') ? 'Caja Inicial' :
                    sale.courtId || 'Kiosco',
            total: toInt(sale.total || 0),
            metodo: sale.paymentMethod,
            items: sale.items || [],
            createdAt: sale.createdAt
          };
          transactions.push(transaction);
        } catch (error) {
          console.error('Error processing sale:', error);
        }
      });

      // Facturas canchas
      const turnCourtBills = (courtBills || []).filter(bill => {
        if (!bill || !bill.createdAt) return false;
        try {
          const billDate = new Date(bill.createdAt);
          return billDate >= turnStart;
        } catch {
          return false;
        }
      });

      turnCourtBills.forEach(bill => {
        if (!bill || !bill.id || !bill.receiptNumber) return;
        try {
          const billDate = new Date(bill.createdAt);
          const transaction: TurnTransaction = {
            id: bill.id,
            fecha: billDate.toLocaleDateString('es-ES'),
            hora: billDate.toLocaleTimeString('es-ES'),
            tipo: 'court',
            recibo: bill.receiptNumber,
            cliente: bill.customerName || 'Cliente',
            lote: bill.lotNumber || '0',
            origen: bill.courtName || 'Cancha',
            total: toInt(bill.total || 0),
            metodo: bill.paymentMethod,
            items: [...(bill.kioskItems || []), ...(bill.services || [])],
            paymentBreakdown: bill.paymentBreakdown
              ? {
                  efectivo: toInt(bill.paymentBreakdown.efectivo),
                  transferencia: toInt(bill.paymentBreakdown.transferencia),
                  expensa: toInt(bill.paymentBreakdown.expensa),
                }
              : undefined,
            createdAt: bill.createdAt
          };
          transactions.push(transaction);
        } catch (error) {
          console.error('Error processing court bill:', error);
        }
      });

      // Retiros manuales del turno
      if (activeTurn.transactions && Array.isArray(activeTurn.transactions)) {
        activeTurn.transactions.forEach(withdrawal => {
          if (!withdrawal || !withdrawal.id || !withdrawal.receiptNumber) return;
          try {
            const withdrawalDate = new Date(withdrawal.createdAt);
            const transaction: TurnTransaction = {
              id: withdrawal.id,
              fecha: withdrawalDate.toLocaleDateString('es-ES'),
              hora: withdrawalDate.toLocaleTimeString('es-ES'),
              tipo: 'retiro',
              recibo: withdrawal.receiptNumber,
              cliente: `Retiro - ${withdrawal.adminName || 'Admin'}`,
              lote: '0',
              origen: 'Retiro de Caja',
              total: -toInt(withdrawal.amount || 0),
              metodo: 'efectivo',
              items: [],
              createdAt: withdrawal.createdAt
            };
            transactions.push(transaction);
          } catch (error) {
            console.error('Error processing withdrawal:', error);
          }
        });
      }

      // Ordenar por fecha descendente
      transactions.sort((a, b) => {
        try {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch {
          return 0;
        }
      });
      setTurnTransactions(transactions);
    } catch (error) {
      console.error('Error in loadTurnTransactions:', error);
      setTurnTransactions([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...turnTransactions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.cliente.toLowerCase().includes(term) ||
        t.recibo.toLowerCase().includes(term) ||
        t.origen.toLowerCase().includes(term) ||
        t.lote.includes(term)
      );
    }
    if (typeFilter) filtered = filtered.filter(t => t.tipo === typeFilter);
    if (paymentFilter) filtered = filtered.filter(t => t.metodo === paymentFilter as any);

    setFilteredTransactions(filtered);
  };

  const exportTransactionsCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No hay transacciones para exportar');
      return;
    }

    const headers = ['Fecha', 'Hora', 'Tipo', 'Recibo', 'Cliente', 'Lote', 'Origen', 'Total', 'Método', 'Monto Efectivo', 'Monto Transferencia', 'Monto Expensa'];
    const rows = filteredTransactions.map(transaction => {
      const metodoStr =
        transaction.metodo === 'combinado'
          ? ['efectivo','transferencia','expensa']
              .filter(k => toInt((transaction.paymentBreakdown as any)?.[k] || 0) > 0)
              .map(m => (m === 'efectivo' ? 'Efectivo' : m === 'transferencia' ? 'Transferencia' : 'Expensa'))
              .join(' + ')
          : transaction.metodo;

      return [
        transaction.fecha,
        transaction.hora,
        getTypeLabel(transaction.tipo),
        transaction.recibo,
        transaction.cliente,
        transaction.lote,
        transaction.origen,
        toInt(transaction.total),
        metodoStr,
        transaction.paymentBreakdown ? toInt(transaction.paymentBreakdown.efectivo) : (transaction.metodo === 'efectivo' ? toInt(transaction.total) : 0),
        transaction.paymentBreakdown ? toInt(transaction.paymentBreakdown.transferencia) : (transaction.metodo === 'transferencia' ? toInt(transaction.total) : 0),
        transaction.paymentBreakdown ? toInt(transaction.paymentBreakdown.expensa) : (transaction.metodo === 'expensa' ? toInt(transaction.total) : 0),
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `turno-actual-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllTurnTransactionsCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No hay transacciones para exportar');
      return;
    }

    const headers = [
      'Fecha',
      'Hora', 
      'Tipo',
      'Recibo',
      'Cliente',
      'Lote',
      'Origen',
      'Total',
      'Método',
      'Efectivo',
      'Transferencia', 
      'Expensa',
      'Items',
      'Cantidades',
      'Precios'
    ];

    const rows = filteredTransactions.map(transaction => {
      const items = transaction.items || [];
      const itemNames = items.map(item => item.product?.name || item.service?.name || item.nombre || 'Item').join('; ');
      const itemQuantities = items.map(item => item.quantity || item.cantidad || 1).join('; ');
      const itemPrices = items.map(item => toInt(item.product?.price || item.service?.price || item.precio || 0)).join('; ');

      const metodoStr =
        transaction.metodo === 'combinado'
          ? ['efectivo','transferencia','expensa']
              .filter(k => toInt((transaction.paymentBreakdown as any)?.[k] || 0) > 0)
              .map(m => (m === 'efectivo' ? 'Efectivo' : m === 'transferencia' ? 'Transferencia' : 'Expensa'))
              .join(' + ')
          : transaction.metodo;

      return [
        transaction.fecha,
        transaction.hora,
        getTypeLabel(transaction.tipo),
        transaction.recibo,
        transaction.cliente,
        transaction.lote,
        transaction.origen,
        toInt(transaction.total),
        metodoStr,
        transaction.paymentBreakdown ? toInt(transaction.paymentBreakdown.efectivo) : (transaction.metodo === 'efectivo' ? toInt(transaction.total) : 0),
        transaction.paymentBreakdown ? toInt(transaction.paymentBreakdown.transferencia) : (transaction.metodo === 'transferencia' ? toInt(transaction.total) : 0),
        transaction.paymentBreakdown ? toInt(transaction.paymentBreakdown.expensa) : (transaction.metodo === 'expensa' ? toInt(transaction.total) : 0),
        itemNames,
        itemQuantities,
        itemPrices
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `turno-actual-completo-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preparar datos para modal
  const prepareTransactionForModal = (transaction: TurnTransaction) => {
    const items = (transaction.items || []).map(item => ({
      id: item.id || `item-${Date.now()}-${Math.random()}`,
      nombre: item.product?.name || item.service?.name || item.nombre || 'Item desconocido',
      cantidad: item.quantity || item.cantidad || 1,
      precioUnitario: toInt(item.product?.price || item.service?.price || item.precio || 0),
      subtotal: toInt(item.subtotal || (item.precio || 0) * (item.cantidad || 1)),
      descuento: toInt(item.descuento || 0),
      categoria: item.product?.category || item.service?.category || item.categoria || 'Sin categoría'
    }));

    return {
      ...transaction,
      items
    };
  };

  const printTurnSummary = () => {
    if (!activeTurn) return;

    const totales = {
      general: filteredTransactions.reduce((sum, t) => sum + toInt(t.total), 0),
      efectivo: filteredTransactions.reduce((sum, t) => {
        if (t.paymentBreakdown) return sum + toInt(t.paymentBreakdown.efectivo);
        return sum + (t.metodo === 'efectivo' ? toInt(t.total) : 0);
      }, 0),
      transferencia: filteredTransactions.reduce((sum, t) => {
        if (t.paymentBreakdown) return sum + toInt(t.paymentBreakdown.transferencia);
        return sum + (t.metodo === 'transferencia' ? toInt(t.total) : 0);
      }, 0),
      expensa: filteredTransactions.reduce((sum, t) => {
        if (t.paymentBreakdown) return sum + toInt(t.paymentBreakdown.expensa);
        return sum + (t.metodo === 'expensa' ? toInt(t.total) : 0);
      }, 0),
    };

    const printContent = `
      <html>
        <head>
          <title>Resumen del Turno - ${activeTurn.adminName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .transactions { margin: 15px 0; }
            .transaction { display: flex; justify-content: space-between; margin: 3px 0; font-size: 12px; }
            .totals { border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; }
            .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VILLANUEVA PÁDEL</h1>
            <h2>Resumen del Turno</h2>
          </div>
          
          <div class="info-row">
            <span><strong>Administrativo:</strong></span>
            <span>${activeTurn.adminName}</span>
          </div>
          
          <div class="info-row">
            <span><strong>Inicio:</strong></span>
            <span>${new Date(activeTurn.startDate).toLocaleString('es-ES')}</span>
          </div>
          
          <div class="info-row">
            <span><strong>Transacciones:</strong></span>
            <span>${filteredTransactions.length}</span>
          </div>
          
          <div class="transactions">
            <h3>Detalle de Transacciones:</h3>
            ${filteredTransactions.map(t => `
              <div class="transaction">
                <span>${t.fecha} ${t.hora}</span>
                <span>${getTypeLabel(t.tipo)}</span>
                <span>${t.cliente}</span>
                <span>${t.origen}</span>
                <span>$${fmtMoney(t.total)}</span>
                <span>${t.metodo}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="totals">
            <div class="total-row">
              <span>Efectivo:</span>
              <span>$${fmtMoney(totales.efectivo)}</span>
            </div>
            <div class="total-row">
              <span>Transferencia:</span>
              <span>$${fmtMoney(totales.transferencia)}</span>
            </div>
            <div class="total-row">
              <span>Expensa:</span>
              <span>$${fmtMoney(totales.expensa)}</span>
            </div>
            <div class="total-row" style="border-top: 1px solid #000; padding-top: 5px;">
              <span>TOTAL:</span>
              <span>$${fmtMoney(totales.general)}</span>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'kiosk':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'court':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'retiro':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'caja-inicial':
        return <Plus className="h-4 w-4 text-yellow-600" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'kiosk': return 'Kiosco';
      case 'court': return 'Cancha';
      case 'retiro': return 'Retiro';
      case 'caja-inicial': return 'Caja Inicial';
      default: return 'Otro';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'kiosk': return 'bg-green-100 text-green-800';
      case 'court': return 'bg-blue-100 text-blue-800';
      case 'retiro': return 'bg-red-100 text-red-800';
      case 'caja-inicial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'efectivo': return <Banknote className="h-4 w-4 text-green-600" />;
      case 'transferencia': return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'expensa': return <FileText className="h-4 w-4 text-purple-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  // Totales sin decimales
  const totales = (filteredTransactions || []).reduce((totals, transaction) => {
    const t = toInt(transaction?.total);
    totals.general += t;

    if (transaction.metodo === 'combinado' && transaction.paymentBreakdown) {
      totals.efectivo += toInt(transaction.paymentBreakdown.efectivo);
      totals.transferencia += toInt(transaction.paymentBreakdown.transferencia);
      totals.expensa += toInt(transaction.paymentBreakdown.expensa);
    } else {
      if (transaction.metodo === 'efectivo') totals.efectivo += t;
      else if (transaction.metodo === 'transferencia') totals.transferencia += t;
      else if (transaction.metodo === 'expensa') totals.expensa += t;
    }
    return totals;
  }, { general: 0, efectivo: 0, transferencia: 0, expensa: 0 });

  const handleResetTurnState = () => {
    if (window.confirm('¿Está seguro de que desea reiniciar el estado del turno? Esto eliminará todos los datos del turno actual.')) {
      try {
        localStorage.removeItem('villanueva-admin-turns');
        window.location.reload();
      } catch (error) {
        console.error('Error resetting turn state:', error);
        alert('Error al reiniciar el estado del turno');
      }
    }
  };

  // Si no hay turno activo
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
              No se puede mostrar el resumen del turno porque no hay un turno administrativo activo.
            </p>
            <button
              onClick={handleResetTurnState}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reiniciar Estado del Turno
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Validación mínima
  if (!activeTurn.adminName || !activeTurn.startDate) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Turno con datos inválidos
            </h2>
            <p className="text-gray-600 mb-6">
              Los datos del turno están corruptos o incompletos. Es necesario reiniciar el estado.
            </p>
            <button
              onClick={handleResetTurnState}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reiniciar Estado del Turno
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Turno Actual</h1>
          <p className="mt-2 text-sm text-gray-700">
            Resumen de transacciones del turno en curso
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <button
            onClick={printTurnSummary}
            className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Resumen
          </button>
          <button
            onClick={exportAllTurnTransactionsCSV}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Transacciones Completas
          </button>
        </div>
      </div>

      {/* Información del turno activo */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">Turno de</p>
              <p className="text-lg font-bold text-blue-900">{activeTurn.adminName || 'Admin'}</p>
            </div>
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-600 mr-2" />
            <div className="text-right">
              <p className="text-sm font-medium text-blue-800">Inicio</p>
              <p className="text-sm text-blue-700">
                {activeTurn.startDate ? new Date(activeTurn.startDate).toLocaleString('es-ES') : 'Fecha inválida'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-blue-800">Transacciones</p>
            <p className="text-xl font-bold text-blue-900">{filteredTransactions?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Totales por método de pago */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total General</p>
              <p className="text-2xl font-bold text-gray-900">${fmtMoney(totales.general)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-400">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Banknote className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Efectivo</p>
              <p className="text-2xl font-bold text-gray-900">${fmtMoney(totales.efectivo)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-400">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transferencia</p>
              <p className="text-2xl font-bold text-gray-900">${fmtMoney(totales.transferencia)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expensa</p>
              <p className="text-2xl font-bold text-gray-900">${fmtMoney(totales.expensa)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="kiosk">Kiosco</option>
            <option value="court">Cancha</option>
            <option value="retiro">Retiro</option>
            <option value="caja-inicial">Caja Inicial</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="expensa">Expensa</option>
          </select>

          <div className="flex items-center justify-center">
            <Receipt className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">{filteredTransactions?.length || 0} resultados</span>
          </div>
        </div>
      </div>

      {/* Tabla de transacciones */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recibo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(filteredTransactions || []).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{transaction.fecha || 'Fecha inválida'}</div>
                      <div className="text-gray-500">{transaction.hora || 'Hora inválida'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.tipo)}`}>
                      {getTypeIcon(transaction.tipo)}
                      <span className="ml-1">{getTypeLabel(transaction.tipo)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.recibo || 'Sin recibo'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      {transaction.cliente || 'Cliente desconocido'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      {transaction.lote || '0'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.origen || 'Origen desconocido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className={toInt(transaction.total) < 0 ? 'text-red-600' : 'text-green-600'}>
                      ${fmtMoney(transaction.total)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {getPaymentIcon(transaction.metodo || 'efectivo')}
                      <span className="ml-2 capitalize">
                        {transaction.metodo === 'combinado' ? 
                          ['efectivo','transferencia','expensa']
                            .filter(k => toInt((transaction.paymentBreakdown as any)?.[k] || 0) > 0)
                            .map(m => (m === 'efectivo' ? 'Efectivo' : m === 'transferencia' ? 'Transferencia' : 'Expensa'))
                            .join(' + ')
                          : (transaction.metodo || 'efectivo')
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => {
                        setSelectedTransaction(prepareTransactionForModal(transaction));
                        setShowTransactionDetail(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center"
                      title="Ver detalle completo"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {(!filteredTransactions || filteredTransactions.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay transacciones en el turno actual</p>
          </div>
        )}
      </div>

      {/* Modal de detalle de transacción */}
      <TransactionDetailModal
        isOpen={showTransactionDetail}
        onClose={() => setShowTransactionDetail(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default CurrentTurn;
