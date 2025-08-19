// Tipos completamente reestructurados para carnets de socios

export interface SocioMember {
  id: string;
  lote: string;
  condicion: 'TITULAR' | 'FAMILIAR_1' | 'FAMILIAR_2' | 'FAMILIAR_3' | 'FAMILIAR_ADHERENTE';
  nombreCompleto: string;
  telefono: string;
  dni: string;
  email: string;
  barrio: string;
  vinculo: string; // Relación con el titular
  fechaAlta: string;
  fechaBaja?: string;
  motivoBaja?: string;
  estado: 'ACTIVO' | 'SUSPENDIDO' | 'BAJA';
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarnetSocio {
  id: string;
  numeroCarnet: string; // Formato: CS-YYYY-NNNN
  lote: string;
  barrio: string;
  tipo: 'INDIVIDUAL' | 'FAMILIAR';
  estado: 'ACTIVO' | 'SUSPENDIDO' | 'BAJA';
  titular: SocioMember;
  familiares: SocioMember[];
  fechaCreacion: string;
  fechaVencimiento?: string;
  fechaBaja?: string;
  motivoBaja?: string;
  creadoPor: string;
  dadoDeBajaPor?: string;
  observaciones?: string;
  metadata: {
    totalMiembros: number;
    ultimaActualizacion: string;
    version: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ImportCSVRow {
  LOTE: string;
  CONDICION: string;
  socios: string; // Nombre completo
  TELEFONO: string;
  DNI: string;
  MAIL: string;
  BARRIO: string;
  VINCULO: string;
}

export interface ImportResult {
  success: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  duplicates: number;
  updated: number;
  created: number;
  summary: {
    totalRows: number;
    processedRows: number;
    skippedRows: number;
    carnetsCreated: number;
    carnetsUpdated: number;
  };
}

export interface ImportError {
  row: number;
  data: Partial<ImportCSVRow>;
  field?: string;
  reason: string;
  severity: 'error' | 'warning';
}

export interface ImportWarning {
  row: number;
  data: Partial<ImportCSVRow>;
  field: string;
  reason: string;
  action: string;
}

export interface CarnetFilter {
  searchTerm: string;
  lote: string;
  barrio: string;
  condicion: string;
  estado: 'TODOS' | 'ACTIVO' | 'SUSPENDIDO' | 'BAJA';
  tipo: 'TODOS' | 'INDIVIDUAL' | 'FAMILIAR';
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CarnetStats {
  total: number;
  activos: number;
  suspendidos: number;
  bajas: number;
  individuales: number;
  familiares: number;
  porBarrio: Record<string, number>;
  porCondicion: Record<string, number>;
  crecimientoMensual: number;
}

export interface CarnetFormData {
  lote: string;
  barrio: string;
  tipo: 'INDIVIDUAL' | 'FAMILIAR';
  titular: Omit<SocioMember, 'id' | 'createdAt' | 'updatedAt'>;
  familiares: Omit<SocioMember, 'id' | 'createdAt' | 'updatedAt'>[];
  observaciones?: string;
}

// Constantes para validaciones
export const BARRIOS_DISPONIBLES = [
  'Santa Catalina',
  'San Isidro Labrador', 
  'Santa Clara',
  'San Agustín',
  'San Marco',
  'Santa Teresa',
  'San Rafael',
  'San Gabriel',
  'San Francisco',
  'San Benito',
  'San Juan',
  'Santa Ana',
  'OTRO'
] as const;

export const CONDICIONES_DISPONIBLES = [
  'TITULAR',
  'FAMILIAR_1', 
  'FAMILIAR_2',
  'FAMILIAR_3',
  'FAMILIAR_ADHERENTE'
] as const;

export const VINCULOS_DISPONIBLES = [
  'CONYUGE',
  'HIJO/A',
  'PADRE/MADRE',
  'HERMANO/A',
  'ABUELO/A',
  'NIETO/A',
  'TIO/A',
  'SOBRINO/A',
  'PRIMO/A',
  'CUÑADO/A',
  'YERNO/NUERA',
  'SUEGRO/A',
  'OTRO'
] as const;