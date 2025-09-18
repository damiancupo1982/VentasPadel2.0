// src/utils/db.ts
import { get, set, del, keys, clear } from 'idb-keyval';
import {
  Product,
  Movement,
  Sale,
  Court,
  CourtService,
  CourtReservation,
  CourtBill,
  Expense,
  StockLevel,
  ExpenseTransaction,
  AdminTurn,
  TurnClosure,
  OpenBill
} from '../types';

// ---------- Fallback a localStorage si falla IndexedDB ----------
const storage = {
  async get(key: string) {
    try {
      return await get(key);
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : undefined;
    }
  },
  async set(key: string, value: any) {
    try {
      await set(key, value);
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  async del(key: string) {
    try {
      await del(key);
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      localStorage.removeItem(key);
    }
  },
  async keys() {
    try {
      return await keys();
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      return Object.keys(localStorage);
    }
  },
  async clear() {
    try {
      await clear();
    } catch (error) {
      console.warn('IndexedDB failed, using localStorage:', error);
      localStorage.clear();
    }
  }
};

// ---------- Claves ----------
const PRODUCTS_KEY = 'villanueva-products';
const MOVEMENTS_KEY = 'villanueva-movements';
const SALES_KEY = 'villanueva-sales';
const RECEIPT_COUNTER_KEY = 'villanueva-receipt-counter';
const COURTS_KEY = 'villanueva-courts';
const COURT_SERVICES_KEY = 'villanueva-court-services';
const RESERVATIONS_KEY = 'villanueva-reservations';
const COURT_BILLS_KEY = 'villanueva-court-bills';
const EXPENSES_KEY = 'villanueva-expenses';
const ADMIN_TURNS_KEY = 'villanueva-admin-turns';
const TURN_CLOSURES_KEY = 'villanueva-turn-closures';
const WITHDRAWAL_COUNTER_KEY = 'villanueva-withdrawal-counter';
const OPEN_BILLS_KEY = 'villanueva-open-bills';

// ---- Marcado de eliminadas (soft-delete para UI/backup) ----
const DELETED_TX_IDS_KEY = 'villanueva-deleted-transaction-ids';

const readDeletedIds = (): string[] => {
  try { return JSON.parse(localStorage.getItem(DELETED_TX_IDS_KEY) || '[]'); }
  catch { return []; }
};
const pushDeletedId = (id: string) => {
  const setIds = new Set(readDeletedIds());
  setIds.add(id);
  localStorage.setItem(DELETED_TX_IDS_KEY, JSON.stringify([...setIds]));
};
const removeFromHistoricalTransactions = (id: string) => {
  try {
    const raw = localStorage.getItem('historical-transactions-v1');
    if (!raw) return;
    const arr = JSON.parse(raw) || [];
    const filtered = arr.filter((t: any) => t?.id !== id);
    localStorage.setItem('historical-transactions-v1', JSON.stringify(filtered));
  } catch { /* noop */ }
};

// ---------- Generadores ----------
const getNextReceiptNumber = async (): Promise<string> => {
  const counter = (await storage.get(RECEIPT_COUNTER_KEY)) || 0;
  const nextCounter = counter + 1;
  await storage.set(RECEIPT_COUNTER_KEY, nextCounter);
  const year = new Date().getFullYear();
  const paddedNumber = nextCounter.toString().padStart(6, '0');
  return `VP-${year}-${paddedNumber}`;
};

const getNextWithdrawalId = async (): Promise<string> => {
  const counter = (await storage.get(WITHDRAWAL_COUNTER_KEY)) || 0;
  const nextCounter = counter + 1;
  await storage.set(WITHDRAWAL_COUNTER_KEY, nextCounter);
  const paddedNumber = nextCounter.toString().padStart(4, '0');
  return `RETIRO-${paddedNumber}`;
};

// ---------- Inicialización por defecto ----------
export const initializeDefaultData = async () => {
  // Canchas
  const existingCourts = await getCourts();
  if (existingCourts.length === 0) {
    const defaultCourts: Court[] = [
      { id: 'court-1', name: 'SILICON (Cancha 1)', isActive: true, turnRate: 0 },
      { id: 'court-2', name: 'REMAX (Cancha 2)', isActive: true, turnRate: 0 },
      { id: 'court-3', name: 'PHIA RENTAL (Cancha 3)', isActive: true, turnRate: 0 }
    ];
    await storage.set(COURTS_KEY, defaultCourts);
  }

  // Servicios de cancha
  const existingServices = await getCourtServices();
  if (existingServices.length === 0) {
    const defaultServices: CourtService[] = [
      { id: 'service-1', name: 'Alquiler de Paletas', price: 2000, category: 'equipment', description: 'Par de paletas por turno' },
      { id: 'service-2', name: 'Uso de Luz', price: 1500, category: 'facility', description: 'Iluminación nocturna' },
      { id: 'service-3', name: 'Entrada Invitado', price: 1000, category: 'entry', description: 'Acceso para no socios' },
      { id: 'service-4', name: 'Toallas', price: 500, category: 'equipment', description: 'Toalla de cortesía' },
      { id: 'service-5', name: 'Pelotas', price: 800, category: 'equipment', description: 'Tubo de pelotas' }
    ];
    await storage.set(COURT_SERVICES_KEY, defaultServices);
  }

  // Productos
  const existingProducts = await getProducts();
  if (existingProducts.length === 0) {
    const defaultProducts: Array<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>> = [
      { name: 'Agua Mineral', category: 'Bebidas', price: 500, stock: 20, minStock: 5 },
      { name: 'Gatorade', category: 'Bebidas', price: 800, stock: 15, minStock: 3 },
      { name: 'Coca Cola', category: 'Bebidas', price: 600, stock: 25, minStock: 5 },
      { name: 'Barrita Cereal', category: 'Snacks', price: 400, stock: 30, minStock: 10 },
      { name: 'Toalla Deportiva', category: 'Deportes', price: 1500, stock: 10, minStock: 2 }
    ];
    for (const product of defaultProducts) {
      await addProduct(product);
    }
  }
};

// ===================================================================
// Productos (kiosco y cancha comparten catálogo y stock)
// ===================================================================
export const getProducts = async (): Promise<Product[]> => {
  const products = await storage.get(PRODUCTS_KEY);
  return products || [];
};

export const addProduct = async (
  product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Product> => {
  const products = await getProducts();
  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  products.push(newProduct);
  await storage.set(PRODUCTS_KEY, products);
  return newProduct;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product | null> => {
  const products = await getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await storage.set(PRODUCTS_KEY, products);
  return products[index];
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;

  await storage.set(PRODUCTS_KEY, filtered);
  return true;
};

// ===================================================================
// Movimientos de stock
// ===================================================================
export const getMovements = async (): Promise<Movement[]> => {
  const movements = await storage.get(MOVEMENTS_KEY);
  return movements || [];
};

const updateProductStock = async (productId: string, delta: number): Promise<void> => {
  const products = await getProducts();
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex !== -1) {
    products[productIndex].stock = Math.max(0, (products[productIndex].stock || 0) + delta);
    products[productIndex].updatedAt = new Date().toISOString();
    await storage.set(PRODUCTS_KEY, products);
  }
};

export const addMovement = async (movement: Omit<Movement, 'id' | 'createdAt'>): Promise<Movement> => {
  const movements = await getMovements();
  const newMovement: Movement = {
    ...movement,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };

  movements.push(newMovement);
  await storage.set(MOVEMENTS_KEY, movements);

  // Ajuste de stock
  if (movement.type === 'entrada') {
    await updateProductStock(movement.productId, movement.quantity);
  } else if (movement.type === 'salida' || movement.type === 'venta' || movement.type === 'merma') {
    await updateProductStock(movement.productId, -movement.quantity);
  }

  return newMovement;
};

// ===================================================================
// Ventas (kiosco)
// ===================================================================
export const getSales = async (): Promise<Sale[]> => {
  const sales = await storage.get(SALES_KEY);
  return sales || [];
};

export const addSale = async (sale: Omit<Sale, 'id' | 'receiptNumber' | 'createdAt'>): Promise<Sale> => {
  const sales = await getSales();
  const receiptNumber = await getNextReceiptNumber();

  // Asegurar que paymentBreakdown existe para todos los tipos de pago
  let finalPaymentBreakdown = sale.paymentBreakdown;
  
  if (!finalPaymentBreakdown) {
    if (sale.paymentMethod === 'efectivo') {
      finalPaymentBreakdown = { efectivo: sale.total, transferencia: 0, expensa: 0 };
    } else if (sale.paymentMethod === 'transferencia') {
      finalPaymentBreakdown = { efectivo: 0, transferencia: sale.total, expensa: 0 };
    } else if (sale.paymentMethod === 'expensa') {
      finalPaymentBreakdown = { efectivo: 0, transferencia: 0, expensa: sale.total };
    } else {
      const third = Math.round(sale.total / 3);
      finalPaymentBreakdown = { efectivo: third, transferencia: third, expensa: sale.total - (third * 2) };
    }
  }

  const newSale: Sale = {
    ...sale,
    paymentBreakdown: finalPaymentBreakdown,
    receiptNumber,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };

  sales.push(newSale);
  await storage.set(SALES_KEY, sales);

  // Registrar movimientos por cada item (descuenta del mismo stock)
  for (const item of sale.items) {
    await addMovement({
      productId: item.product.id,
      productName: item.product.name,
      type: 'venta',
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.subtotal,
      courtId: sale.courtId,
      notes: `Venta ${receiptNumber}`
    });
  }

  return newSale;
};

// ===================================================================
// Canchas
// ===================================================================
export const getCourts = async (): Promise<Court[]> => {
  const courts = await storage.get(COURTS_KEY);
  return courts || [];
};

export const updateCourt = async (id: string, updates: Partial<Court>): Promise<Court | null> => {
  const courts = await getCourts();
  const index = courts.findIndex(c => c.id === id);
  if (index === -1) return null;

  courts[index] = { ...courts[index], ...updates };
  await storage.set(COURTS_KEY, courts);
  return courts[index];
};

// ===================================================================
// Servicios de cancha
// ===================================================================
export const getCourtServices = async (): Promise<CourtService[]> => {
  const services = await storage.get(COURT_SERVICES_KEY);
  return services || [];
};

export const updateCourtService = async (id: string, updates: Partial<CourtService>): Promise<CourtService | null> => {
  const services = await getCourtServices();
  const index = services.findIndex(s => s.id === id);
  if (index === -1) return null;

  services[index] = { ...services[index], ...updates };
  await storage.set(COURT_SERVICES_KEY, services);
  return services[index];
};

// ===================================================================
// Reservas
// ===================================================================
export const getReservations = async (): Promise<CourtReservation[]> => {
  const reservations = await storage.get(RESERVATIONS_KEY);
  return reservations || [];
};

export const addReservation = async (reservation: Omit<CourtReservation, 'id' | 'createdAt'>): Promise<CourtReservation> => {
  const reservations = await getReservations();
  const newReservation: CourtReservation = {
    ...reservation,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };

  reservations.push(newReservation);
  await storage.set(RESERVATIONS_KEY, reservations);
  return newReservation;
};

export const updateReservation = async (id: string, updates: Partial<CourtReservation>): Promise<CourtReservation | null> => {
  const reservations = await getReservations();
  const index = reservations.findIndex(r => r.id === id);
  if (index === -1) return null;

  reservations[index] = { ...reservations[index], ...updates };
  await storage.set(RESERVATIONS_KEY, reservations);
  return reservations[index];
};

// ===================================================================
// Facturas de cancha
// ===================================================================
export const getCourtBills = async (): Promise<CourtBill[]> => {
  const bills = await storage.get(COURT_BILLS_KEY);
  return bills || [];
};

export const addCourtBill = async (
  bill: Omit<CourtBill, 'id' | 'receiptNumber' | 'createdAt'> & {
    paymentBreakdown?: { efectivo: number; transferencia: number; expensa: number };
  }
): Promise<CourtBill> => {
  const bills = await getCourtBills();
  const receiptNumber = await getNextReceiptNumber();

  const newBill: CourtBill = {
    ...bill,
    receiptNumber,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };

  bills.push(newBill);
  await storage.set(COURT_BILLS_KEY, bills);

  // Registrar movimientos para los productos de kiosco incluidos en la factura de cancha
  for (const item of bill.kioskItems) {
    await addMovement({
      productId: item.product.id,
      productName: item.product.name,
      type: 'venta',
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.subtotal,
      courtId: bill.courtId,
      notes: `Venta cancha ${bill.courtName} - ${receiptNumber}`
    });
  }

  return newBill;
};

// ===================================================================
// Gastos
// ===================================================================
export const getExpenses = async (): Promise<Expense[]> => {
  const expenses = await storage.get(EXPENSES_KEY);
  return expenses || [];
};

export const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> => {
  const expenses = await getExpenses();
  const newExpense: Expense = {
    ...expense,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };

  expenses.push(newExpense);
  await storage.set(EXPENSES_KEY, expenses);
  return newExpense;
};

// ===================================================================
// Turnos administrativos
// ===================================================================
export const getAdminTurns = async (): Promise<AdminTurn[]> => {
  const turns = await storage.get(ADMIN_TURNS_KEY);
  return turns || [];
};

export const addAdminTurn = async (turn: Omit<AdminTurn, 'id' | 'createdAt'>): Promise<AdminTurn> => {
  const turns = await getAdminTurns();
  const newTurn: AdminTurn = {
    ...turn,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };

  turns.push(newTurn);
  await storage.set(ADMIN_TURNS_KEY, turns);
  return newTurn;
};

export const updateAdminTurn = async (id: string, updates: Partial<AdminTurn>): Promise<AdminTurn | null> => {
  const turns = await getAdminTurns();
  const index = turns.findIndex(t => t.id === id);
  if (index === -1) return null;

  turns[index] = { ...turns[index], ...updates };
  await storage.set(ADMIN_TURNS_KEY, turns);
  return turns[index];
};

export const getActiveTurn = async (): Promise<AdminTurn | null> => {
  const turns = await getAdminTurns();
  return turns.find(turn => turn.status === 'active') || null;
};

// ===================================================================
// Cierres de turno
// ===================================================================
export const getTurnClosures = async (): Promise<TurnClosure[]> => {
  const closures = await storage.get(TURN_CLOSURES_KEY);
  return closures || [];
};

export const addTurnClosure = async (closure: Omit<TurnClosure, 'id' | 'createdAt'>): Promise<TurnClosure> => {
  const closures = await getTurnClosures();
  const newClosure: TurnClosure = {
    ...closure,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };

  closures.push(newClosure);
  await storage.set(TURN_CLOSURES_KEY, closures);
  return newClosure;
};

// ===================================================================
// Transacciones de gastos (retiros)
// ===================================================================
export const addExpenseTransaction = async (
  expense: Omit<ExpenseTransaction, 'id' | 'receiptNumber' | 'withdrawalId' | 'createdAt'>
): Promise<ExpenseTransaction> => {
  const receiptNumber = await getNextReceiptNumber();
  const withdrawalId = expense.type === 'retiro' ? await getNextWithdrawalId() : undefined;

  const newExpense: ExpenseTransaction = {
    ...expense,
    id: Date.now().toString(),
    receiptNumber,
    withdrawalId,
    createdAt: new Date().toISOString()
  };

  return newExpense;
};

// ===================================================================
// Stock levels (para dashboards)
// ===================================================================
export const getStockLevels = async (): Promise<StockLevel[]> => {
  const products = await getProducts();
  return products.map(product => {
    const minStock = product.minStock || 5;
    const level =
      product.stock === 0 ? 'empty' :
      product.stock < minStock ? 'low' :
      product.stock < minStock * 2 ? 'medium' : 'high';

    const percentage = Math.min(100, (product.stock / (minStock * 2)) * 100);

    return { product, level, percentage };
  });
};

// ===================================================================
// Backup / Restore
// ===================================================================
export const exportData = async () => {
  const products = await getProducts();
  const movements = await getMovements();
  const sales = await getSales();
  const courts = await getCourts();
  const courtServices = await getCourtServices();
  const reservations = await getReservations();
  const courtBills = await getCourtBills();
  const expenses = await getExpenses();
  const adminTurns = await getAdminTurns();
  const turnClosures = await getTurnClosures();

  // Contadores
  const receiptCounter = (await storage.get(RECEIPT_COUNTER_KEY)) || 0;
  const withdrawalCounter = (await storage.get(WITHDRAWAL_COUNTER_KEY)) || 0;

  // Carnets (si existieran)
  let carnets: any[] = [];
  try {
    carnets = (await storage.get('villanueva-carnets-v2')) || [];
  } catch {
    /* noop */
  }

  // Datos de clases (si existieran)
  let classData: any = {};
  try {
    const { getStudents, getClassSchedules, getAttendances, getClassPayments } = await import('./classesDb');
    const [students, schedules, attendances, payments] = await Promise.all([
      getStudents(),
      getClassSchedules(),
      getAttendances(),
      getClassPayments()
    ]);
    classData = { students, schedules, attendances, payments };
  } catch {
    /* noop */
  }

  // Transacciones históricas (si existieran)
  let historicalTransactions: any[] = [];
  try {
    const stored = localStorage.getItem('historical-transactions-v1');
    if (stored) historicalTransactions = JSON.parse(stored);
  } catch {
    /* noop */
  }

  return {
    products,
    movements,
    sales,
    courts,
    courtServices,
    reservations,
    courtBills,
    expenses,
    adminTurns,
    turnClosures,
    carnets,
    classData,
    counters: { receiptCounter, withdrawalCounter },
    historicalTransactions,
    deletedTransactionIds: readDeletedIds(),
    systemConfig: {
      isAdmin: localStorage.getItem('villanueva-padel-store')
        ? JSON.parse(localStorage.getItem('villanueva-padel-store') || '{}').state?.isAdmin || false
        : false
    },
    metadata: {
      version: '1.0.0',
      deviceId: localStorage.getItem('device-id'),
      backupType: 'full',
      totalTables: 12,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0'
    }
  };
};

export const importData = async (data: any) => {
  if (data.products) await storage.set(PRODUCTS_KEY, data.products);
  if (data.movements) await storage.set(MOVEMENTS_KEY, data.movements);
  if (data.sales) await storage.set(SALES_KEY, data.sales);
  if (data.courts) await storage.set(COURTS_KEY, data.courts);
  if (data.courtServices) await storage.set(COURT_SERVICES_KEY, data.courtServices);
  if (data.reservations) await storage.set(RESERVATIONS_KEY, data.reservations);
  if (data.courtBills) await storage.set(COURT_BILLS_KEY, data.courtBills);
  if (data.expenses) await storage.set(EXPENSES_KEY, data.expenses);
  if (data.adminTurns) await storage.set(ADMIN_TURNS_KEY, data.adminTurns);
  if (data.turnClosures) await storage.set(TURN_CLOSURES_KEY, data.turnClosures);

  if (data.counters) {
    if (typeof data.counters.receiptCounter === 'number') {
      await storage.set(RECEIPT_COUNTER_KEY, data.counters.receiptCounter);
    }
    if (typeof data.counters.withdrawalCounter === 'number') {
      await storage.set(WITHDRAWAL_COUNTER_KEY, data.counters.withdrawalCounter);
    }
  }

  if (data.carnets && data.carnets.length > 0) {
    await storage.set('villanueva-carnets-v2', data.carnets);
  }

  if (data.classData && Object.keys(data.classData).length > 0) {
    if (data.classData.students) await storage.set('villanueva-padel-students', data.classData.students);
    if (data.classData.schedules) await storage.set('villanueva-padel-class-schedules', data.classData.schedules);
    if (data.classData.attendances) await storage.set('villanueva-padel-attendances', data.classData.attendances);
    if (data.classData.payments) await storage.set('villanueva-padel-class-payments', data.classData.payments);
  }

  if (data.historicalTransactions && data.historicalTransactions.length > 0) {
    localStorage.setItem('historical-transactions-v1', JSON.stringify(data.historicalTransactions));
  }

  if (Array.isArray(data.deletedTransactionIds)) {
    localStorage.setItem(DELETED_TX_IDS_KEY, JSON.stringify(data.deletedTransactionIds));
  }

  if (data.systemConfig) {
    const currentStore = localStorage.getItem('villanueva-padel-store');
    if (currentStore) {
      const storeData = JSON.parse(currentStore);
      storeData.state = { ...storeData.state, ...data.systemConfig };
      localStorage.setItem('villanueva-padel-store', JSON.stringify(storeData));
    }
  }

  return true;
};

export const clearAllData = async () => {
  await storage.clear();
};

// ===================================================================
// Facturas abiertas (Open Bills)
// ===================================================================
export const getOpenBills = async (): Promise<OpenBill[]> => {
  const bills = await storage.get(OPEN_BILLS_KEY);
  return bills || [];
};

export const addOpenBill = async (bill: OpenBill): Promise<OpenBill> => {
  const bills = await getOpenBills();
  bills.push(bill);
  await storage.set(OPEN_BILLS_KEY, bills);
  localStorage.setItem(OPEN_BILLS_KEY, JSON.stringify(bills));
  return bill;
};

export const removeOpenBill = async (reservationId: string): Promise<boolean> => {
  const bills = await getOpenBills();
  const filtered = bills.filter(b => b.reservationId !== reservationId);
  if (filtered.length === bills.length) return false;
  await storage.set(OPEN_BILLS_KEY, filtered);
  localStorage.setItem(OPEN_BILLS_KEY, JSON.stringify(filtered));
  return true;
};

export const updateOpenBill = async (reservationId: string, updates: Partial<OpenBill>): Promise<OpenBill | null> => {
  const bills = await getOpenBills();
  const index = bills.findIndex(b => b.reservationId === reservationId);
  if (index === -1) return null;
  bills[index] = { ...bills[index], ...updates };
  await storage.set(OPEN_BILLS_KEY, bills);
  localStorage.setItem(OPEN_BILLS_KEY, JSON.stringify(bills));
  return bills[index];
};

// ===================================================================
// ******* NUEVO: Eliminar y devolver stock (ventas / facturas) *******
// ===================================================================

/** Marca el id como eliminado y lo quita del storage histórico */
export const softDeleteTransactionById = async (id: string): Promise<void> => {
  pushDeletedId(id);
  removeFromHistoricalTransactions(id);
};

/** Anula una venta de kiosco: repone stock y elimina la venta */
export const deleteSaleAndRestock = async (saleId: string): Promise<boolean> => {
  const sales = await getSales();
  const idx = sales.findIndex(s => s.id === saleId);
  if (idx === -1) return false;

  const sale = sales[idx];

  // Devolver stock por cada item
  for (const item of sale.items) {
    await addMovement({
      productId: item.product.id,
      productName: item.product.name,
      type: 'entrada',
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.subtotal,
      courtId: sale.courtId,
      notes: `Anulación venta ${sale.receiptNumber}`
    });
  }

  // Eliminar la venta
  sales.splice(idx, 1);
  await storage.set(SALES_KEY, sales);

  // Marcar soft-delete para UI/backup y limpiar histórico
  await softDeleteTransactionById(saleId);
  return true;
};

/** Anula una factura de cancha: repone stock de kioskItems y elimina la factura */
export const deleteCourtBillAndRestock = async (billId: string): Promise<boolean> => {
  const bills = await getCourtBills();
  const idx = bills.findIndex(b => b.id === billId);
  if (idx === -1) return false;

  const bill = bills[idx];

  // Devolver stock de productos de kiosco incluidos
  for (const item of bill.kioskItems || []) {
    await addMovement({
      productId: item.product.id,
      productName: item.product.name,
      type: 'entrada',
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: item.subtotal,
      courtId: bill.courtId,
      notes: `Anulación factura ${bill.receiptNumber}`
    });
  }

  // Eliminar la factura
  bills.splice(idx, 1);
  await storage.set(COURT_BILLS_KEY, bills);

  // Soft-delete para UI/backup e histórico
  await softDeleteTransactionById(billId);
  return true;
};
