import { get, set } from 'idb-keyval';
import { CarnetSocio, SocioMember, ImportCSVRow, ImportResult, ImportError, ImportWarning, CarnetFilter, CarnetStats, CarnetFormData } from '../types/carnets';

const CARNETS_KEY = 'villanueva-carnets-v2';
const CARNET_COUNTER_KEY = 'villanueva-carnet-counter';

// Función para forzar actualización del store principal
const notifyStoreUpdate = () => {
  window.dispatchEvent(new CustomEvent('carnets-updated'));
};

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

// Generador de número de carnet
const getNextCarnetNumber = async (): Promise<string> => {
  const counter = await storage.get(CARNET_COUNTER_KEY) || 0;
  const nextCounter = counter + 1;
  await storage.set(CARNET_COUNTER_KEY, nextCounter);
  
  const year = new Date().getFullYear();
  const paddedNumber = nextCounter.toString().padStart(4, '0');
  return `CS-${year}-${paddedNumber}`;
};

// CRUD Operations
export const getCarnets = async (): Promise<CarnetSocio[]> => {
  const carnets = await storage.get(CARNETS_KEY);
  return carnets || [];
};

export const getCarnetByLote = async (lote: string): Promise<CarnetSocio | null> => {
  const carnets = await getCarnets();
  return carnets.find(c => c.lote === lote && c.estado === 'ACTIVO') || null;
};

export const addCarnet = async (carnetData: CarnetFormData): Promise<CarnetSocio> => {
  const carnets = await getCarnets();
  const numeroCarnet = await getNextCarnetNumber();
  
  // Crear titular con ID
  const titular: SocioMember = {
    ...carnetData.titular,
    id: `socio-${Date.now()}-titular`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Crear familiares con IDs
  const familiares: SocioMember[] = carnetData.familiares.map((familiar, index) => ({
    ...familiar,
    id: `socio-${Date.now()}-familiar-${index}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  const newCarnet: CarnetSocio = {
    id: `carnet-${Date.now()}`,
    numeroCarnet,
    lote: carnetData.lote,
    barrio: carnetData.barrio,
    tipo: carnetData.tipo,
    estado: 'ACTIVO',
    titular,
    familiares,
    fechaCreacion: new Date().toISOString(),
    creadoPor: 'Sistema',
    observaciones: carnetData.observaciones,
    metadata: {
      totalMiembros: 1 + familiares.length,
      ultimaActualizacion: new Date().toISOString(),
      version: '2.0'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  carnets.push(newCarnet);
  await storage.set(CARNETS_KEY, carnets);
  
  notifyStoreUpdate();
  return newCarnet;
};

export const updateCarnet = async (id: string, updates: Partial<CarnetSocio>): Promise<CarnetSocio | null> => {
  const carnets = await getCarnets();
  const index = carnets.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  carnets[index] = {
    ...carnets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
    metadata: {
      ...carnets[index].metadata,
      ultimaActualizacion: new Date().toISOString(),
    }
  };
  
  await storage.set(CARNETS_KEY, carnets);
  
  notifyStoreUpdate();
  return carnets[index];
};

export const suspenderCarnet = async (id: string, motivo: string, suspendidoPor: string): Promise<CarnetSocio | null> => {
  return await updateCarnet(id, {
    estado: 'SUSPENDIDO',
    motivoBaja: motivo,
    dadoDeBajaPor: suspendidoPor,
  });
};

export const darDeBajaCarnet = async (id: string, motivo: string, dadoDeBajaPor: string): Promise<CarnetSocio | null> => {
  return await updateCarnet(id, {
    estado: 'BAJA',
    fechaBaja: new Date().toISOString(),
    motivoBaja: motivo,
    dadoDeBajaPor,
  });
};

export const reactivarCarnet = async (id: string, reactivadoPor: string): Promise<CarnetSocio | null> => {
  return await updateCarnet(id, {
    estado: 'ACTIVO',
    fechaBaja: undefined,
    motivoBaja: undefined,
    dadoDeBajaPor: undefined,
    creadoPor: reactivadoPor,
  });
};

// Filtros y búsquedas
export const filterCarnets = async (filter: CarnetFilter): Promise<CarnetSocio[]> => {
  const carnets = await getCarnets();
  
  return carnets.filter(carnet => {
    // Filtro por estado
    if (filter.estado !== 'TODOS' && carnet.estado !== filter.estado) {
      return false;
    }
    
    // Filtro por tipo
    if (filter.tipo !== 'TODOS' && carnet.tipo !== filter.tipo) {
      return false;
    }
    
    // Filtro por lote
    if (filter.lote && !carnet.lote.includes(filter.lote)) {
      return false;
    }
    
    // Filtro por barrio
    if (filter.barrio && carnet.barrio !== filter.barrio) {
      return false;
    }
    
    // Filtro por condición (buscar en titular y familiares)
    if (filter.condicion) {
      const hasCondicion = carnet.titular.condicion === filter.condicion ||
                          carnet.familiares.some(f => f.condicion === filter.condicion);
      if (!hasCondicion) return false;
    }
    
    // Filtro de búsqueda general
    if (filter.searchTerm) {
      const term = filter.searchTerm.toLowerCase();
      const searchInMember = (member: SocioMember) => 
        member.nombreCompleto.toLowerCase().includes(term) ||
        member.dni.includes(term) ||
        member.telefono.includes(term) ||
        member.email.toLowerCase().includes(term);
      
      const matchesSearch = searchInMember(carnet.titular) ||
                           carnet.familiares.some(searchInMember) ||
                           carnet.numeroCarnet.toLowerCase().includes(term) ||
                           carnet.lote.includes(term);
      
      if (!matchesSearch) return false;
    }
    
    // Filtro por fechas
    if (filter.fechaDesde) {
      const fechaCreacion = new Date(carnet.fechaCreacion);
      const fechaDesde = new Date(filter.fechaDesde);
      if (fechaCreacion < fechaDesde) return false;
    }
    
    if (filter.fechaHasta) {
      const fechaCreacion = new Date(carnet.fechaCreacion);
      const fechaHasta = new Date(filter.fechaHasta + 'T23:59:59');
      if (fechaCreacion > fechaHasta) return false;
    }
    
    return true;
  });
};

// Estadísticas
export const getCarnetStats = async (): Promise<CarnetStats> => {
  const carnets = await getCarnets();
  
  const stats: CarnetStats = {
    total: carnets.length,
    activos: carnets.filter(c => c.estado === 'ACTIVO').length,
    suspendidos: carnets.filter(c => c.estado === 'SUSPENDIDO').length,
    bajas: carnets.filter(c => c.estado === 'BAJA').length,
    individuales: carnets.filter(c => c.tipo === 'INDIVIDUAL').length,
    familiares: carnets.filter(c => c.tipo === 'FAMILIAR').length,
    porBarrio: {},
    porCondicion: {},
    crecimientoMensual: 0
  };
  
  // Estadísticas por barrio
  carnets.forEach(carnet => {
    const barrio = carnet.barrio || 'Sin especificar';
    stats.porBarrio[barrio] = (stats.porBarrio[barrio] || 0) + 1;
  });
  
  // Estadísticas por condición
  carnets.forEach(carnet => {
    // Contar titular
    const condicionTitular = carnet.titular.condicion;
    stats.porCondicion[condicionTitular] = (stats.porCondicion[condicionTitular] || 0) + 1;
    
    // Contar familiares
    carnet.familiares.forEach(familiar => {
      const condicion = familiar.condicion;
      stats.porCondicion[condicion] = (stats.porCondicion[condicion] || 0) + 1;
    });
  });
  
  return stats;
};

// Funciones auxiliares para importación
const parseCSVContent = (content: string): string[][] => {
  const lines = content.split('\n').filter(line => line.trim());
  const result: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    row.push(current.trim().replace(/^"|"$/g, ''));
    result.push(row);
  }
  
  return result;
};

const isHeaderRow = (row: string[]): boolean => {
  const headerKeywords = ['LOTE', 'CONDICION', 'socios', 'TELEFONO', 'DNI', 'MAIL', 'BARRIO', 'VINCULO'];
  return row.some(cell => headerKeywords.some(keyword => 
    cell.toUpperCase().includes(keyword.toUpperCase())
  ));
};

const validateCSVRow = (row: string[], rowNumber: number): {
  isValid: boolean;
  data: ImportCSVRow;
  errors: ImportError[];
  warnings: ImportWarning[];
} => {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  
  // Verificar que tenga al menos 8 columnas
  if (row.length < 8) {
    errors.push({
      row: rowNumber,
      data: {},
      reason: `Fila incompleta - se esperan 8 columnas, se encontraron ${row.length}`,
      severity: 'error'
    });
    return { isValid: false, data: {} as ImportCSVRow, errors, warnings };
  }
  
  const data: ImportCSVRow = {
    LOTE: row[0]?.trim() || '',
    CONDICION: row[1]?.trim() || '',
    socios: row[2]?.trim() || '',
    TELEFONO: row[3]?.trim() || '',
    DNI: row[4]?.trim() || '',
    MAIL: row[5]?.trim() || '',
    BARRIO: row[6]?.trim() || '',
    VINCULO: row[7]?.trim() || ''
  };
  
  // Validaciones obligatorias
  if (!data.LOTE) {
    errors.push({
      row: rowNumber,
      data,
      field: 'LOTE',
      reason: 'Número de lote es obligatorio',
      severity: 'error'
    });
  }
  
  if (!data.socios) {
    errors.push({
      row: rowNumber,
      data,
      field: 'socios',
      reason: 'Nombre del socio es obligatorio',
      severity: 'error'
    });
  }
  
  if (!data.TELEFONO) {
    warnings.push({
      row: rowNumber,
      data,
      field: 'TELEFONO',
      reason: 'Teléfono vacío',
      action: 'Se asignará "Sin teléfono"'
    });
    data.TELEFONO = 'Sin teléfono';
  }
  
  // Validar DNI si se proporciona
  if (data.DNI && !/^\d{7,8}$/.test(data.DNI)) {
    warnings.push({
      row: rowNumber,
      data,
      field: 'DNI',
      reason: 'DNI inválido (debe tener 7-8 dígitos)',
      action: 'Se generará DNI automático'
    });
    data.DNI = '';
  }
  
  // Validar email si se proporciona
  if (data.MAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.MAIL)) {
    warnings.push({
      row: rowNumber,
      data,
      field: 'MAIL',
      reason: 'Email inválido',
      action: 'Se asignará email genérico'
    });
    data.MAIL = `socio${data.LOTE}@villanueva.com`;
  }
  
  // Normalizar condición
  data.CONDICION = normalizeCondicion(data.CONDICION);
  
  // Normalizar barrio
  if (!data.BARRIO) {
    data.BARRIO = 'OTRO';
    warnings.push({
      row: rowNumber,
      data,
      field: 'BARRIO',
      reason: 'Barrio vacío',
      action: 'Se asignará "OTRO"'
    });
  }
  
  return {
    isValid: errors.length === 0,
    data,
    errors,
    warnings
  };
};

const normalizeCondicion = (condicion: string): string => {
  const cond = condicion.trim().toUpperCase();
  switch (cond) {
    case 'T':
    case 'TITULAR':
      return 'TITULAR';
    case 'F1':
    case 'FAMILIAR1':
    case 'FAMILIAR_1':
      return 'FAMILIAR_1';
    case 'F2':
    case 'FAMILIAR2':
    case 'FAMILIAR_2':
      return 'FAMILIAR_2';
    case 'F3':
    case 'FAMILIAR3':
    case 'FAMILIAR_3':
      return 'FAMILIAR_3';
    case 'FA':
    case 'ADHERENTE':
    case 'FAMILIAR_ADHERENTE':
      return 'FAMILIAR_ADHERENTE';
    default:
      return 'TITULAR';
  }
};

const groupByLote = (rows: ImportCSVRow[]): Record<string, ImportCSVRow[]> => {
  return rows.reduce((groups, row) => {
    const lote = row.LOTE;
    if (!groups[lote]) {
      groups[lote] = [];
    }
    groups[lote].push(row);
    return groups;
  }, {} as Record<string, ImportCSVRow[]>);
};

const processLoteGroup = async (lote: string, members: ImportCSVRow[]): Promise<{
  success: boolean;
  isNew: boolean;
  error?: string;
}> => {
  try {
    // Verificar si ya existe un carnet para este lote
    const existingCarnet = await getCarnetByLote(lote);
    
    // Ordenar miembros: titular primero
    const sortedMembers = [...members].sort((a, b) => {
      if (a.CONDICION === 'TITULAR') return -1;
      if (b.CONDICION === 'TITULAR') return 1;
      return 0;
    });
    
    // Asegurar que hay un titular
    if (!sortedMembers.some(m => m.CONDICION === 'TITULAR')) {
      sortedMembers[0].CONDICION = 'TITULAR';
    }
    
    // Generar DNIs únicos si faltan
    let dniCounter = parseInt(lote) * 1000;
    sortedMembers.forEach(member => {
      if (!member.DNI) {
        member.DNI = dniCounter.toString();
        dniCounter++;
      }
    });
    
    // Crear estructura de carnet
    const titular = sortedMembers.find(m => m.CONDICION === 'TITULAR')!;
    const familiares = sortedMembers.filter(m => m.CONDICION !== 'TITULAR');
    
    const carnetData: CarnetFormData = {
      lote,
      barrio: titular.BARRIO || 'OTRO',
      tipo: familiares.length > 0 ? 'FAMILIAR' : 'INDIVIDUAL',
      titular: {
        lote,
        condicion: 'TITULAR',
        nombreCompleto: titular.socios,
        telefono: titular.TELEFONO || 'Sin teléfono',
        dni: titular.DNI,
        email: titular.MAIL || `socio${lote}@villanueva.com`,
        barrio: titular.BARRIO || 'OTRO',
        vinculo: 'TITULAR',
        fechaAlta: new Date().toISOString(),
        estado: 'ACTIVO'
      },
      familiares: familiares.map(familiar => ({
        lote,
        condicion: familiar.CONDICION as any,
        nombreCompleto: familiar.socios,
        telefono: familiar.TELEFONO || 'Sin teléfono',
        dni: familiar.DNI,
        email: familiar.MAIL || `familiar${familiar.DNI}@villanueva.com`,
        barrio: familiar.BARRIO || titular.BARRIO || 'OTRO',
        vinculo: familiar.VINCULO || 'FAMILIAR',
        fechaAlta: new Date().toISOString(),
        estado: 'ACTIVO'
      }))
    };
    
    if (existingCarnet) {
      // Actualizar carnet existente
      await updateCarnet(existingCarnet.id, {
        titular: {
          ...carnetData.titular,
          id: existingCarnet.titular.id,
          createdAt: existingCarnet.titular.createdAt,
          updatedAt: new Date().toISOString()
        },
        familiares: carnetData.familiares.map((familiar, index) => ({
          ...familiar,
          id: existingCarnet.familiares[index]?.id || `socio-${Date.now()}-familiar-${index}`,
          createdAt: existingCarnet.familiares[index]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        metadata: {
          totalMiembros: 1 + carnetData.familiares.length,
          ultimaActualizacion: new Date().toISOString(),
          version: '2.0'
        }
      });
      
      return { success: true, isNew: false };
    } else {
      // Crear nuevo carnet
      await addCarnet(carnetData);
      return { success: true, isNew: true };
    }
    
  } catch (error) {
    return {
      success: false,
      isNew: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Importación CSV - FUNCIÓN PRINCIPAL EXPORTADA
export const importCarnetsMasivo = async (csvContent: string): Promise<ImportResult> => {
  console.log('📥 Iniciando importación de carnets desde CSV...');
  
  const result: ImportResult = {
    success: 0,
    errors: [],
    warnings: [],
    duplicates: 0,
    updated: 0,
    created: 0,
    summary: {
      totalRows: 0,
      processedRows: 0,
      skippedRows: 0,
      carnetsCreated: 0,
      carnetsUpdated: 0
    }
  };

  try {
    // Parsear CSV
    const rows = parseCSVContent(csvContent);
    result.summary.totalRows = rows.length;
    
    if (rows.length === 0) {
      result.errors.push({
        row: 0,
        data: {},
        reason: 'El archivo CSV está vacío',
        severity: 'error'
      });
      return result;
    }

    // Filtrar header si existe
    const dataRows = rows.filter((row, index) => {
      if (index === 0 && isHeaderRow(row)) {
        console.log('📋 Header detectado y omitido:', row);
        return false;
      }
      return true;
    });

    console.log(`📊 Procesando ${dataRows.length} filas de datos...`);

    // Validar cada fila
    const validatedRows: ImportCSVRow[] = [];
    dataRows.forEach((row, index) => {
      const rowNumber = index + 1;
      const validation = validateCSVRow(row, rowNumber);
      
      result.errors.push(...validation.errors);
      result.warnings.push(...validation.warnings);
      
      if (validation.isValid) {
        validatedRows.push(validation.data);
        result.summary.processedRows++;
      } else {
        result.summary.skippedRows++;
      }
    });

    if (validatedRows.length === 0) {
      result.errors.push({
        row: 0,
        data: {},
        reason: 'No hay filas válidas para procesar',
        severity: 'error'
      });
      return result;
    }

    // Agrupar por lote
    const loteGroups = groupByLote(validatedRows);
    console.log(`🏠 Procesando ${Object.keys(loteGroups).length} lotes únicos...`);

    // Procesar cada lote
    for (const [lote, members] of Object.entries(loteGroups)) {
      try {
        const loteResult = await processLoteGroup(lote, members);
        
        if (loteResult.success) {
          result.success++;
          if (loteResult.isNew) {
            result.created++;
            result.summary.carnetsCreated++;
          } else {
            result.updated++;
            result.summary.carnetsUpdated++;
          }
        } else {
          result.errors.push({
            row: 0,
            data: { LOTE: lote },
            reason: loteResult.error || 'Error procesando lote',
            severity: 'error'
          });
        }
      } catch (error) {
        result.errors.push({
          row: 0,
          data: { LOTE: lote },
          reason: `Error procesando lote: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          severity: 'error'
        });
      }
    }

    // Notificar actualización y sincronizar
    notifyStoreUpdate();
    
    console.log('✅ Importación completada:', result);
    return result;

  } catch (error) {
    console.error('❌ Error en importación:', error);
    result.errors.push({
      row: 0,
      data: {},
      reason: `Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      severity: 'error'
    });
    return result;
  }
};

// Exportación
export const exportCarnetsCSV = async (): Promise<string> => {
  const carnets = await getCarnets();
  
  const headers = [
    'Número Carnet',
    'Lote',
    'Tipo',
    'Estado',
    'Barrio',
    'Nombre Completo',
    'Condición',
    'DNI',
    'Teléfono',
    'Email',
    'Vínculo',
    'Fecha Alta',
    'Fecha Baja',
    'Motivo Baja',
    'Observaciones',
    'Creado Por',
    'Fecha Creación'
  ];
  
  const rows: string[][] = [];
  
  carnets.forEach(carnet => {
    // Agregar titular
    rows.push([
      carnet.numeroCarnet,
      carnet.lote,
      carnet.tipo,
      carnet.estado,
      carnet.barrio,
      carnet.titular.nombreCompleto,
      carnet.titular.condicion,
      carnet.titular.dni,
      carnet.titular.telefono,
      carnet.titular.email,
      carnet.titular.vinculo,
      carnet.titular.fechaAlta,
      carnet.titular.fechaBaja || '',
      carnet.titular.motivoBaja || '',
      carnet.observaciones || '',
      carnet.creadoPor,
      new Date(carnet.fechaCreacion).toLocaleDateString('es-ES')
    ]);
    
    // Agregar familiares
    carnet.familiares.forEach(familiar => {
      rows.push([
        carnet.numeroCarnet,
        carnet.lote,
        carnet.tipo,
        carnet.estado,
        carnet.barrio,
        familiar.nombreCompleto,
        familiar.condicion,
        familiar.dni,
        familiar.telefono,
        familiar.email,
        familiar.vinculo,
        familiar.fechaAlta,
        familiar.fechaBaja || '',
        familiar.motivoBaja || '',
        carnet.observaciones || '',
        carnet.creadoPor,
        new Date(carnet.fechaCreacion).toLocaleDateString('es-ES')
      ]);
    });
  });
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
};

// Búsquedas específicas
export const buscarSocioPorDNI = async (dni: string): Promise<{
  carnet: CarnetSocio;
  socio: SocioMember;
} | null> => {
  const carnets = await getCarnets();
  
  for (const carnet of carnets) {
    if (carnet.titular.dni === dni) {
      return { carnet, socio: carnet.titular };
    }
    
    const familiar = carnet.familiares.find(f => f.dni === dni);
    if (familiar) {
      return { carnet, socio: familiar };
    }
  }
  
  return null;
};

export const buscarCarnetsPorBarrio = async (barrio: string): Promise<CarnetSocio[]> => {
  const carnets = await getCarnets();
  return carnets.filter(c => c.barrio === barrio && c.estado === 'ACTIVO');
};

export const getSociosVencidos = async (): Promise<CarnetSocio[]> => {
  const carnets = await getCarnets();
  const hoy = new Date();
  
  return carnets.filter(carnet => {
    if (!carnet.fechaVencimiento || carnet.estado !== 'ACTIVO') return false;
    return new Date(carnet.fechaVencimiento) < hoy;
  });
};

// Reportes avanzados
export const getReporteMensual = async (mes: string): Promise<{
  nuevosIngresos: CarnetSocio[];
  bajas: CarnetSocio[];
  suspensiones: CarnetSocio[];
  reactivaciones: CarnetSocio[];
  estadisticas: CarnetStats;
}> => {
  const carnets = await getCarnets();
  const [year, month] = mes.split('-');
  
  const nuevosIngresos = carnets.filter(c => {
    const fecha = new Date(c.fechaCreacion);
    return fecha.getFullYear() === parseInt(year) && 
           fecha.getMonth() === parseInt(month) - 1;
  });
  
  const bajas = carnets.filter(c => {
    if (!c.fechaBaja) return false;
    const fecha = new Date(c.fechaBaja);
    return fecha.getFullYear() === parseInt(year) && 
           fecha.getMonth() === parseInt(month) - 1;
  });
  
  const estadisticas = await getCarnetStats();
  
  return {
    nuevosIngresos,
    bajas,
    suspensiones: [], // Por implementar
    reactivaciones: [], // Por implementar
    estadisticas
  };
};