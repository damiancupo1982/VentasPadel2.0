import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getProducts } from '../utils/db';

// IDs de transacciones eliminadas
const DELETED_KEY = 'villanueva-deleted-transaction-ids';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transaction: any | null; // tolera kiosk/court/retiro/gasto
}

const TransactionDetailModal: React.FC<Props> = ({ isOpen, onClose, transaction }) => {
  const { isSupervisor, setProducts, products, refreshData } = useStore();

  if (!isOpen || !transaction) return null;

  const addDeletedId = (id: string) => {
    const list: string[] = JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
    if (!list.includes(id)) {
      list.push(id);
      localStorage.setItem(DELETED_KEY, JSON.stringify(list));
    }
  };

  // Ítems crudos (con product.id) para reponer stock
  const getRawItems = () => {
    return (transaction as any).__rawItems || transaction.items || [];
  };

  const rollbackStockIfNeeded = async () => {
    const tipo = transaction.tipo || transaction.type;
    if (tipo !== 'kiosk' && tipo !== 'court') return; // solo ventas con productos

    const rawItems = getRawItems();
    if (!rawItems || rawItems.length === 0) return;

    let currentProducts = products;
    if (!currentProducts || currentProducts.length === 0) {
      try { currentProducts = await getProducts(); } catch {}
    }

    const updated = [...currentProducts];
    rawItems.forEach((it: any) => {
      const pid = it.product?.id || it.productId;
      const qty = Number(it.quantity ?? it.cantidad ?? 0);
      if (!pid || !qty) return;
      const idx = updated.findIndex(p => p.id === pid);
      if (idx >= 0) {
        const prev = updated[idx];
        updated[idx] = {
          ...prev,
          stock: (Number(prev.stock) || 0) + qty,
          updatedAt: new Date().toISOString(),
        };
      }
    });

    setProducts(updated);
  };

  const deleteAndRollback = async () => {
    if (!isSupervisor) {
      alert('Solo un Supervisor puede eliminar transacciones.');
      return;
    }
    if (!window.confirm('¿Eliminar la transacción y revertir stock/caja? Esta acción es permanente.')) {
      return;
    }

    try {
      addDeletedId(transaction.id);           // 1) marcar eliminada
      await rollbackStockIfNeeded();         // 2) reponer stock si corresponde
      await refreshData();                   // 3) recalcular caja/listados
      alert('Transacción eliminada correctamente.');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al eliminar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute top-1/2 left-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Detalle de Transacción</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500">Tipo:</span> <b>{transaction.tipo}</b></div>
            <div><span className="text-gray-500">Recibo:</span> <b>{transaction.recibo}</b></div>
            <div><span className="text-gray-500">Fecha:</span> <b>{transaction.fecha} {transaction.hora}</b></div>
            <div><span className="text-gray-500">Cliente:</span> <b>{transaction.cliente || '-'}</b></div>
            <div><span className="text-gray-500">Origen:</span> <b>{transaction.origen}</b></div>
            <div><span className="text-gray-500">Método:</span> <b>{transaction.metodo}</b></div>
            <div><span className="text-gray-500">Total:</span> <b>${Number(transaction.total || 0).toFixed(2)}</b></div>
            {transaction.notes && <div className="col-span-2"><span className="text-gray-500">Notas:</span> <b>{transaction.notes}</b></div>}
          </div>

          {Array.isArray(transaction.items) && transaction.items.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold mb-2">Ítems</p>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Nombre</th>
                      <th className="px-3 py-2 text-right">Cant.</th>
                      <th className="px-3 py-2 text-right">P. Unit.</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items.map((it: any) => (
                      <tr key={it.id}>
                        <td className="px-3 py-2">{it.nombre || it.product?.name || it.service?.name || 'Item'}</td>
                        <td className="px-3 py-2 text-right">{it.cantidad ?? it.quantity ?? 1}</td>
                        <td className="px-3 py-2 text-right">
                          ${Number(it.precioUnitario ?? it.product?.price ?? it.service?.price ?? 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          ${Number(it.subtotal ?? ((it.precioUnitario ?? it.product?.price ?? it.service?.price ?? 0) * (it.cantidad ?? it.quantity ?? 1))).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end space-x-2">
          {isSupervisor && (
            <button
              onClick={deleteAndRollback}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              title="Eliminar transacción (Supervisor)"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
