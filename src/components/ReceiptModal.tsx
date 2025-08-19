import React from 'react';
import { X, Receipt, Calendar, CreditCard, User, MapPin, Printer } from 'lucide-react';
import { Sale } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, sale }) => {
  if (!isOpen || !sale) return null;
  
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'efectivo':
        return '💵';
      case 'transferencia':
        return '💳';
      case 'expensa':
        return '📄';
      default:
        return '💵';
    }
  };
  
  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'efectivo':
        return 'Efectivo';
      case 'transferencia':
        return 'Transferencia';
      case 'expensa':
        return 'Expensa';
      case 'combinado':
        return 'Pago Combinado';
      default:
        return 'Efectivo';
    }
  };
  
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Recibo ${sale.receiptNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .receipt { max-width: 400px; margin: 0 auto; }
                .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
                .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
                .items { margin: 15px 0; }
                .item { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 15px; font-weight: bold; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Receipt className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Recibo de Venta</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Imprimir recibo"
            >
              <Printer className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div id="receipt-content" className="p-6">
          <div className="receipt">
            <div className="header text-center border-b-2 border-gray-800 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-green-600">VILLANUEVA PÁDEL</h1>
              <p className="text-sm text-gray-600">Complejo de Canchas de Pádel</p>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="font-medium">Recibo N°:</span>
                <span className="font-mono">{sale.receiptNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Fecha:
                </span>
                <span>{new Date(sale.createdAt).toLocaleString('es-ES')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium flex items-center">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Pago:
                </span>
                <div className="text-right">
                  <div className="flex items-center justify-end">
                    {getPaymentIcon(sale.paymentMethod)}
                    <span className="ml-1">{getPaymentLabel(sale.paymentMethod)}</span>
                  </div>
                  {sale.paymentMethod === 'combinado' && sale.paymentBreakdown && (
                    <div className="text-xs text-gray-600 mt-1">
                      {sale.paymentBreakdown.efectivo > 0 && <div>💵 ${sale.paymentBreakdown.efectivo}</div>}
                      {sale.paymentBreakdown.transferencia > 0 && <div>💳 ${sale.paymentBreakdown.transferencia}</div>}
                      {sale.paymentBreakdown.expensa > 0 && <div>📄 ${sale.paymentBreakdown.expensa}</div>}
                    </div>
                  )}
                </div>
              </div>
              
              {sale.customerName && (
                <div className="flex justify-between">
                  <span className="font-medium flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Cliente:
                  </span>
                  <span>{sale.customerName}</span>
                </div>
              )}
              
              {sale.lotNumber && (
                <div className="flex justify-between">
                  <span className="font-medium flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Lote:
                  </span>
                  <span>{sale.lotNumber}</span>
                </div>
              )}
              
              {sale.courtId && (
                <div className="flex justify-between">
                  <span className="font-medium">Cancha:</span>
                  <span>{sale.courtId}</span>
                </div>
              )}
            </div>
            
            <div className="items border-t border-gray-300 pt-4 mb-4">
              <h3 className="font-semibold mb-3">Detalle de Productos:</h3>
              {sale.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="text-sm text-gray-500">
                      ${item.product.price} x {item.quantity}
                    </div>
                  </div>
                  <div className="font-medium">
                    ${item.subtotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="total border-t-2 border-gray-800 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">TOTAL:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${sale.total.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div className="footer text-center mt-6 text-sm text-gray-500">
              <p>¡Gracias por su compra!</p>
              <p>Villanueva Pádel - Sistema de Gestión</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 p-4 border-t">
          <button
            onClick={handlePrint}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;