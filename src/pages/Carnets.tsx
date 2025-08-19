import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  Users,
  User,
  Filter,
  AlertTriangle,
  Phone,
  MapPin,
  Upload,
  FileText,
  CheckCircle,
  Mail,
  BarChart3,
  TrendingUp,
  UserCheck,
  UserX,
  Database,
  Settings,
  RefreshCw,
  X
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  getCarnets,
  addCarnet,
  darDeBajaCarnet,
  suspenderCarnet,
  reactivarCarnet,
  exportCarnetsCSV,
  importCarnetsMasivo,
  filterCarnets,
  getCarnetStats
} from '../utils/carnetsDb';
import { CarnetSocio, CarnetFilter, CarnetStats, ImportResult, CarnetFormData } from '../types/carnets';
import CarnetDialog from '../components/CarnetDialog';
import CarnetDetailModal from '../components/CarnetDetailModal';

const Carnets: React.FC = () => {
  const { isAdmin } = useStore();
  const [carnets, setCarnets] = useState<CarnetSocio[]>([]);
  const [filteredCarnets, setFilteredCarnets] = useState<CarnetSocio[]>([]);
  const [stats, setStats] = useState<CarnetStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de filtros
  const [filter, setFilter] = useState<CarnetFilter>({
    searchTerm: '',
    lote: '',
    barrio: '',
    condicion: '',
    estado: 'ACTIVO',
    tipo: 'TODOS'
  });

  // Estados de modales
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCarnet, setSelectedCarnet] = useState<CarnetSocio | null>(null);

  // Estados de acciones
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'baja' | 'suspension' | 'reactivacion'>('baja');
  const [carnetForAction, setCarnetForAction] = useState<CarnetSocio | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Estados de importación
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Estados de sincronización
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();

    // Escuchar actualizaciones de carnets
    const handleCarnetsUpdate = () => {
      loadData();
    };

    window.addEventListener('carnets-updated', handleCarnetsUpdate);

    return () => {
      window.removeEventListener('carnets-updated', handleCarnetsUpdate);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [carnets, filter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [carnetsList, statsData] = await Promise.all([getCarnets(), getCarnetStats()]);
      setCarnets(carnetsList);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading carnets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    try {
      const filtered = await filterCarnets(filter);
      setFilteredCarnets(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredCarnets(carnets);
    }
  };

  const handleSaveCarnet = async (carnetData: CarnetFormData) => {
    try {
      await addCarnet(carnetData);
      await loadData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving carnet:', error);
      alert('Error al guardar el carnet');
    }
  };

  const handleCarnetAction = async () => {
    if (!carnetForAction || !actionReason.trim()) {
      alert('Debe ingresar un motivo para la acción');
      return;
    }

    try {
      const adminName = isAdmin ? 'Administrador' : 'Usuario';

      switch (actionType) {
        case 'baja':
          await darDeBajaCarnet(carnetForAction.id, actionReason.trim(), adminName);
          break;
        case 'suspension':
          await suspenderCarnet(carnetForAction.id, actionReason.trim(), adminName);
          break;
        case 'reactivacion':
          await reactivarCarnet(carnetForAction.id, adminName);
          break;
      }

      await loadData();
      setShowActionModal(false);
      setCarnetForAction(null);
      setActionReason('');
    } catch (error) {
      console.error('Error en acción de carnet:', error);
      alert('Error al procesar la acción');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = await exportCarnetsCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `carnets-socios-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting carnets:', error);
      alert('Error al exportar carnets');
    }
  };

  const handleProcessFile = async () => {
    if (!importFile) {
      alert('Por favor seleccione un archivo');
      return;
    }

    setIsProcessing(true);

    try {
      const text = await importFile.text();
      const result = await importCarnetsMasivo(text);
      setImportResult(result);
      setShowImportModal(false);
      setShowResultModal(true);

      // Forzar recarga de datos después de importación
      await loadData();

      // Forzar actualización del store principal
      const { useStore } = await import('../store/useStore');
      const { refreshData } = useStore.getState();
      await refreshData();

      // Limpiar archivo seleccionado
      setImportFile(null);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error al procesar el archivo. Verifique que sea un archivo CSV válido.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadSampleData = async () => {
    if (!window.confirm('¿Desea cargar los datos de ejemplo? Esto importará carnets de muestra.')) {
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch('/socios-sample.csv');
      const text = await response.text();
      const result = await importCarnetsMasivo(text);
      setImportResult(result);
      setShowResultModal(true);

      // Forzar recarga de datos después de importación
      await loadData();
    } catch (error) {
      console.error('Error loading sample data:', error);
      alert('Error al cargar datos de ejemplo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncFromSupabase = async () => {
    setIsSyncing(true);
    try {
      const { supabaseCarnetsService } = await import('../utils/supabaseCarnets');
      const result = await supabaseCarnetsService.syncFromSupabaseToLocal();

      setSyncMessage(result.message);
      setShowSyncModal(true);

      if (result.success) {
        await loadData();
      }
    } catch (error) {
      setSyncMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setShowSyncModal(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    try {
      const { supabaseCarnetsService } = await import('../utils/supabaseCarnets');
      const result = await supabaseCarnetsService.syncCarnetsToSupabase(carnets);

      setSyncMessage(result.message);
      setShowSyncModal(true);
    } catch (error) {
      setSyncMessage(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setShowSyncModal(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDIDO':
        return 'bg-yellow-100 text-yellow-800';
      case 'BAJA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCondicionColor = (condicion: string) => {
    switch (condicion) {
      case 'TITULAR':
        return 'bg-blue-100 text-blue-800';
      case 'FAMILIAR_1':
        return 'bg-green-100 text-green-800';
      case 'FAMILIAR_2':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAMILIAR_3':
        return 'bg-purple-100 text-purple-800';
      case 'FAMILIAR_ADHERENTE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCondicionLabel = (condicion: string) => {
    switch (condicion) {
      case 'TITULAR':
        return 'Titular';
      case 'FAMILIAR_1':
        return 'Familiar 1';
      case 'FAMILIAR_2':
        return 'Familiar 2';
      case 'FAMILIAR_3':
        return 'Familiar 3';
      case 'FAMILIAR_ADHERENTE':
        return 'Adherente';
      default:
        return condicion;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            Gestión de Carnets de Socios
          </h1>
          <p className="mt-2 text-sm text-gray-700">Sistema avanzado de gestión de socios con importación masiva</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar Masivo
          </button>

          <button
            onClick={handleLoadSampleData}
            disabled={isProcessing}
            className="inline-flex items-center justify-center rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 shadow-sm hover:bg-green-100 disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Cargar Datos de Ejemplo
          </button>

          <button
            onClick={handleSyncFromSupabase}
            disabled={isSyncing}
            className="inline-flex items-center justify-center rounded-md border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sincronizar desde Nube
          </button>

          <button
            onClick={handleSyncToSupabase}
            disabled={isSyncing}
            className="inline-flex items-center justify-center rounded-md border border-orange-300 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 shadow-sm hover:bg-orange-100 disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir a Nube
          </button>

          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Carnet
          </button>
        </div>
      </div>

      {/* Estadísticas Avanzadas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Total Carnets</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center">
              <UserCheck className="h-6 w-6 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Activos</p>
                <p className="text-xl font-bold text-gray-900">{stats.activos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Suspendidos</p>
                <p className="text-xl font-bold text-gray-900">{stats.suspendidos}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
            <div className="flex items-center">
              <UserX className="h-6 w-6 text-red-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Dados de Baja</p>
                <p className="text-xl font-bold text-gray-900">{stats.bajas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center">
              <User className="h-6 w-6 text-purple-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Individuales</p>
                <p className="text-xl font-bold text-gray-900">{stats.individuales}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-indigo-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-500">Nuevos (30d)</p>
                <p className="text-xl font-bold text-gray-900">{stats.crecimientoMensual}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estado de Sincronización */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Estado de Sincronización</h3>
              <p className="text-xs text-blue-600">Los carnets se sincronizan automáticamente con Supabase para persistencia externa</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-blue-700">{carnets.length} carnets locales</span>
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Sincronización activa"></div>
          </div>
        </div>
      </div>

      {/* Filtros Avanzados */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-gray-600" />
            Filtros Avanzados
          </h3>
          <button
            onClick={() =>
              setFilter({
                searchTerm: '',
                lote: '',
                barrio: '',
                condicion: '',
                estado: 'ACTIVO',
                tipo: 'TODOS'
              })
            }
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, DNI, email..."
              value={filter.searchTerm}
              onChange={(e) => setFilter({ ...filter, searchTerm: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Número de lote..."
              value={filter.lote}
              onChange={(e) => setFilter({ ...filter, lote: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <select
            value={filter.estado}
            onChange={(e) => setFilter({ ...filter, estado: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVO">Solo Activos</option>
            <option value="SUSPENDIDO">Solo Suspendidos</option>
            <option value="BAJA">Solo Dados de Baja</option>
          </select>

          <select
            value={filter.tipo}
            onChange={(e) => setFilter({ ...filter, tipo: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="FAMILIAR">Familiar</option>
          </select>

          <select
            value={filter.barrio}
            onChange={(e) => setFilter({ ...filter, barrio: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todos los Barrios</option>
            {stats &&
              Object.keys(stats.porBarrio).map((barrio) => (
                <option key={barrio} value={barrio}>
                  {barrio} ({stats.porBarrio[barrio]})
                </option>
              ))}
          </select>

          <select
            value={filter.condicion}
            onChange={(e) => setFilter({ ...filter, condicion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Todas las Condiciones</option>
            {stats &&
              Object.keys(stats.porCondicion).map((condicion) => (
                <option key={condicion} value={condicion}>
                  {getCondicionLabel(condicion)} ({stats.porCondicion[condicion]})
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center text-sm text-gray-600">
            <BarChart3 className="h-4 w-4 mr-2" />
            {filteredCarnets.length} carnets encontrados
          </div>
          <button
            onClick={() => setIsLoading(true)}
            disabled={isLoading}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de Carnets Mejorada */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carnet</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titular</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo/Miembros</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Creación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCarnets.map((carnet) => (
                <tr key={carnet.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{carnet.numeroCarnet}</div>
                      <div className="text-xs text-gray-500">ID: {carnet.id.slice(-8)}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-blue-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{carnet.titular.nombreCompleto}</div>
                        <div className="text-xs text-gray-500">DNI: {carnet.titular.dni}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />
                        {carnet.titular.telefono}
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <Mail className="h-3 w-3 mr-1" />
                        {carnet.titular.email}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{carnet.barrio}</div>
                        <div className="text-sm font-semibold text-blue-600">Lote {carnet.lote}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        {carnet.tipo === 'INDIVIDUAL' ? (
                          <User className="h-4 w-4 text-purple-600 mr-1" />
                        ) : (
                          <Users className="h-4 w-4 text-indigo-600 mr-1" />
                        )}
                        <span className="text-sm font-medium">{carnet.tipo}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {carnet.metadata.totalMiembros} miembro{carnet.metadata.totalMiembros !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(carnet.estado)}`}>
                      {carnet.estado === 'BAJA' && <UserX className="h-3 w-3 mr-1" />}
                      {carnet.estado === 'SUSPENDIDO' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {carnet.estado === 'ACTIVO' && <UserCheck className="h-3 w-3 mr-1" />}
                      {carnet.estado}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(carnet.fechaCreacion).toLocaleDateString('es-ES')}</div>
                    <div className="text-xs text-gray-500">{carnet.creadoPor}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCarnet(carnet);
                          setIsDetailModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Ver detalles completos"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {isAdmin && carnet.estado === 'ACTIVO' && (
                        <>
                          <button
                            onClick={() => {
                              setCarnetForAction(carnet);
                              setActionType('suspension');
                              setShowActionModal(true);
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Suspender carnet"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setCarnetForAction(carnet);
                              setActionType('baja');
                              setShowActionModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Dar de baja"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}

                      {isAdmin && carnet.estado === 'SUSPENDIDO' && (
                        <button
                          onClick={() => {
                            setCarnetForAction(carnet);
                            setActionType('reactivacion');
                            setShowActionModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Reactivar carnet"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCarnets.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay carnets</h3>
            <p className="mt-1 text-sm text-gray-500">
              {Object.values(filter).some((v) => v && v !== 'TODOS' && v !== 'ACTIVO')
                ? 'No se encontraron carnets con los filtros aplicados'
                : 'Comienza creando un nuevo carnet o importando datos'}
            </p>
          </div>
        )}
      </div>

      {/* Modal para crear carnet */}
      <CarnetDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSave={handleSaveCarnet} />

      {/* Modal de detalle */}
      <CarnetDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} carnet={selectedCarnet} />

      {/* Modal de importación masiva */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowImportModal(false)} />

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                Importación Masiva de Carnets
              </h2>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Formato esperado */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-800 mb-3">📋 Formato CSV Esperado:</h3>
                <div className="bg-white border rounded p-3 font-mono text-sm overflow-x-auto">
                  <div className="text-gray-600 mb-2">LOTE,CONDICION,socios,TELEFONO,DNI,MAIL,BARRIO,VINCULO</div>
                  <div className="text-gray-800">
                    123,T,García Juan,11-1234-5678,12345678,juan@email.com,Santa Catalina,TITULAR
                  </div>
                  <div className="text-gray-800">
                    123,F1,García María,11-8765-4321,87654321,maria@email.com,Santa Catalina,CONYUGE
                  </div>
                  <div className="text-gray-800">
                    456,T,López Pedro,11-5555-5555,55555555,pedro@email.com,San Marco,TITULAR
                  </div>
                </div>
                <div className="mt-3 text-xs text-blue-700 space-y-1">
                  <p>
                    <strong>CONDICION:</strong> T=Titular, F1=Familiar 1, F2=Familiar 2, F3=Familiar 3, FA=Adherente
                  </p>
                  <p>
                    <strong>VINCULO:</strong> TITULAR, CONYUGE, HIJO/A, PADRE/MADRE, etc.
                  </p>
                  <p>
                    <strong>Agrupación:</strong> Los socios se agrupan automáticamente por LOTE
                  </p>
                  <p>
                    <strong>Validaciones:</strong> DNI único, email válido, teléfono requerido
                  </p>
                </div>
              </div>

              {/* Selector de archivo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar archivo CSV</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo
                      </p>
                      <p className="text-xs text-gray-500">CSV (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                {importFile && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">
                        Archivo seleccionado: <strong>{importFile.name}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessFile}
                  disabled={!importFile || isProcessing}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Procesar Archivo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resultados de importación */}
      {showResultModal && importResult && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowResultModal(false)} />

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Resultado de la Importación Masiva
              </h2>
              <button onClick={() => setShowResultModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Resumen estadístico */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Exitosos</p>
                      <p className="text-xl font-bold text-green-900">{importResult.success}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Plus className="h-6 w-6 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Creados</p>
                      <p className="text-xl font-bold text-blue-900">{importResult.created}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Settings className="h-6 w-6 text-yellow-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Actualizados</p>
                      <p className="text-xl font-bold text-yellow-900">{importResult.updated}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Errores</p>
                      <p className="text-xl font-bold text-red-900">{importResult.errors.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles del procesamiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">📊 Resumen del Procesamiento</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total de filas:</span>
                      <span className="font-medium">{importResult.summary.totalRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Filas procesadas:</span>
                      <span className="font-medium text-green-600">{importResult.summary.processedRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Filas omitidas:</span>
                      <span className="font-medium text-red-600">{importResult.summary.skippedRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carnets creados:</span>
                      <span className="font-medium text-blue-600">{importResult.summary.carnetsCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Carnets actualizados:</span>
                      <span className="font-medium text-yellow-600">{importResult.summary.carnetsUpdated}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">⚠️ Advertencias</h4>
                  {importResult.warnings.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {importResult.warnings.slice(0, 5).map((warning, index) => (
                        <div key={index} className="text-xs text-yellow-700">
                          <span className="font-medium">Fila {warning.row}:</span> {warning.reason}
                        </div>
                      ))}
                      {importResult.warnings.length > 5 && (
                        <div className="text-xs text-yellow-600">... y {importResult.warnings.length - 5} advertencias más</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No hay advertencias</p>
                  )}
                </div>
              </div>

              {/* Lista de errores */}
              {importResult.errors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">❌ Errores Encontrados:</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-3">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="border-b border-red-200 pb-2 last:border-b-0">
                          <div className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-red-800">
                              {error.row > 0 && <span className="font-medium">Fila {error.row}: </span>}
                              {error.field && <span className="font-medium">[{error.field}] </span>}
                              {error.reason}
                            </div>
                          </div>
                          {error.data && Object.keys(error.data).length > 0 && (
                            <div className="mt-1 ml-6 text-xs text-red-600 font-mono">{JSON.stringify(error.data)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de éxito */}
              {importResult.success > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div className="text-sm text-green-800">
                      <p className="font-medium">¡Importación completada exitosamente!</p>
                      <p>
                        Se procesaron <strong>{importResult.success}</strong> carnets correctamente.
                      </p>
                      <p>
                        Creados: <strong>{importResult.created}</strong> | Actualizados: <strong>{importResult.updated}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowResultModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Ver Carnets Importados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de acciones (baja/suspensión/reactivación) */}
      {showActionModal && carnetForAction && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowActionModal(false)} />

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                {actionType === 'baja' && <UserX className="h-5 w-5 mr-2 text-red-600" />}
                {actionType === 'suspension' && <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />}
                {actionType === 'reactivacion' && <UserCheck className="h-5 w-5 mr-2 text-green-600" />}
                {actionType === 'baja' && 'Dar de Baja Carnet'}
                {actionType === 'suspension' && 'Suspender Carnet'}
                {actionType === 'reactivacion' && 'Reactivar Carnet'}
              </h2>
              <button onClick={() => setShowActionModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  ¿Está seguro que desea {actionType === 'baja' ? 'dar de baja' : actionType === 'suspension' ? 'suspender' : 'reactivar'} el carnet de:
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">{carnetForAction.titular.nombreCompleto}</p>
                  <p className="text-sm text-gray-500">Carnet: {carnetForAction.numeroCarnet}</p>
                  <p className="text-sm text-gray-500">Lote: {carnetForAction.lote}</p>
                </div>
              </div>

              {actionType !== 'reactivacion' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo {actionType === 'baja' ? 'de la baja' : 'de la suspensión'} *
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                    placeholder={`Ingrese el motivo ${actionType === 'baja' ? 'de la baja' : 'de la suspensión'}...`}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowActionModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleCarnetAction}
                  disabled={actionType !== 'reactivacion' && !actionReason.trim()}
                  className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === 'baja'
                      ? 'bg-red-600 hover:bg-red-700'
                      : actionType === 'suspension'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Confirmar {actionType === 'baja' ? 'Baja' : actionType === 'suspension' ? 'Suspensión' : 'Reactivación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sincronización */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSyncModal(false)} />

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-blue-600" />
                Resultado de Sincronización
              </h2>
              <button onClick={() => setShowSyncModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div
                className={`p-4 rounded-lg ${
                  syncMessage.includes('Error') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                }`}
              >
                <p className={`text-sm ${syncMessage.includes('Error') ? 'text-red-800' : 'text-green-800'}`}>{syncMessage}</p>
              </div>

              <div className="flex justify-end mt-4">
                <button onClick={() => setShowSyncModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Carnets;
