// Tipos específicos para el sistema de canchas y facturación

export interface Player {
  name: string;
  lote: string;
  telefono: string;
}

export interface Reservation {
  id: string;
  cancha: string;
  numeroLote: string;
  nombreCliente: string;
  horarioInicio: string;
  horarioFin: string;
  fecha: string;
  jugadores: Player[];
  duracion: number; // en minutos
  createdAt: string;
}

export interface KioscoItem {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}

export interface FacturaItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  tipo: 'kiosco' | 'personalizado' | 'servicio';
}

export interface FacturaAbierta {
  id: string;
  reservaId: string;
  cancha: string;
  cliente: string;
  numeroLote: string;
  fecha: string;
  horarioInicio: string;
  horarioFin: string;
  items: FacturaItem[];
  total: number;
  fechaCreacion: string;
}

export interface FacturaCerrada {
  id: string;
  reservaId: string;
  cancha: string;
  cliente: string;
  numeroLote: string;
  fecha: string;
  horarioInicio: string;
  horarioFin: string;
  items: FacturaItem[];
  total: number;
  metodoPago: 'efectivo' | 'transferencia' | 'expensa';
  fechaCreacion: string;
  fechaCierre: string;
}

export interface CierreTurno {
  id: string;
  fecha: string;
  hora: string;
  facturas: FacturaCerrada[];
  totales: {
    efectivo: number;
    transferencia: number;
    expensa: number;
    total: number;
  };
  cantidadFacturas: number;
  createdAt: string;
}

export interface ServicioAdicional {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}