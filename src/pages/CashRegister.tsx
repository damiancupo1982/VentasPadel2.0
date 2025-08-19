import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Download, 
  Search, 
  Minus, 
  X, 
  AlertTriangle, 
  User, 
  Clock, 
  Receipt,
  Banknote,
  CreditCard,
  FileText,
  Package,
  Calendar,
  Plus,
  Eye,
  Printer
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { updateAdminTurn, addExpenseTransaction } from '../utils/db';
import TransactionDetailModal from '../components/TransactionDetailModal';

interface TurnTransaction {
  id: string;
  fecha: string;
  hora: string;
  tipo: 'kiosk' | 'court' | 'retiro' | 'gasto' | 'caja-inicial';
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

const CashRegister: React.FC = () => {
  const { sales, courtBills, activeTurn, setActiveTurn, refreshData } = useStore();
  const [turnTransactions, setTurnTransactions] = useState<TurnTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TurnTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TurnTransaction | null>(null);
  
  // Estados para retiro
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  
  // Estados para gasto
  const [expenseConcept, setExpenseConcept] = useState('');
  const [expenseDetail, setExpenseDetail] = useState('');
  const [expenseAmount, setExpenseAmount] = useState(0);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (activeTurn) {
      loadTurnTransactions();
    } else {
      setTurnTransactions([]);
    }
  }, [activeTurn, sales, courtBills]);

  useEffect(() => {
    applyFilters();
  }, [turnTransactions, searchTerm, dateFilter, paymentFilter]);

  const loadTurnTransactions = () => {
    if (!activeTurn) return;

    const turnStart = new Date(activeTurn.startDate);
    const transactions: TurnTransaction[] = [];

    // Cargar ventas del kiosco del turno actual
    const turnSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= turnStart;
    });

    turnSales.forEach(sale => {
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
        total: sale.total,
        metodo: sale.paymentMethod,
        items: sale.items,
        paymentBreakdown: sale.paymentBreakdown,
        createdAt: sale.createdAt
      };
      transactions.push(transaction);
    });

    // Cargar facturas de canchas del turno actual
    const turnCourtBills = courtBills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      return billDate >= turnStart;
    });

    turnCourtBills.forEach(bill => {
      const billDate = new Date(bill.createdAt);
      const transaction: TurnTransaction = {
        id: bill.id,
        fecha: billDate.toLocaleDateString('es-ES'),
        hora: billDate.toLocaleTimeString('es-ES'),
        tipo: 'court',
        recibo: bill.receiptNumber,
        cliente: bill.customerName,
        lote: bill.lotNumber || '0',
        origen: bill.courtName,
        total: bill.total,
        metodo: bill.paymentMethod,
        items: [...(bill.kioskItems || []), ...(bill.services || [])],
        paymentBreakdown: bill.paymentBreakdown,
        createdAt: bill.createdAt
      };
      transactions.push(transaction);
    });

    // Cargar retiros del turno
    if (activeTurn.transactions) {
      activeTurn.transactions.forEach(withdrawal => {
        const withdrawalDate = new Date(withdrawal.createdAt);
        const transaction: TurnTransaction = {
          id: withdrawal.id,
          fecha: withdrawalDate.toLocaleDateString('es-ES'),
          hora: withdrawalDate.toLocaleTimeString('es-ES'),
          tipo: 'retiro',
          recibo: withdrawal.receiptNumber,
          withdrawalId: withdrawal.withdrawalId,
          cliente: `Retiro - ${withdrawal.adminName}`,
          lote: '0',
          origen: 'Retiro de Caja',
          total: -withdrawal.amount,
          metodo: 'efectivo',
          items: [],
          adminName: withdrawal.adminName,
          notes: withdrawal.notes,
          createdAt: withdrawal.createdAt
        };
        transactions.push(transaction);
      });
    }

    // Cargar gastos del turno
    if (activeTurn.expenses) {
      activeTurn.expenses.forEach(expense => {
        const expenseDate = new Date(expense.createdAt);
        const transaction: TurnTransaction = {
          id: expense.id,
          fecha: expenseDate.toLocaleDateString('es-ES'),
          hora: expenseDate.toLocaleTimeString('es-ES'),
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
        };
        transactions.push(transaction);
      });
    }

    // Ordenar por fecha descendente
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setTurnTransactions(transactions);
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

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(t => {
            const transactionDate = new Date(t.createdAt);
            return transactionDate >= today;
          });
          break;
        case 'yesterday':
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          filtered = filtered.filter(t => {
            const transactionDate = new Date(t.createdAt);
            return transactionDate >= yesterday && transactionDate < today;
          });
          break;
      }
    }

    if (paymentFilter) {
      filtered = filtered.filter(t => t.metodo === paymentFilter);
    }

    setFilteredTransactions(filtered);
  };

  // Calcular totales reales basados en las transacciones cargadas
  const calculateRealTotals = () => {
    return turnTransactions.reduce((totals, transaction) => {
      totals.general += transaction.total;
      
      if (transaction.metodo === 'combinado' && transaction.paymentBreakdown) {
        totals.efectivo += transaction.paymentBreakdown.efectivo || 0;
        totals.transferencia += transaction.paymentBreakdown.transferencia || 0;
        totals.expensa += transaction.paymentBreakdown.expensa || 0;
      } else {
        if (transaction.metodo === 'efectivo') {
          totals.efectivo += transaction.total;
        } else if (transaction.metodo === 'transferencia') {
          totals.transferencia += transaction.total;
        } else if (transaction.metodo === 'expensa') {
          totals.expensa += transaction.total;
        }
      }
      
      return totals;
    }, { general: 0, efectivo: 0, transferencia: 0, expensa: 0 });
  };

  const realTotals = calculateRealTotals();

  const handleWithdrawal = async () => {
    if (!activeTurn || withdrawalAmount <= 0) return;
    
    if (withdrawalAmount > realTotals.efectivo) {
      alert(`No hay suficiente efectivo en caja. Disponible: $${realTotals.efectivo}`);
      return;
    }

    try {
      const withdrawal = await addExpenseTransaction({
        type: 'retiro',
        amount: withdrawalAmount,
        adminName: activeTurn.adminName,
        notes: withdrawalNotes,
        paymentMethod: 'efectivo'
      });

      const updatedTransactions = [...(activeTurn.transactions || []), withdrawal];
      const newTotals = {
        efectivo: activeTurn.totals.efectivo - withdrawalAmount,
        transferencia: activeTurn.totals.transferencia,
        expensa: activeTurn.totals.expensa,
        total: activeTurn.totals.total - withdrawalAmount
      };

      const updatedTurn = await updateAdminTurn(activeTurn.id, {
        transactions: updatedTransactions,
        totals: newTotals
      });

      if (updatedTurn) {
        setActiveTurn(updatedTurn);
      }

      setWithdrawalAmount(0);
      setWithdrawalNotes('');
      setShowWithdrawalModal(false);
      await refreshData();
    } catch (error) {
      console.error('Error al procesar retiro:', error);
    }
  };

  const handleExpense = async () => {
    if (!activeTurn || expenseAmount <= 0 || !expenseConcept.trim()) return;
    
    if (expenseAmount > realTotals.efectivo) {
      alert(`No hay suficiente efectivo en caja. Disponible: $${realTotals.efectivo}`);
      return;
    }

    try {
      const expense = await addExpenseTransaction({
        type: 'gasto',
        concept: expenseConcept.trim(),
        detail: expenseDetail.trim(),
        amount: expenseAmount,
        adminName: activeTurn.adminName,
        paymentMethod: 'efectivo'
      });

      const updatedExpenses = [...(activeTurn.expenses || []), expense];
      const newTotals = {
        efectivo: activeTurn.totals.efectivo - expenseAmount,
        transferencia: activeTurn.totals.transferencia,
        expensa: activeTurn.totals.expensa,
        total: activeTurn.totals.total - expenseAmount
      };

      const updatedTurn = await updateAdminTurn(activeTurn.id, {
        expenses: updatedExpenses,
        totals: newTotals
      });

      if (updatedTurn) {
        setActiveTurn(updatedTurn);
      }

      setExpenseConcept('');
      setExpenseDetail('');
      setExpenseAmount(0);
      setShowExpenseModal(false);
      await refreshData();
    } catch (error) {
      console.error('Error al procesar gasto:', error);
    }
  };

  const handleCloseTurn = async () => {
    if (!activeTurn) return;
    
    if (!window.confirm('¿Está seguro de que desea cerrar el turno? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const updatedTurn = await updateAdminTurn(activeTurn.id, {
        status: 'closed',
        endDate: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        totals: realTotals // Usar los totales reales calculados
      });

      if (updatedTurn) {
        setActiveTurn(null);
        alert('Turno cerrado exitosamente');
      }
      
      await refreshData();
    } catch (error) {
      console.error('Error al cerrar turno:', error);
      alert('Error al cerrar el turno');
    }
  };

  const exportTransactionsCSV = () => {
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
      const baseTransactionData = [
        transaction.fecha,
        transaction.hora,
        getTypeLabel(transaction.tipo),
        transaction.recibo,
        transaction.cliente,
        transaction.lote,
        transaction.origen
      ];
      
      const paymentMethodText = transaction.metodo === 'combinado' ? 
        (() => {
          const methods: string[] = [];
          if (transaction.paymentBreakdown?.efectivo > 0) methods.push('Efectivo');
          if (transaction.paymentBreakdown?.transferencia > 0) methods.push('Transferencia');
          if (transaction.paymentBreakdown?.expensa > 0) methods.push('Expensa');
          return methods.join(' + ');
        })()
        : transaction.metodo;
      
      const efectivoAmount = transaction.paymentBreakdown?.efectivo || (transaction.metodo === 'efectivo' ? transaction.total : 0);
      const transferenciaAmount = transaction.paymentBreakdown?.transferencia || (transaction.metodo === 'transferencia' ? transaction.total : 0);
      const expensaAmount = transaction.paymentBreakdown?.expensa || (transaction.metodo === 'expensa' ? transaction.total : 0);
      
      // Si la transacción tiene items, crear un renglón por cada item
      if (transaction.items && transaction.items.length > 0) {
        transaction.items.forEach((item, itemIndex) => {
          const itemName = item.product?.name || item.service?.name || item.nombre || 'Item desconocido';
          const itemQuantity = item.quantity || item.cantidad || 1;
          const itemPrice = item.product?.price || item.service?.price || item.precio || 0;
          const itemSubtotal = item.subtotal || (itemPrice * itemQuantity);
          
          // Solo en el primer item de cada transacción incluir totales y métodos de pago
          // En los demás items dejar esas columnas vacías
          const isFirstItem = itemIndex === 0;
          
          rows.push([
            ...baseTransactionData,
            itemName,
            itemQuantity.toString(),
            itemPrice.toString(),
            itemSubtotal.toString(),
            isFirstItem ? transaction.total.toString() : '', // Total solo en primer item
            isFirstItem ? paymentMethodText : '', // Método solo en primer item
            isFirstItem ? efectivoAmount.toString() : '', // Efectivo solo en primer item
            isFirstItem ? transferenciaAmount.toString() : '', // Transferencia solo en primer item
            isFirstItem ? expensaAmount.toString() : '', // Expensa solo en primer item
            isFirstItem ? (transaction.notes || '') : '' // Notas solo en primer item
          ]);
        });
      } else {
        // Si no tiene items, crear un renglón con la transacción completa
        rows.push([
          ...baseTransactionData,
          'Sin items detallados', // Item
          '1', // Cantidad
          transaction.total.toString(), // Precio unitario = total
          transaction.total.toString(), // Subtotal = total
          transaction.total.toString(), // Total transacción
          paymentMethodText, // Método
          efectivoAmount.toString(), // Efectivo
          transferenciaAmount.toString(), // Transferencia
          expensaAmount.toString(), // Expensa
          transaction.notes || '' // Notas
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
    link.setAttribute('download', `arqueo-caja-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printTurnSummary = () => {
    if (!activeTurn) return;

    const printContent = `
      <html>
        <head>
          <title>Arqueo de Caja - ${activeTurn.adminName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
            .totals { border: 2px solid #000; padding: 15px; margin: 20px 0; }
            .total-row { display: flex; justify-content: space-between; margin: 8px 0; font-weight: bold; font-size: 16px; }
            .transactions { margin: 15px 0; }
            .transaction { display: flex; justify-content: space-between; margin: 3px 0; font-size: 12px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VILLANUEVA PÁDEL</h1>
            <h2>ARQUEO DE CAJA</h2>
          </div>
          
          <div class="info-row">
            <span><strong>Administrativo:</strong></span>
            <span>${activeTurn.adminName}</span>
          </div>
          
          <div class="info-row">
            <span><strong>Inicio del Turno:</strong></span>
            <span>${new Date(activeTurn.startDate).toLocaleString('es-ES')}</span>
          </div>
          
          <div class="info-row">
            <span><strong>Fecha de Arqueo:</strong></span>
            <span>${new Date().toLocaleString('es-ES')}</span>
          </div>
          
          <div class="totals">
            <h3 style="text-align: center; margin-bottom: 15px;">TOTALES DEL TURNO</h3>
            <div class="total-row">
              <span>💵 EFECTIVO:</span>
              <span>$${realTotals.efectivo.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>💳 TRANSFERENCIA:</span>
              <span>$${realTotals.transferencia.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>📄 EXPENSA:</span>
              <span>$${realTotals.expensa.toFixed(2)}</span>
            </div>
            <div class="total-row" style="border-top: 2px solid #000; padding-top: 10px; font-size: 18px;">
              <span>💰 TOTAL GENERAL:</span>
              <span>$${realTotals.general.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="transactions">
            <h3>Detalle de Transacciones (${filteredTransactions.length}):</h3>
            ${filteredTransactions.map(t => `
              <div class="transaction">
                <span>${t.fecha} ${t.hora}</span>
                <span>${getTypeLabel(t.tipo)}</span>
                <span>${t.cliente}</span>
                <span>${t.origen}</span>
                <span>$${t.total.toFixed(2)}</span>
                <span>${t.metodo}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Sistema de Gestión - Villanueva Pádel</p>
            <p>Arqueo generado automáticamente</p>
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

  const prepareTransactionForModal = (transaction: TurnTransaction) => {
    const items = (transaction.items || []).map(item => ({
      id: item.id || `item-${Date.now()}-${Math.random()}`,
      nombre: item.product?.name || item.service?.name || item.nombre || 'Item desconocido',
      cantidad: item.quantity || item.cantidad || 1,
      precioUnitario: item.product?.price || item.service?.price || item.precio || 0,
      subtotal: item.subtotal || 0,
      descuento: item.descuento || 0,
      categoria: item.product?.category || item.service?.category || item.categoria || 'Sin categoría'
    }));

    return {
      ...transaction,
      items
    };
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
              No se puede realizar el arqueo de caja porque no hay un turno administrativo activo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Arqueo de Caja</h1>
          <p className="mt-2 text-sm text-gray-700">
            Control de ingresos y gestión de turnos administrativos
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <button
            onClick={exportTransactionsCSV}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 shadow-sm hover:bg-orange-100"
          >
            <Minus className="h-4 w-4 mr-2" />
            Retiro de Dinero
          </button>
          <button
            onClick={handleCloseTurn}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
          >
            <X className="h-4 w-4 mr-2" />
            Cerrar Turno
          </button>
        </div>
      </div>

      {/* Información del turno activo */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
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
          <div className="text-right">
            <p className="text-sm font-medium text-green-800">Transacciones</p>
            <p className="text-xl font-bold text-green-900">{turnTransactions.length}</p>
          </div>
        </div>
      </div>

      {/* Totales por método de pago - USANDO TOTALES REALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total General</p>
              <p className="text-2xl font-bold text-gray-900">${realTotals.general.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-gray-900">${realTotals.efectivo.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-gray-900">${realTotals.transferencia.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-gray-900">${realTotals.expensa.toFixed(2)}</p>
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
              placeholder="Buscar cliente o cancha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="expensa">Expensa</option>
            <option value="combinado">Combinado</option>
          </select>

          <div className="flex items-center justify-center">
            <Receipt className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">{filteredTransactions.length} resultados</span>
          </div>
        </div>
      </div>

      {/* Tabla de transacciones del turno */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Transacciones del Turno ({filteredTransactions.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recibo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle/Notas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{transaction.fecha}</div>
                      <div className="text-gray-500">{transaction.hora}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(transaction.tipo)}`}>
                      {getTypeIcon(transaction.tipo)}
                      <span className="ml-1">{getTypeLabel(transaction.tipo)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {transaction.recibo}
                    {transaction.withdrawalId && (
                      <div className="text-xs text-red-600 font-mono">{transaction.withdrawalId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div>{transaction.cliente}</div>
                        {transaction.lote !== '0' && (
                          <div className="text-xs text-gray-500">Lote: {transaction.lote}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.origen}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    {transaction.notes ? (
                      <div className="truncate" title={transaction.notes}>
                        {transaction.notes}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={transaction.total < 0 ? 'text-red-600' : 'text-green-600'}>
                      ${transaction.total.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {getPaymentIcon(transaction.metodo)}
                      <span className="ml-2 capitalize">
                        {transaction.metodo === 'combinado' ? 
                          (() => {
                            const methods: string[] = [];
                            if (transaction.paymentBreakdown?.efectivo > 0) methods.push('Efectivo');
                            if (transaction.paymentBreakdown?.transferencia > 0) methods.push('Transferencia');
                            if (transaction.paymentBreakdown?.expensa > 0) methods.push('Expensa');
                            return methods.join(' + ');
                          })()
                          : transaction.metodo
                        }
                      </span>
                    </div>
                    {transaction.paymentBreakdown && (
                      <div className="text-xs text-gray-500 mt-1">
                        {transaction.paymentBreakdown.efectivo > 0 && <div>💵 ${transaction.paymentBreakdown.efectivo}</div>}
                        {transaction.paymentBreakdown.transferencia > 0 && <div>💳 ${transaction.paymentBreakdown.transferencia}</div>}
                        {transaction.paymentBreakdown.expensa > 0 && <div>📄 ${transaction.paymentBreakdown.expensa}</div>}
                      </div>
                    )}
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
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay transacciones en el turno actual</p>
          </div>
        )}
      </div>

      {/* Modal de retiro de dinero */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowWithdrawalModal(false)} />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Minus className="h-5 w-5 mr-2 text-red-600" />
                Retiro de Dinero
              </h2>
              <button
                onClick={() => setShowWithdrawalModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Efectivo disponible: ${realTotals.efectivo.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a retirar
                </label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="0.00"
                  min="0"
                  max={realTotals.efectivo}
                  step="0.01"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del retiro
                </label>
                <textarea
                  value={withdrawalNotes}
                  onChange={(e) => setWithdrawalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Describe el motivo del retiro..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleWithdrawal}
                  disabled={withdrawalAmount <= 0 || withdrawalAmount > realTotals.efectivo}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Confirmar Retiro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle de transacción */}
      <TransactionDetailModal
        isOpen={showTransactionDetail}
        onClose={() => setShowTransactionDetail(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default CashRegister;