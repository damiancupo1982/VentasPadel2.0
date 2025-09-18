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
  Eye
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { updateAdminTurn, addExpenseTransaction } from '../utils/db';
import TransactionDetailModal from '../components/TransactionDetailModal';
import SupervisorLogin from '../components/SupervisorLogin'; // ⬅️ BOTÓN SUPERVISOR

const DELETED_KEY = 'villanueva-deleted-transaction-ids';

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
  __rawItems?: any[];
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
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TurnTransaction | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  const [withdrawalNotes, setWithdrawalNotes] = useState('');

  useEffect(() => { refreshData(); }, []);
  useEffect(() => { activeTurn ? loadTurnTransactions() : setTurnTransactions([]); }, [activeTurn, sales, courtBills]);
  useEffect(() => { applyFilters(); }, [turnTransactions, searchTerm, dateFilter, paymentFilter]);

  const getDeletedIds = () => {
    try { return new Set<string>(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]')); }
    catch { return new Set<string>(); }
  };

  const loadTurnTransactions = () => {
    if (!activeTurn) return;
    const deleted = getDeletedIds();
    const turnStart = new Date(activeTurn.startDate);
    const transactions: TurnTransaction[] = [];

    const turnSales = sales.filter(s => new Date(s.createdAt) >= turnStart);
    turnSales.forEach(sale => {
      if (deleted.has(sale.id)) return;
      const d = new Date(sale.createdAt);
      transactions.push({
        id: sale.id,
        fecha: d.toLocaleDateString('es-ES'),
        hora: d.toLocaleTimeString('es-ES'),
        tipo: sale.total < 0 ? 'retiro' : sale.customerName?.includes('Caja Inicial') ? 'caja-inicial' : 'kiosk',
        recibo: sale.receiptNumber,
        cliente: sale.customerName || 'Cliente general',
        lote: sale.lotNumber || '0',
        origen: sale.total < 0 ? 'Retiro de Caja' : sale.customerName?.includes('Caja Inicial') ? 'Caja Inicial' : sale.courtId || 'Kiosco',
        total: sale.total,
        metodo: sale.paymentMethod,
        items: sale.items,
        __rawItems: sale.items,
        paymentBreakdown: sale.paymentBreakdown,
        createdAt: sale.createdAt
      });
    });

    const turnCourtBills = courtBills.filter(b => new Date(b.createdAt) >= turnStart);
    turnCourtBills.forEach(bill => {
      if (deleted.has(bill.id)) return;
      const d = new Date(bill.createdAt);
      const raw = [...(bill.kioskItems || []), ...(bill.services || [])];
      transactions.push({
        id: bill.id,
        fecha: d.toLocaleDateString('es-ES'),
        hora: d.toLocaleTimeString('es-ES'),
        tipo: 'court',
        recibo: bill.receiptNumber,
        cliente: bill.customerName,
        lote: bill.lotNumber || '0',
        origen: bill.courtName,
        total: bill.total,
        metodo: bill.paymentMethod,
        items: raw,
        __rawItems: raw,
        paymentBreakdown: bill.paymentBreakdown,
        createdAt: bill.createdAt
      });
    });

    if (activeTurn.transactions) {
      activeTurn.transactions.forEach(w => {
        if (deleted.has(w.id)) return;
        const d = new Date(w.createdAt);
        transactions.push({
          id: w.id,
          fecha: d.toLocaleDateString('es-ES'),
          hora: d.toLocaleTimeString('es-ES'),
          tipo: 'retiro',
          recibo: w.receiptNumber,
          withdrawalId: w.withdrawalId,
          cliente: `Retiro - ${w.adminName}`,
          lote: '0',
          origen: 'Retiro de Caja',
          total: -w.amount,
          metodo: 'efectivo',
          items: [],
          __rawItems: [],
          adminName: w.adminName,
          notes: w.notes,
          createdAt: w.createdAt
        });
      });
    }

    if (activeTurn.expenses) {
      activeTurn.expenses.forEach(exp => {
        if (deleted.has(exp.id)) return;
        const d = new Date(exp.createdAt);
        transactions.push({
          id: exp.id,
          fecha: d.toLocaleDateString('es-ES'),
          hora: d.toLocaleTimeString('es-ES'),
          tipo: 'gasto',
          recibo: exp.receiptNumber,
          cliente: `Gasto - ${exp.adminName}`,
          lote: '0',
          origen: exp.concept,
          total: -exp.amount,
          metodo: 'efectivo',
          items: [],
          __rawItems: [],
          adminName: exp.adminName,
          notes: exp.detail,
          createdAt: exp.createdAt
        });
      });
    }

    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setTurnTransactions(transactions);
  };

  const applyFilters = () => {
    let filtered = [...turnTransactions];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(tr =>
        tr.cliente.toLowerCase().includes(t) ||
        tr.recibo.toLowerCase().includes(t) ||
        tr.origen.toLowerCase().includes(t) ||
        tr.lote.includes(t)
      );
    }
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (dateFilter === 'today') filtered = filtered.filter(tr => new Date(tr.createdAt) >= today);
      if (dateFilter === 'yesterday') {
        const y = new Date(today.getTime() - 86400000);
        filtered = filtered.filter(tr => {
          const d = new Date(tr.createdAt);
          return d >= y && d < today;
        });
      }
    }
    if (paymentFilter) filtered = filtered.filter(t => t.metodo === paymentFilter);
    setFilteredTransactions(filtered);
  };

  const realTotals = turnTransactions.reduce((tot, t) => {
    tot.general += t.total;
    if (t.metodo === 'combinado' && t.paymentBreakdown) {
      tot.efectivo += t.paymentBreakdown.efectivo || 0;
      tot.transferencia += t.paymentBreakdown.transferencia || 0;
      tot.expensa += t.paymentBreakdown.expensa || 0;
    } else {
      if (t.metodo === 'efectivo') tot.efectivo += t.total;
      if (t.metodo === 'transferencia') tot.transferencia += t.total;
      if (t.metodo === 'expensa') tot.expensa += t.total;
    }
    return tot;
  }, { general: 0, efectivo: 0, transferencia: 0, expensa: 0 });

  const handleWithdrawal = async () => {
    if (!activeTurn || withdrawalAmount <= 0) return;
    if (withdrawalAmount > realTotals.efectivo) { alert(`Efectivo disponible: $${realTotals.efectivo}`); return; }
    try {
      const w = await addExpenseTransaction({
        type: 'retiro', amount: withdrawalAmount, adminName: activeTurn.adminName,
        notes: withdrawalNotes, paymentMethod: 'efectivo'
      });
      const updatedTurn = await updateAdminTurn(activeTurn.id, {
        transactions: [...(activeTurn.transactions || []), w],
        totals: {
          efectivo: activeTurn.totals.efectivo - withdrawalAmount,
          transferencia: activeTurn.totals.transferencia,
          expensa: activeTurn.totals.expensa,
          total: activeTurn.totals.total - withdrawalAmount
        }
      });
      if (updatedTurn) setActiveTurn(updatedTurn);
      setWithdrawalAmount(0); setWithdrawalNotes(''); setShowWithdrawalModal(false);
      await refreshData();
    } catch (e) { console.error(e); }
  };

  const exportTransactionsCSV = () => {
    if (filteredTransactions.length === 0) { alert('No hay transacciones para exportar'); return; }
    const headers = [
      'Fecha','Hora','Tipo','Recibo','Cliente','Lote','Origen',
      'Item','Cantidad','Precio Unitario','Subtotal Item',
      'Total Transacción','Método','Efectivo','Transferencia','Expensa','Notas'
    ];
    const rows: string[][] = [];
    filteredTransactions.forEach(t => {
      const base = [t.fecha,t.hora,getTypeLabel(t.tipo),t.recibo,t.cliente,t.lote,t.origen];
      const pmText = t.metodo === 'combinado'
        ? ['efectivo','transferencia','expensa'].filter(k => (t.paymentBreakdown as any)?.[k] > 0)
            .map(m => ({efectivo:'Efectivo',transferencia:'Transferencia',expensa:'Expensa'} as any)[m]).join(' + ')
        : t.metodo;
      let ef=0,tr=0,ex=0;
      if (t.paymentBreakdown) { ef=t.paymentBreakdown.efectivo||0; tr=t.paymentBreakdown.transferencia||0; ex=t.paymentBreakdown.expensa||0; }
      else { if (t.metodo==='efectivo') ef=t.total; if (t.metodo==='transferencia') tr=t.total; if (t.metodo==='expensa') ex=t.total; }
      if (t.items && t.items.length>0) {
        t.items.forEach((item:any, idx:number) => {
          const name = item.product?.name||item.service?.name||item.nombre||'Item desconocido';
          const qty = item.quantity||item.cantidad||1;
          const price = item.product?.price||item.service?.price||item.precio||0;
          const sub = item.subtotal || (price*qty);
          const first = idx===0;
          rows.push([...base,name,String(qty),String(price),String(sub),
            first?String(t.total):'', first?pmText:'', first?String(ef):'', first?String(tr):'', first?String(ex):'', first?(t.notes||''):''
          ]);
        });
      } else {
        rows.push([...base,'Sin items detallados','1',String(t.total),String(t.total),String(t.total),pmText,String(ef),String(tr),String(ex),t.notes||'']);
      }
    });
    const csv = [headers,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `arqueo-caja-${new Date().toISOString().split('T')[0]}.csv`; link.click();
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
      case 'combinado': return <div className="flex space-x-1">
        <Banknote className="h-3 w-3 text-green-600" />
        <CreditCard className="h-3 w-3 text-blue-600" />
        <FileText className="h-3 w-3 text-purple-600" />
      </div>;
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay turno activo</h2>
            <p className="text-gray-600 mb-6">No se puede realizar el arqueo de caja porque no hay un turno administrativo activo.</p>
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
          <p className="mt-2 text-sm text-gray-700">Control de ingresos y gestión de turnos administrativos</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex flex-wrap gap-2">
          <SupervisorLogin /> {/* ⬅️ AQUÍ APARECE EL BOTÓN */}
          <button onClick={exportTransactionsCSV}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </button>
          <button onClick={() => setShowWithdrawalModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 shadow-sm hover:bg-orange-100">
            <Minus className="h-4 w-4 mr-2" /> Retiro de Dinero
          </button>
          <button onClick={() => window.print()}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            Imprimir
          </button>
        </div>
      </div>

      {/* Tarjetas de totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total General</p>
              <p className="text-2xl font-bold text-gray-900">${realTotals.general.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-400">
          <div className="flex items-center">
            <Banknote className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Efectivo</p>
              <p className="text-2xl font-bold text-gray-900">${realTotals.efectivo.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transferencia</p>
              <p className="text-2xl font-bold text-gray-900">${realTotals.transferencia.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600" />
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
            <input type="text" placeholder="Buscar cliente o cancha..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <select value={dateFilter} onChange={(e)=>setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
          </select>
          <select value={paymentFilter} onChange={(e)=>setPaymentFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
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

      {/* Tabla */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
              {filteredTransactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div><div className="font-medium">{t.fecha}</div><div className="text-gray-500">{t.hora}</div></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(t.tipo)}`}>
                      {getTypeIcon(t.tipo)} <span className="ml-1">{getTypeLabel(t.tipo)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.recibo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center"><User className="h-4 w-4 text-gray-400 mr-2" />{t.cliente}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.origen}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">{t.notes || <span className="text-gray-400">-</span>}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={t.total<0 ? 'text-red-600' : 'text-green-600'}>${t.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      {getPaymentIcon(t.metodo)}
                      <span className="ml-2 capitalize">
                        {t.metodo==='combinado'
                          ? ['efectivo','transferencia','expensa'].filter(k => (t.paymentBreakdown as any)?.[k] > 0)
                            .map(m => ({efectivo:'Efectivo',transferencia:'Transferencia',expensa:'Expensa'} as any)[m]).join(' + ')
                          : t.metodo}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button onClick={() => { setSelectedTransaction({
                      ...t,
                      items: (t.items||[]).map((it:any)=>({
                        id: it.id || `item-${Date.now()}-${Math.random()}`,
                        nombre: it.product?.name||it.service?.name||it.nombre||'Item desconocido',
                        cantidad: it.quantity||it.cantidad||1,
                        precioUnitario: it.product?.price||it.service?.price||it.precio||0,
                        subtotal: it.subtotal||0,
                        descuento: it.descuento||0,
                        categoria: it.product?.category||it.service?.category||it.categoria||'Sin categoría'
                      })),
                      __rawItems: Array.isArray((t as any).__rawItems) ? (t as any).__rawItems : (t.items||[])
                    } as any); setShowTransactionDetail(true); }}
                      className="text-indigo-600 hover:text-indigo-900 flex items-center" title="Ver detalle completo">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (<div className="text-center py-12"><p className="text-gray-500">No hay transacciones en el turno actual</p></div>)}
      </div>

      {/* Modal Retiro */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowWithdrawalModal(false)} />
          <div className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center"><Minus className="h-5 w-5 text-red-600 mr-2" />Retiro de Dinero</h2>
              <button onClick={() => setShowWithdrawalModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center"><AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm font-medium text-yellow-800">Efectivo disponible: ${realTotals.efectivo.toFixed(2)}</p>
                </div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monto a retirar</label>
              <input type="number" value={withdrawalAmount} onChange={e=>setWithdrawalAmount(parseFloat(e.target.value)||0)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="0.00" />
              <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Motivo del retiro</label>
              <textarea value={withdrawalNotes} onChange={e=>setWithdrawalNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" rows={3} />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={()=>setShowWithdrawalModal(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                <button onClick={handleWithdrawal} disabled={withdrawalAmount<=0||withdrawalAmount>realTotals.efectivo}
                        className="px-4 py-2 bg-red-600 text-white rounded-md disabled:opacity-50">Confirmar Retiro</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TransactionDetailModal isOpen={showTransactionDetail} onClose={()=>setShowTransactionDetail(false)} transaction={selectedTransaction as any}/>
    </div>
  );
};

export default CashRegister;
