export interface Student {
  id: string;
  nombreCompleto: string;
  telefono: string;
  lote: string;
  barrio: string;
  dni: string;
  condicion: 'titular' | 'familiar';
  observaciones: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSchedule {
  id: string;
  studentIds: string[];
  fecha: string; // YYYY-MM-DD
  horario: string; // HH:MM
  tipo: 'individual' | 'compartida' | 'suelta';
  frecuencia?: 'semanal-1' | 'semanal-2' | 'semanal-3' | 'semanal-4';
  cantidadPersonas: number;
  precio: number;
  observaciones: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  classId: string;
  studentId: string;
  fecha: string;
  presente: boolean;
  observaciones: string;
  createdAt: string;
}

export interface ClassPayment {
  id: string;
  studentId: string;
  studentName: string;
  items: ClassPaymentItem[];
  subtotal: number;
  total: number;
  metodoPago: 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
  paymentBreakdown?: {
    efectivo: number;
    transferencia: number;
    expensa: number;
  };
  fechaPago: string;
  receiptNumber: string;
  observaciones: string;
  createdAt: string;
}

export interface ClassPaymentItem {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface StudentAccount {
  studentId: string;
  studentName: string;
  totalDeuda: number;
  totalPagado: number;
  saldoPendiente: number;
  ultimoPago?: string;
  pagos: ClassPayment[];
  updatedAt: string;
}

export interface MonthlyAttendance {
  studentId: string;
  studentName: string;
  mes: string; // YYYY-MM
  totalClases: number;
  clasesAsistidas: number;
  porcentajeAsistencia: number;
  detalleAsistencias: {
    fecha: string;
    presente: boolean;
    observaciones: string;
  }[];
}