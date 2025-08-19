export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Movement {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'salida' | 'venta' | 'merma';
  quantity: number;
  unitPrice?: number;
  total?: number;
  courtId?: string;
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  items: SaleItem[];
  total: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
  customerName?: string;
  lotNumber?: string;
  courtId?: string;
  paymentBreakdown?: {
    efectivo: number;
    transferencia: number;
    expensa: number;
  };
  createdAt: string;
}

export interface Court {
  id: string;
  name: string;
  isActive: boolean;
  turnRate: number;
}

export interface CourtService {
  id: string;
  name: string;
  price: number;
  category: 'equipment' | 'facility' | 'entry' | 'other';
  description?: string;
}

export interface Player {
  id: string;
  name: string;
  lotNumber: string;
  amountToPay: number;
}

export interface CourtReservation {
  id: string;
  courtId: string;
  courtName: string;
  customerName: string;
  lotNumber: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  players: Player[];
  turnRate: number;
  lightUsage: boolean;
  lightCost: number;
  racketRental: boolean;
  racketCost: number;
  services: CourtServiceItem[];
  kioskItems: SaleItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'expensa';
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

export interface CourtServiceItem {
  service: CourtService;
  quantity: number;
  subtotal: number;
}

export interface CourtBill {
  id: string;
  receiptNumber: string;
  reservationId: string;
  courtId: string;
  courtName: string;
  customerName: string;
  lotNumber: string;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  players: Player[];
  turnRate: number;
  lightUsage: boolean;
  lightCost: number;
  racketRental: boolean;
  racketCost: number;
  services: CourtServiceItem[];
  kioskItems: SaleItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
  paymentBreakdown?: {
    efectivo: number;
    transferencia: number;
    expensa: number;
  };
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  createdAt: string;
}

export interface AdminTurn {
  id: string;
  adminName: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'closed';
  sales: Sale[];
  courtBills: CourtBill[];
  transactions?: WithdrawalTransaction[];
  expenses?: ExpenseTransaction[];
  totals: {
    efectivo: number;
    transferencia: number;
    expensa: number;
    total: number;
  };
  createdAt: string;
  closedAt?: string;
}

export interface WithdrawalTransaction {
  id: string;
  type: 'retiro';
  receiptNumber: string;
  withdrawalId?: string;
  amount: number;
  adminName: string;
  notes: string;
  createdAt: string;
}

export interface ExpenseTransaction {
  id: string;
  type: 'gasto';
  receiptNumber: string;
  withdrawalId?: string;
  concept: string;
  detail: string;
  amount: number;
  paymentMethod: 'efectivo';
  adminName: string;
  createdAt: string;
}

export interface TurnClosure {
  id: string;
  turnId: string;
  adminName: string;
  startDate: string;
  endDate: string;
  sales: Sale[];
  courtBills: CourtBill[];
  transactions?: WithdrawalTransaction[];
  expenses?: ExpenseTransaction[];
  totals: {
    efectivo: number;
    transferencia: number;
    expensa: number;
    total: number;
  };
  salesCount: number;
  courtBillsCount: number;
  createdAt: string;
}

export interface OpenBill {
  reservationId: string;
  courtId: string;
  courtName: string;
  customerName: string;
  customerType: 'member' | 'guest';
  lotNumber: string;
  startTime: string;
  courtRate: number;
  startDate: string;
  endTime?: string;
  endDate?: string;
  players: Player[];
  services: CourtServiceItem[];
  kioskItems: SaleItem[];
  subtotal: number;
  createdAt: string;
}

export interface StockLevel {
  product: Product;
  level: 'high' | 'medium' | 'low' | 'empty';
  percentage: number;
}