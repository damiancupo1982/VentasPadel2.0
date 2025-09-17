import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, Movement, Sale, SaleItem, Court, CourtService, CourtReservation, CourtBill, Expense, AdminTurn, TurnClosure } from '../types';
import { 
  getProducts, 
  getMovements, 
  getSales, 
  getCourts, 
  getCourtServices, 
  getReservations, 
  getCourtBills, 
  getExpenses,
  getAdminTurns,
  getTurnClosures,
  getActiveTurn,
  initializeDefaultData 
} from '../utils/db';
import { getCarnets } from '../utils/carnetsDb';

/** ---- Helpers internos para retiros ---- */
type PaymentMethod = 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
type TransactionKind = 'kiosk' | 'court' | 'retiro' | 'gasto' | 'caja-inicial';

interface PaymentBreakdown {
  efectivo?: number;
  transferencia?: number;
  expensa?: number;
}

interface GenericTransaction {
  id: string;
  kind: TransactionKind;
  receiptNumber: string;      // RT-YYYY-NNNNNN para retiro
  total: number;              // NEGATIVO para retiro
  paymentMethod: PaymentMethod;
  paymentBreakdown?: PaymentBreakdown; // { efectivo: -monto } en retiro
  adminName?: string;
  notes?: string;
  createdAt: string;
}

function nextReceipt(prefix: string = 'RT') {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
  return `${prefix}-${year}-${seq}`;
}

function pushLocalTransaction(tx: GenericTransaction) {
  const key = 'villanueva-transactions';
  const list: GenericTransaction[] = JSON.parse(localStorage.getItem(key) || '[]');
  list.unshift(tx);
  localStorage.setItem(key, JSON.stringify(list));
}

interface OpenBill {
  reservationId: string;
  courtId: string;
  items: SaleItem[];
  total: number;
  customerName?: string;
  lotNumber?: string;
}

interface StoreState {
  products: Product[];
  movements: Movement[];
  sales: Sale[];
  courts: Court[];
  courtServices: CourtService[];
  reservations: CourtReservation[];
  courtBills: CourtBill[];
  expenses: Expense[];
  adminTurns: AdminTurn[];
  turnClosures: TurnClosure[];
  activeTurn: AdminTurn | null;
  carnets: any[]; // Carnets de socios
  cart: SaleItem[];
  openBills: OpenBill[]; // Facturas abiertas de canchas
  isLoading: boolean;
  isAdmin: boolean;
  
  // Actions
  setProducts: (products: Product[]) => void;
  setMovements: (movements: Movement[]) => void;
  setSales: (sales: Sale[]) => void;
  setCourts: (courts: Court[]) => void;
  setCourtServices: (services: CourtService[]) => void;
  setReservations: (reservations: CourtReservation[]) => void;
  setCourtBills: (bills: CourtBill[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setAdminTurns: (turns: AdminTurn[]) => void;
  setTurnClosures: (closures: TurnClosure[]) => void;
  setActiveTurn: (turn: AdminTurn | null) => void;
  setCarnets: (carnets: any[]) => void;
  setOpenBills: (bills: OpenBill[]) => void;
  addOpenBill: (bill: OpenBill) => void;
  removeOpenBill: (reservationId: string) => void;
  updateOpenBill: (reservationId: string, updates: Partial<OpenBill>) => void;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  setAdmin: (isAdmin: boolean) => void;

  /** NUEVO: registrar retiro de efectivo y actualizar totales del turno */
  withdrawCash: (amount: number, notes?: string) => Promise<void>;
  
  // Computed
  getCartTotal: () => number;
  refreshData: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [],
      movements: [],
      sales: [],
      courts: [],
      courtServices: [],
      reservations: [],
      courtBills: [],
      expenses: [],
      adminTurns: [],
      turnClosures: [],
      activeTurn: null,
      carnets: [],
      cart: [],
      openBills: [],
      isLoading: false,
      isAdmin: false,
      
      setProducts: (products) => set({ products }),
      setMovements: (movements) => set({ movements }),
      setSales: (sales) => set({ sales }),
      setCourts: (courts) => set({ courts }),
      setCourtServices: (courtServices) => set({ courtServices }),
      setReservations: (reservations) => set({ reservations }),
      setCourtBills: (courtBills) => set({ courtBills }),
      setExpenses: (expenses) => set({ expenses }),
      setAdminTurns: (adminTurns) => set({ adminTurns }),
      setTurnClosures: (turnClosures) => set({ turnClosures }),
      setActiveTurn: (activeTurn) => set({ activeTurn }),
      setCarnets: (carnets) => set({ carnets }),
      setOpenBills: (openBills) => set({ openBills }),
      addOpenBill: (bill) => {
        const openBills = get().openBills;
        set({ openBills: [...openBills, bill] });
        localStorage.setItem('villanueva-open-bills', JSON.stringify([...openBills, bill]));
      },
      removeOpenBill: (reservationId) => {
        const openBills = get().openBills;
        const updated = openBills.filter(bill => bill.reservationId !== reservationId);
        set({ openBills: updated });
        localStorage.setItem('villanueva-open-bills', JSON.stringify(updated));
      },
      updateOpenBill: (reservationId, updates) => {
        const openBills = get().openBills;
        const updated = openBills.map(bill =>
          bill.reservationId === reservationId ? { ...bill, ...updates } : bill
        );
        set({ openBills: updated });
        localStorage.setItem('villanueva-open-bills', JSON.stringify(updated));
      },
      setLoading: (isLoading) => set({ isLoading }),
      setAdmin: (isAdmin) => set({ isAdmin }),
      
      addToCart: (product, quantity) => {
        const cart = get().cart;
        const existingItem = cart.find(item => item.product.id === product.id);
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          set({
            cart: cart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: newQuantity, subtotal: newQuantity * product.price }
                : item
            )
          });
        } else {
          set({
            cart: [...cart, {
              product,
              quantity,
              subtotal: quantity * product.price
            }]
          });
        }
      },
      
      removeFromCart: (productId) => {
        set({
          cart: get().cart.filter(item => item.product.id !== productId)
        });
      },
      
      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        set({
          cart: get().cart.map(item =>
            item.product.id === productId
              ? { ...item, quantity, subtotal: quantity * item.product.price }
              : item
          )
        });
      },
      
      clearCart: () => set({ cart: [] }),
      
      /** NUEVO: retiro de efectivo */
      withdrawCash: async (amount, notes) => {
        if (!amount || amount <= 0) return;

        const state = get();
        const activeTurn = state.activeTurn;

        // 1) Registrar transacción local (para exportación y/o historial)
        const tx: GenericTransaction = {
          id: crypto?.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}`,
          kind: 'retiro',
          receiptNumber: nextReceipt('RT'),
          total: -Math.abs(amount),
          paymentMethod: 'efectivo',
          paymentBreakdown: { efectivo: -Math.abs(amount) },
          adminName: activeTurn?.adminName ?? 'Admin',
          notes,
          createdAt: new Date().toISOString(),
        };
        pushLocalTransaction(tx);

        // 2) Actualizar totales de turno en memoria (efectivo y total bajan)
        if (activeTurn) {
          const updatedTurn: AdminTurn = {
            ...activeTurn,
            totals: {
              ...activeTurn.totals,
              efectivo: (activeTurn.totals?.efectivo ?? 0) - Math.abs(amount),
              total: (activeTurn.totals?.total ?? 0) - Math.abs(amount),
              transferencia: activeTurn.totals?.transferencia ?? 0,
              expensa: activeTurn.totals?.expensa ?? 0,
            }
          };
          set({ activeTurn: updatedTurn });
        }

        // Nota: en el PASO 4 podemos persistir esta bajada de efectivo en la DB de turnos
        // (updateAdminTurn) si lo estás guardando también en IndexedDB/Supabase.
      },
      
      getCartTotal: () => {
        return get().cart.reduce((total, item) => total + item.subtotal, 0);
      },
      
      refreshData: async () => {
        set({ isLoading: true });
        try {
          await initializeDefaultData();
          const [products, movements, sales, courts, courtServices, reservations, courtBills, expenses, adminTurns, turnClosures, activeTurn, carnets] = await Promise.all([
            getProducts(),
            getMovements(),
            getSales(),
            getCourts(),
            getCourtServices(),
            getReservations(),
            getCourtBills(),
            getExpenses(),
            getAdminTurns(),
            getTurnClosures(),
            getActiveTurn(),
            getCarnets()
          ]);
          
          // Cargar facturas abiertas desde localStorage
          const openBills = JSON.parse(localStorage.getItem('villanueva-open-bills') || '[]');
          
          set({ products, movements, sales, courts, courtServices, reservations, courtBills, expenses, adminTurns, turnClosures, activeTurn, carnets, openBills });
        } catch (error) {
          console.error('Error refreshing data:', error);
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'villanueva-padel-store',
      partialize: (state) => ({ 
        isAdmin: state.isAdmin,
        openBills: state.openBills 
      }),
      onRehydrateStorage: () => (state) => {
        // Sincronizar openBills con localStorage al rehidratar
        if (state) {
          const openBills = JSON.parse(localStorage.getItem('villanueva-open-bills') || '[]');
          state.openBills = openBills;
        }
      }
    }
  )
);
