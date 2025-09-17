import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Calendar, 
  Filter,
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
  X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import TransactionDetailModal from '../components/TransactionDetailModal';

interface HistoricalTransaction {
  id: string;
  fecha: string;
  hora: string;
  tipo: 'kiosk' | 'court' | 'retiro' | 'caja-inicial' | 'gasto';
  recibo: string;
  withdrawalId?: string;
  cliente: string;
  lote: string;
  origen: string;
  total: number;
  metodo: 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
  items?: any[];
  adminName?: string;
  notes?: string;
  paymentBreakdown?: {
    efectivo: number;
    transferencia: number;
    expensa: number;
  };
  createdAt: string;
}

const Transactions: React.FC = () => {
  const { sales, courtBills, refreshData } = useStore();
  const [transactions, setTransactions] = useState<HistoricalTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<HistoricalTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<HistoricalTransaction | null>(null);

  // Estados temporales (UI) para filtros
  const [tempSearchTerm, setTempSearchTerm] = useState('');
  const [tempDateFilter, setTempDateFilter] = useState('all');
  const [tempCustomDateStart, setTempCustomDateStart] = useState('');
  const [tempCustomDateEnd, setTempCustomDateEnd] = useState('');
  const [tempTypeFilter, setTempTypeFilter] = useState('');
  const [tempPaymentFilter, setTempPaymentFilter] = useState('');

  useEffect(() => {
    loadHistoricalTransactions();
    refreshData();
  }, []);

  useEffect(() => {
    updateHistoricalTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, courtBills]);

  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  const loadHistoricalTransactions = () => {
    try {
      const stored = localStorage.getItem('historical-transactions-v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        setTransactions(parsed);
      }
    } catch (error) {
      console.error('Error loading historical transactions:', error);
      setTransactions([]);
    }
  };

  const saveHistoricalTransactions = (newTransactions: HistoricalTransaction[]) => {
    try {
      localStorage.setItem('historical-transactions-v1', JSON.stringify(newTransactions));
      setTransactions(newTransactions);
    } catch (error) {
      console.error('Error saving historical transactions:', error);
    }
  };

  const updateHistoricalTransactions = () => {
    const existingIds = new Set(transactions.map(t => t.id));
    const newTransactions: HistoricalTransaction[] = [];

    // 1) Ventas del kiosco
    sales.forEach(sale => {
      if (!existingIds.has(sale.id)) {
        const d = new Date(sale.createdAt);
        newTransactions.push({
          id: sale.id,
          fecha: d.toLocaleDateString('es-ES'),
          hora: d.toLocaleTimeString('es-ES'),
          tipo: sale.total < 0 ? 'retiro' : (sale.customerName?.includes('Caja Inicial') ? 'caja-inicial' : 'kiosk'),
          recibo: sale.receiptNumber,
          cliente: sale.customerName || 'Cliente general',
          lote: sale.lotNumber || '0',
          origen: sale.total < 0 ? 'Retiro de Caja' : (sale.customerName?.includes('Caja Inicial') ? 'Caja Inicial' : (sale.courtId || 'Kiosco')),
          total: sale.total,
          metodo: sale.paymentMethod,
          paymentBreakdown: sale.paymentBreakdown,
          items: sale.items,
          createdAt: sale.createdAt
        });
      }
    });

    // 2) Facturas de canchas
    courtBills.forEach(bill => {
      if (!existingIds.has(bill.id)) {
        const d = new Date(bill.createdAt);
        newTransactions.push({
          id: bill.id,
          fecha: d.toLocaleDateString('es-ES'),
          hora: d.toLocaleTimeString('es-ES'),
          tipo: 'court',
          recibo: bill.receiptNumber,
          cliente: bill.customerName,
          lote: bill.lotNumber || '0',
          origen: bill.courtName,
          total: bill.total,
          metodo: bill.paymentMethod === 'combinado' ? 'combinado' : bill.paymentMethod,
          paymentBreakdown: bill.paymentBreakdown,
          items: [...(bill.kioskItems || []), ...(bill.services || [])],
          createdAt: bill.createdAt
        });
      }
    });

    // 3) Retiros y gastos guardados en AdminTurns (históricos)
    const allTurns = JSON.parse(localStorage.getItem('villanueva-admin-turns') || '[]');
    allTurns.forEach((turn: any) => {
      if (turn.transactions) {
        turn.transactions.forEach((withdrawal: any) => {
          if (!existingIds.has(withdrawal.id)) {
            const d = new Date(withdrawal.createdAt);
            newTransactions.push({
              id: withdrawal.id,
              fecha: d.toLocaleDateString('es-ES'),
              hora: d.toLocaleTimeString('es-ES'),
              tipo: 'retiro',
              recibo: withdrawal.receiptNumber,
              withdrawalId: withdrawal.withdrawalId || `RETIRO-${String(withdrawal.id).slice(-4)}`,
              cliente: `Retiro - ${withdrawal.adminName}`,
              lote: '0',
              origen: 'Retiro de Caja',
              total: -withdrawal.amount,
              metodo: 'efectivo',
              items: [],
              adminName: withdrawal.adminName,
              notes: withdrawal.notes,
              createdAt: withdrawal.createdAt
            });
          }
        });
      }
      if (turn.expenses) {
        turn.expenses.forEach((expense: any) => {
          if (!existingIds.has(expense.id)) {
            const d = new Date(expense.createdAt);
            newTransactions.push({
              id: expense.id,
              fecha: d.toLocaleDateString('es-ES'),
              hora: d.toLocaleTimeString('es-ES'),
              tipo: 'gasto',
              recibo: expense.receiptNumber,
              cliente: `Gasto - ${expense.adminName}`,
              lote: '0',
              origen: expense.concept,
              total: -expense.amount,
              metodo: 'efectivo',
              items: [],
              adminName: expense.adminName,
              notes: expense.detail,
              createdAt: expense.createdAt
            });
          }
        });
      }
    });

    // 4) **NUEVO** — Retiros locales (villanueva-transactions) creados con withdrawCash()
    try {
      const localTx: any[] = JSON.parse(localStorage.getItem('villanueva-transactions') || '[]');
      localTx
        .filter(tx => tx && tx.kind === 'retiro')
        .forEach(tx => {
          if (!existingIds.has(tx.id)) {
            const d = new Date(tx.createdAt);
            newTransactions.push({
              id: tx.id,
              fecha: d.toLocaleDateString('es-ES'),
              hora: d.toLocaleTimeString('es-ES'),
              tipo: 'retiro',
              recibo: tx.receiptNumber,
              withdrawalId: `RETIRO-${String(tx.id).slice(-4)}`,
              cliente: `Retiro - ${tx.adminName || 'Admin'}`,
              lote: '0',
              origen: 'Retiro de Caja',
              total: tx.total, // ya negativo
              metodo: 'efectivo',
              items: [],
              adminName: tx.adminName,
              notes: tx.notes,
              paymentBreakdown: tx.paymentBreakdown
                ? {
                    efectivo: tx.paymentBreakdown.efectivo || 0,
                    transferencia: tx.paymentBreakdown.transferencia || 0,
                    expensa: tx.paymentBreakdown.expensa || 0
                  }
                : { efectivo: tx.total, transferencia: 0, expensa: 0 },
              createdAt: tx.createdAt
            });
          }
        });
    } catch (e) {
      console.warn('No se pudieron leer retiros locales:', e);
    }

    if (newTransactions.length > 0) {
      const updated = [...transactions, ...newTransactions]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      saveHistoricalTransactions(updated);
    }
  };

  // Aplicar filtros manualmente
  const handleApplyFilters = () => {
    setSearchTerm(tempSearchTerm);
    setDateFilter(tempDateFilter);
    setCustomDateStart(tempCustomDateStart);
    setCustomDateEnd(tempCustomDateEnd);
    setTypeFilter(tempTypeFilter);
    setPaymentFilter(tempPaymentFilter);

    applyFiltersWithValues(
      tempSearchTerm,
      tempDateFilter,
      tempCustomDateStart,
      tempCustomDateEnd,
      tempTypeFilter,
      tempPaymentFilter
    );
  };

  const handleClearFilters = () => {
    setTempSearchTerm('');
    setTempDateFilter('all');
    setTempCustomDateStart('');
    setTempCustomDateEnd('');
    setTempTypeFilter('');
    setTempPaymentFilter('');

    setSearchTerm('');
    setDateFilter('all');
    setCustomDateStart('');
    setCustomDateEnd('');
    setTypeFilter('');
    setPaymentFilter('');

    setFilteredTransactions(transactions);
  };

  const applyFiltersWithValues = (
    searchValue: string,
    dateValue: string,
    startDate: string,
    endDate: string,
    typeValue: string,
    paymentValue: string
  ) => {
    let filtered = [...transactions];

    if (searchValue) {
      const term = searchValue.toLowerCase();
      filtered = filtered.filter(t => 
        t.cliente.toLowerCase().includes(term) ||
        t.recibo.toLowerCase().includes(term) ||
        t.origen.toLowerCase().includes(term) ||
        t.lote.includes(term)
      );
    }

    if (dateValue !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      switch (dateValue) {
        case 'today':
          filtered = filtered.filter(t => new Date(t.createdAt) >= today);
          break;
        case 'yesterday': {
          const y = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          filtered = filtered.filter(t => {
            const d = new Date(t.createdAt);
            return d >= y && d < today;
          });
          break;
        }
        case 'week': {
          const start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(t => new Date(t.createdAt) >= start);
          break;
        }
        case 'month': {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(t => new Date(t.createdAt) >= start);
          break;
        }
        case 'custom': {
          if (startDate && endDate) {
            const s = new Date(startDate);
            const e = new Date(endDate + 'T23:59:59');
            filtered = filtered.filter(t => {
              const d = new Date(t.createdAt);
              return d >= s && d <= e;
            });
          }
          break;
        }
      }
    }

    if (typeValue) filtered = filtered.filter(t => t.tipo === typeValue);
    if (paymentValue) filtered = filtered.filter(t => t.metodo === paymentValue);

    setFilteredTransactions(filtered);
  };

  const exportTransactionsCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No hay transacciones filtradas para exportar');
      return;
    }

    const headers = [
      'Fecha', 
      'Hora', 
      'Tipo', 
      'Recibo', 
      'ID Retiro', 
      'Cliente', 
      'Lote', 
      'Origen', 
      'Total', 
      'Método', 
      'Notas/Detalle', 
      'Monto Efectivo', 
      'Monto Transferencia', 
      'Monto Expensa'
    ];
    
    const rows = filteredTransactions.map(transaction => {
      let efectivoAmount = 0, transferenciaAmount = 0, expensaAmount = 0;
      if (transaction.paymentBreakdown) {
        efectivoAmount = transaction.paymentBreakdown.efectivo || 0;
        transferenciaAmount = transaction.paymentBreakdown.transferencia || 0;
        expensaAmount = transaction.paymentBreakdown.expensa || 0;
      } else {
        if (transaction.metodo === 'efectivo') efectivoAmount = transaction.total;
        if (transaction.metodo === 'transferencia') transferenciaAmount = transaction.total;
        if (transaction.metodo === 'expensa') expensaAmount = transaction.total;
      }
      const paymentMethodText = transaction.metodo === 'combinado'
        ? ['efectivo','transferencia','expensa']
            .filter(k => ((transaction.paymentBreakdown as any)?.[k] || 0) !== 0)
            .map(k => k === 'efectivo' ? 'Efectivo' : k === 'transferencia' ? 'Transferencia' : 'Expensa')
            .join(' + ')
        : transaction.metodo;

      return [
        transaction.fecha,
        transaction.hora,
        getTypeLabel(transaction.tipo),
        transaction.recibo,
        transaction.withdrawalId || '-',
        transaction.cliente,
        transaction.lote || '-',
        transaction.origen,
        transaction.total,
        paymentMethodText,
        transaction.notes || '-',
        efectivoAmount,
        transferenciaAmount,
        expensaAmount
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacciones-filtradas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllTransactionsCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('No hay transacciones para exportar');
      return;
    }

    const headers = [
      'Fecha',
      'Hora', 
      'Tipo',
      'Recibo',
      'ID Retiro',
      'Cliente',
      'Lote',
      'Origen',
      'Item',
      'Cantidad',
      'Precio Unitario',
      'Subtotal Item',
      'Total Transacción',
      'Método',
      'Efectivo',
      'Transferencia', 
      'Expensa',
      'Notas'
    ];

    const rows: string[][] = [];
    
    filteredTransactions.forEach(transaction => {
      const base = [
        transaction.fecha,
        transaction.hora,
        getTypeLabel(transaction.tipo),
        transaction.recibo,
        transaction.withdrawalId || '-',
        transaction.cliente,
        transaction.lote || '-',
        transaction.origen
      ];

      const pmText = transaction.metodo === 'combinado'
        ? ['efectivo','transferencia','expensa']
            .filter(k => ((transaction.paymentBreakdown as any)?.[k] || 0) !== 0)
            .map(k => k === 'efectivo' ? 'Efectivo' : k === 'transferencia' ? 'Transferencia' : 'Expensa')
            .join(' + ')
        : transaction.metodo;

      let ef = 0, tr = 0, ex = 0;
      if (transaction.paymentBreakdown) {
        ef = transaction.paymentBreakdown.efectivo || 0;
        tr = transaction.paymentBreakdown.transferencia || 0;
        ex = transaction.paymentBreakdown.expensa || 0;
      } else {
        if (transaction.metodo === 'efectivo') ef = transaction.total;
        if (transaction.metodo === 'transferencia') tr = transaction.total;
        if (transaction.metodo === 'expensa') ex = transaction.total;
      }

      if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach((item, idx) => {
          const name = item.product?.name || item.service?.name || item.nombre || 'Item desconocido';
          const qty = item.quantity || item.cantidad || 1;
          const price = item.product?.price || item.service?.price || item.precio || 0;
          const sub = item.subtotal || (price * qty);
          const first = idx === 0;

          rows.push([
            ...base,
            name,
            String(qty),
            String(price),
            String(sub),
            first ? String(transaction.total) : '',
            first ? pmText : '',
            first ? String(ef) : '',
            first ? String(tr) : '',
            first ? String(ex) : '',
            first ? (transaction.notes || '') : ''
          ]);
        });
      } else {
        rows.push([
          ...base,
          'Sin items detallados',
          '1',
          String(transaction.total),
          String(transaction.total),
          String(transaction.total),
          pmText,
          String(ef),
          String(tr),
          String(ex),
          transaction.notes || ''
        ]);
      }
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transacciones-detalladas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const prepareTransactionForModal = (transaction: HistoricalTransaction): HistoricalTransaction => {
    const items = (transaction.items || []).map(item => ({
      id: item.id || `item-${Date.now()}-${Math.random()}`,
      nombre: item.product?.name || item.service?.name || item.nombre || 'Item desconocido',
      cantidad: item.quantity || item.cantidad || 1,
      precioUnitario: item.product?.price || item.service?.price || item.precio || 0,
      subtotal: item.subtotal || 0,
      descuento: item.descuento || 0,
      categoria: item.product?.category || item.service?.category || item.categoria || 'Sin categoría'
    }));
    return { ...transaction, items };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'kiosk': return <Package className="h-4 w-4 text-green-600" />;
      case 'court': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'retiro': return <Minus className="h-4 w-4 text-red-600" />;
      case 'gasto': return <Minus className="h-4 w-4 text-orange-600" />;
      case 'caja-inicial': return <Plus className="h-4 w-4 text-yellow-600" />;
      default: return <Receipt className="h-4 w-4 text-gray-600" />;
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'kiosk': return 'bg-green-100 text-green-800';
      case 'court': return 'bg-blue-100 text-blue-800';
      case 'retiro': return 'bg-red-100 text-red-800';
      case 'gasto': return 'bg-orange-100 text-orange-800';
      case 'caja-inicial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  // Totales de lo filtrado
  const totales = filteredTransactions.reduce((acc, t) => {
    acc.general += t.total;
    if (t.metodo === 'combinado' && t.paymentBreakdown) {
      acc.efectivo += t.paymentBreakdown.efectivo || 0;
      acc.transferencia += t.paymentBreakdown.transferencia || 0;
      acc.expensa += t.paymentBreakdown.expensa || 0;
    } else {
      if (t.metodo === 'efectivo') acc.efectivo += t.total;
      if (t.metodo === 'transferencia') acc.transferencia += t.total;
      if (t.metodo === 'expensa') acc.expensa += t.total;
    }
    return acc;
  }, { general: 0, efectivo: 0, transferencia: 0, expensa: 0 });

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Historial de Transacciones</h1>
          <p className="mt-2 text-sm text-gray-700">
            Registro completo de todas las transacciones del sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={exportAllTransactionsCSV}
            className="inline-flex items-center justify-center rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 shadow-sm hover:bg-green-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar por Items ({filteredTransactions.length})
          </button>
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total General</p>
              <p className="text-2xl font-bold text-gray-900">${totales.general.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-gray-900">${totales.efectivo.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transferencia</p>
              <p className="text-2xl font-bold text-gray-900">${totales.transferencia.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-gray-900">${totales.expensa.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={tempSearchTerm}
              onChange={(e) => setTempSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            value={tempDateFilter}
            onChange={(e) => setTempDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="custom">Personalizado</option>
          </select>

          <select
            value={tempTypeFilter}
            onChange={(e) => setTempTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los tipos</option>
            <option value="kiosk">Kiosco</option>
            <option value="court">Cancha</option>
            <option value="retiro">Retiro</option>
            <option value="gasto">Gasto</option>
            <option value="caja-inicial">Caja Inicial</option>
          </select>

          <select
            value={tempPaymentFilter}
            onChange={(e) => setTempPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="expensa">Expensa</option>
            <option value="combinado">Combinado</option>
          </select>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleApplyFilters}
              className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </button>
          </div>
        </div>

        {tempDateFilter === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                value={tempCustomDateStart}
                onChange={(e) => setTempCustomDateStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                value={tempCustomDateEnd}
                onChange={(e) => setTempCustomDateEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleClearFilters}
              className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              Limpiar Filtros
            </button>
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">{filteredTransactions.length} resultados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recibo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Retiro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas/Detalle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{t.fecha}</div>
                      <div className="text-gray-500">{t.hora}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(t.tipo)}`}>
                      {getTypeIcon(t.tipo)}
                      <span className="ml-1">{getTypeLabel(t.tipo)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.recibo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {t.withdrawalId
                      ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">{t.withdrawalId}</span>
                      : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      {t.cliente}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      {t.lote}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.origen}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className={t.total < 0 ? 'text-red-600' : 'text-green-600'}>${t.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {getPaymentIcon(t.metodo)}
                      <span className="ml-2 capitalize">
                        {t.metodo === 'combinado'
                          ? ['efectivo','transferencia','expensa']
                              .filter(k => ((t.paymentBreakdown as any)?.[k] || 0) !== 0)
                              .map(k => k === 'efectivo' ? 'Efectivo' : k === 'transferencia' ? 'Transferencia' : 'Expensa')
                              .join(' + ')
                          : t.metodo}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    {t.notes ? <div className="truncate" title={t.notes}>{t.notes}</div> : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => { setSelectedTransaction(prepareTransactionForModal(t)); setShowTransactionDetail(true); }}
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

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron transacciones</p>
          </div>
        )}
      </div>

      <TransactionDetailModal
        isOpen={showTransactionDetail}
        onClose={() => setShowTransactionDetail(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default Transactions;
