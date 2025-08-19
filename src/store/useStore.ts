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
      },
      removeOpenBill: (reservationId) => {
        const openBills = get().openBills;
        set({ openBills: openBills.filter(bill => bill.reservationId !== reservationId) });
      },
      updateOpenBill: (reservationId, updates) => {
        const openBills = get().openBills;
        set({
          openBills: openBills.map(bill =>
            bill.reservationId === reservationId ? { ...bill, ...updates } : bill
          )
        });
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