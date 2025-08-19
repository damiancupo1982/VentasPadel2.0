import { get, set } from 'idb-keyval';
import { Student, ClassSchedule, Attendance, ClassPayment, StudentAccount, MonthlyAttendance } from '../types/classes';

const STUDENTS_KEY = 'villanueva-padel-students';
const CLASS_SCHEDULES_KEY = 'villanueva-padel-class-schedules';
const ATTENDANCES_KEY = 'villanueva-padel-attendances';
const CLASS_PAYMENTS_KEY = 'villanueva-padel-class-payments';
const CLASS_RECEIPT_COUNTER_KEY = 'villanueva-padel-class-receipt-counter';

// Fallback to localStorage if IndexedDB fails
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
  }
};

// Receipt number generator for classes
const getNextClassReceiptNumber = async (): Promise<string> => {
  const counter = await storage.get(CLASS_RECEIPT_COUNTER_KEY) || 0;
  const nextCounter = counter + 1;
  await storage.set(CLASS_RECEIPT_COUNTER_KEY, nextCounter);
  
  const year = new Date().getFullYear();
  const paddedNumber = nextCounter.toString().padStart(6, '0');
  return `CL-${year}-${paddedNumber}`;
};

// Students CRUD
export const getStudents = async (): Promise<Student[]> => {
  const students = await storage.get(STUDENTS_KEY);
  return students || [];
};

export const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> => {
  const students = await getStudents();
  const newStudent: Student = {
    ...studentData,
    id: `student-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  students.push(newStudent);
  await storage.set(STUDENTS_KEY, students);
  return newStudent;
};

export const updateStudent = async (id: string, updates: Partial<Student>): Promise<Student | null> => {
  const students = await getStudents();
  const index = students.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  students[index] = {
    ...students[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await storage.set(STUDENTS_KEY, students);
  return students[index];
};

export const deleteStudent = async (id: string): Promise<boolean> => {
  const students = await getStudents();
  const filtered = students.filter(s => s.id !== id);
  
  if (filtered.length === students.length) return false;
  
  await storage.set(STUDENTS_KEY, filtered);
  return true;
};

// Class Schedules CRUD
export const getClassSchedules = async (): Promise<ClassSchedule[]> => {
  const schedules = await storage.get(CLASS_SCHEDULES_KEY);
  return schedules || [];
};

export const addClassSchedule = async (scheduleData: Omit<ClassSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClassSchedule> => {
  const schedules = await getClassSchedules();
  const newSchedule: ClassSchedule = {
    ...scheduleData,
    id: `schedule-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  schedules.push(newSchedule);
  await storage.set(CLASS_SCHEDULES_KEY, schedules);
  return newSchedule;
};

export const updateClassSchedule = async (id: string, updates: Partial<ClassSchedule>): Promise<ClassSchedule | null> => {
  const schedules = await getClassSchedules();
  const index = schedules.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  schedules[index] = {
    ...schedules[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await storage.set(CLASS_SCHEDULES_KEY, schedules);
  return schedules[index];
};

export const deleteClassSchedule = async (id: string): Promise<boolean> => {
  const schedules = await getClassSchedules();
  const filtered = schedules.filter(s => s.id !== id);
  
  if (filtered.length === schedules.length) return false;
  
  await storage.set(CLASS_SCHEDULES_KEY, filtered);
  return true;
};

// Attendances CRUD
export const getAttendances = async (): Promise<Attendance[]> => {
  const attendances = await storage.get(ATTENDANCES_KEY);
  return attendances || [];
};

export const addAttendance = async (attendanceData: Omit<Attendance, 'id' | 'createdAt'>): Promise<Attendance> => {
  const attendances = await getAttendances();
  const newAttendance: Attendance = {
    ...attendanceData,
    id: `attendance-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  
  attendances.push(newAttendance);
  await storage.set(ATTENDANCES_KEY, attendances);
  return newAttendance;
};

export const updateAttendance = async (id: string, updates: Partial<Attendance>): Promise<Attendance | null> => {
  const attendances = await getAttendances();
  const index = attendances.findIndex(a => a.id === id);
  
  if (index === -1) return null;
  
  attendances[index] = {
    ...attendances[index],
    ...updates,
  };
  
  await storage.set(ATTENDANCES_KEY, attendances);
  return attendances[index];
};

// Class Payments CRUD
export const getClassPayments = async (): Promise<ClassPayment[]> => {
  const payments = await storage.get(CLASS_PAYMENTS_KEY);
  return payments || [];
};

export const addClassPayment = async (paymentData: Omit<ClassPayment, 'id' | 'receiptNumber' | 'createdAt'>): Promise<ClassPayment> => {
  const payments = await getClassPayments();
  const receiptNumber = await getNextClassReceiptNumber();
  
  const newPayment: ClassPayment = {
    ...paymentData,
    id: `class-payment-${Date.now()}`,
    receiptNumber,
    createdAt: new Date().toISOString(),
  };
  
  payments.push(newPayment);
  await storage.set(CLASS_PAYMENTS_KEY, payments);
  return newPayment;
};

// Monthly Attendance Reports
export const getMonthlyAttendance = async (month: string): Promise<MonthlyAttendance[]> => {
  const students = await getStudents();
  const schedules = await getClassSchedules();
  const attendances = await getAttendances();
  
  const monthlyData: MonthlyAttendance[] = [];
  
  for (const student of students) {
    const studentSchedules = schedules.filter(s => s.studentIds.includes(student.id) && s.fecha.startsWith(month));
    const studentAttendances = attendances.filter(a => a.studentId === student.id && a.fecha.startsWith(month));
    
    const totalClases = studentSchedules.length;
    const clasesAsistidas = studentAttendances.filter(a => a.presente).length;
    const porcentajeAsistencia = totalClases > 0 ? (clasesAsistidas / totalClases) * 100 : 0;
    
    const detalleAsistencias = studentAttendances.map(a => ({
      fecha: a.fecha,
      presente: a.presente,
      observaciones: a.observaciones
    }));
    
    monthlyData.push({
      studentId: student.id,
      studentName: student.nombreCompleto,
      mes: month,
      totalClases,
      clasesAsistidas,
      porcentajeAsistencia,
      detalleAsistencias
    });
  }
  
  return monthlyData;
};

// Student Accounts
export const getStudentAccounts = async (): Promise<StudentAccount[]> => {
  const students = await getStudents();
  const payments = await getClassPayments();
  
  const accounts: StudentAccount[] = [];
  
  for (const student of students) {
    const studentPayments = payments.filter(p => p.studentId === student.id);
    const totalPagado = studentPayments.reduce((sum, p) => sum + p.total, 0);
    const ultimoPago = studentPayments.length > 0 ? 
      studentPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].fechaPago : 
      undefined;
    
    // For now, we'll assume no debt calculation logic - this can be enhanced
    const totalDeuda = 0;
    const saldoPendiente = totalDeuda - totalPagado;
    
    accounts.push({
      studentId: student.id,
      studentName: student.nombreCompleto,
      totalDeuda,
      totalPagado,
      saldoPendiente,
      ultimoPago,
      pagos: studentPayments,
      updatedAt: new Date().toISOString()
    });
  }
  
  return accounts;
};

// Export functions
export const exportStudentsCSV = async (): Promise<string> => {
  const students = await getStudents();
  
  const headers = ['ID', 'Nombre Completo', 'Teléfono', 'Lote', 'Barrio', 'DNI', 'Condición', 'Observaciones', 'Fecha Creación'];
  const rows = students.map(student => [
    student.id,
    student.nombreCompleto,
    student.telefono,
    student.lote,
    student.barrio,
    student.dni,
    student.condicion,
    student.observaciones,
    new Date(student.createdAt).toLocaleDateString('es-ES')
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
};

export const exportPaymentsCSV = async (): Promise<string> => {
  const payments = await getClassPayments();
  
  const headers = ['Recibo', 'Alumno', 'Fecha Pago', 'Total', 'Método Pago', 'Observaciones'];
  const rows = payments.map(payment => [
    payment.receiptNumber,
    payment.studentName,
    payment.fechaPago,
    payment.total,
    payment.metodoPago,
    payment.observaciones
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
};

export const exportAccountsCSV = async (): Promise<string> => {
  const accounts = await getStudentAccounts();
  
  const headers = ['Alumno', 'Total Pagado', 'Saldo Pendiente', 'Último Pago'];
  const rows = accounts.map(account => [
    account.studentName,
    account.totalPagado,
    account.saldoPendiente,
    account.ultimoPago || 'Sin pagos'
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
};