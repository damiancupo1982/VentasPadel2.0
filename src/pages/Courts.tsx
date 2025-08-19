// Courts.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Play, 
  Square, 
  Receipt,
  X,
  Save,
  Download,
  DollarSign,
  Package,
  CreditCard,
  FileText,
  Banknote,
  Trash2,
  Edit3,
  Check,
  Settings,
  Image,
  Camera
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { addCourtBill, updateAdminTurn } from '../utils/db';
import { Product } from '../types';

// Interfaces locales
interface Player { name: string; lote: string; telefono: string; }
interface Reservation {
  id: string; cancha: string; numeroLote: string; nombreCliente: string;
  horarioInicio: string; horarioFin: string; fecha: string; jugadores: Player[];
  duracion: number; createdAt: string;
}
interface FacturaItem {
  id: string; nombre: string; precio: number; cantidad: number; subtotal: number;
  tipo: 'kiosco' | 'personalizado' | 'servicio'; editable?: boolean;
}
interface FacturaAbierta {
  id: string; reservaId: string; cancha: string; cliente: string; numeroLote: string;
  fecha: string; horarioInicio: string; horarioFin: string; items: FacturaItem[];
  total: number; fechaCreacion: string;
}
interface ServicioAdicional { id: string; nombre: string; precio: number; categoria: string; }
interface CourtConfig { 
  id: string; 
  name: string; 
  color: string; 
  image?: string;
  isActive: boolean;
  createdAt: string;
}

const Courts: React.FC = () => {
  const { activeTurn, setActiveTurn, products, refreshData } = useStore();

  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [facturasAbiertas, setFacturasAbiertas] = useState<FacturaAbierta[]>([]);
  const [courtsConfig, setCourtsConfig] = useState<CourtConfig[]>([
    { 
      id: 'silicon', 
      name: 'Silicon', 
      color: 'bg-blue-500',
      image: 'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=400',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    { 
      id: 'remax', 
      name: 'Remax', 
      color: 'bg-green-500',
      image: 'https://images.pexels.com/photos/1263348/pexels-photo-1263348.jpeg?auto=compress&cs=tinysrgb&w=400',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    { 
      id: 'pia', 
      name: 'PIA Rental', 
      color: 'bg-purple-500',
      image: 'https://images.pexels.com/photos/1263349/pexels-photo-1263349.jpeg?auto=compress&cs=tinysrgb&w=400',
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ]);

  const [hydrated, setHydrated] = useState(false);

  const [mostrarFormReserva, setMostrarFormReserva] = useState(false);
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [mostrarFormCancha, setMostrarFormCancha] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaAbierta | null>(null);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [editingCourtName, setEditingCourtName] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'expensa'>('efectivo');

  // Estados para nueva cancha
  const [nuevaCancha, setNuevaCancha] = useState({
    name: '',
    color: 'bg-blue-500',
    image: ''
  });

  const [formReserva, setFormReserva] = useState({
    cancha: '', numeroLote: '', nombreCliente: '',
    horarioInicio: '', horarioFin: '',
    fecha: new Date().toISOString().split('T')[0],
    jugadores: [
      { name: '', lote: '', telefono: '' },
      { name: '', lote: '', telefono: '' },
      { name: '', lote: '', telefono: '' },
      { name: '', lote: '', telefono: '' }
    ]
  });

  const [itemPersonalizado, setItemPersonalizado] = useState({ nombre: '', precio: 0 });

  // pagos combinados (enteros)
  const [montoEfectivo, setMontoEfectivo] = useState(0);
  const [montoTransferencia, setMontoTransferencia] = useState(0);
  const [montoExpensa, setMontoExpensa] = useState(0);
  const totalIngresado = montoEfectivo + montoTransferencia + montoExpensa;

  const serviciosAdicionales: ServicioAdicional[] = [
    { id: 's1', nombre: 'Alquiler de Paletas', precio: 2000, categoria: 'Equipamiento' },
    { id: 's2', nombre: 'Uso de Luz', precio: 3500, categoria: 'Servicios' },
    { id: 's3', nombre: 'Entrada Invitado', precio: 12000, categoria: 'Servicios' },
    { id: 's4', nombre: 'Toallas', precio: 500, categoria: 'Servicios' }
  ];

  const coloresDisponibles = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500'
  ];

  const imagenesDisponibles = [
  'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1263348/pexels-photo-1263348.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1263349/pexels-photo-1263349.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1263350/pexels-photo-1263350.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1263351/pexels-photo-1263351.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://collection.cloudinary.com/df3notxwu/73e72947044d654955cffc600403c634',
  'https://images.pexels.com/photos/1263352/pexels-photo-1263352.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1263353/pexels-photo-1263353.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1263354/pexels-photo-1263354.jpeg?auto=compress&cs=tinysrgb&w=400',
];
  // Persistencia local
  const guardarDatos = () => {
    try {
      localStorage.setItem('reservas-canchas-v2', JSON.stringify(reservas));
      localStorage.setItem('facturas-abiertas-v2', JSON.stringify(facturasAbiertas));
      localStorage.setItem('courts-config-v3', JSON.stringify(courtsConfig));
    } catch (error) {
      console.error('Error al guardar datos:', error);
    }
  };
  const cargarDatos = () => {
    try {
      const reservasGuardadas = localStorage.getItem('reservas-canchas-v2');
      const facturasGuardadas = localStorage.getItem('facturas-abiertas-v2');
      const courtsGuardados = localStorage.getItem('courts-config-v3');
      
      if (reservasGuardadas) setReservas(JSON.parse(reservasGuardadas));
      if (facturasGuardadas) setFacturasAbiertas(JSON.parse(facturasGuardadas));
      if (courtsGuardados) {
        setCourtsConfig(JSON.parse(courtsGuardados));
      } else {
        // Migrar datos antiguos si existen
        const courtsGuardadosV2 = localStorage.getItem('courts-config-v2');
        if (courtsGuardadosV2) {
          const oldCourts = JSON.parse(courtsGuardadosV2);
          const migratedCourts = oldCourts.map((court: any, index: number) => ({
            ...court,
            image: imagenesDisponibles[index] || imagenesDisponibles[0],
            isActive: true,
            createdAt: new Date().toISOString()
          }));
          setCourtsConfig(migratedCourts);
        }
      }
      setHydrated(true);
    } catch (e) {
      setReservas([]); setFacturasAbiertas([]); setHydrated(true);
    }
  };
  useEffect(() => { cargarDatos(); refreshData?.(); }, []);
  useEffect(() => { if (hydrated) guardarDatos(); }, [reservas, facturasAbiertas, courtsConfig, hydrated]);

  // Aux
  const calcularDuracion = (inicio: string, fin: string): number => {
    const inicioDate = new Date(`2000-01-01T${inicio}`);
    const finDate = new Date(`2000-01-01T${fin}`);
    return Math.abs(finDate.getTime() - inicioDate.getTime()) / (1000 * 60);
  };
  const formatearDuracion = (minutos: number): string => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };
  const obtenerReservaActiva = (cancha: string): Reservation | null => {
    const hoy = new Date().toISOString().split('T')[0];
    const ahora = new Date().toTimeString().slice(0, 5);
    return reservas.find(r => r.cancha === cancha && r.fecha === hoy && r.horarioInicio <= ahora && r.horarioFin >= ahora) || null;
  };
  const tieneFacturaAbierta = (cancha: string) => facturasAbiertas.some(f => f.cancha === cancha);

  // Helpers de stock/linea
  const qtyEnFactura = (productId: string): number => {
    if (!facturaSeleccionada) return 0;
    const item = facturaSeleccionada.items.find(i => i.id === productId && i.tipo === 'kiosco');
    return item ? item.cantidad : 0;
  };
  const stockDisponibleActual = (productId: string): number => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return 0;
    return (prod.stock ?? 0) - qtyEnFactura(productId);
  };

  // Crear nueva cancha
  const handleCrearCancha = () => {
    if (!nuevaCancha.name.trim()) {
      alert('El nombre de la cancha es obligatorio');
      return;
    }

    const nuevaCanchaConfig: CourtConfig = {
      id: `court-${Date.now()}`,
      name: nuevaCancha.name.trim(),
      color: nuevaCancha.color,
      image: nuevaCancha.image || imagenesDisponibles[0],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setCourtsConfig(prev => [...prev, nuevaCanchaConfig]);
    setNuevaCancha({ name: '', color: 'bg-blue-500', image: '' });
    setMostrarFormCancha(false);
    alert('Cancha creada exitosamente');
  };

  // Eliminar cancha
  const handleEliminarCancha = (courtId: string) => {
    const court = courtsConfig.find(c => c.id === courtId);
    if (!court) return;

    // Verificar si tiene reservas activas
    const tieneReservas = reservas.some(r => r.cancha === court.name);
    const tieneFacturas = facturasAbiertas.some(f => f.cancha === court.name);

    if (tieneReservas || tieneFacturas) {
      alert('No se puede eliminar la cancha porque tiene reservas o facturas activas');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar la cancha "${court.name}"?`)) {
      setCourtsConfig(prev => prev.filter(c => c.id !== courtId));
      alert('Cancha eliminada exitosamente');
    }
  };

  // Actualizar imagen de cancha
  const handleActualizarImagen = (courtId: string, newImage: string) => {
    setCourtsConfig(prev => prev.map(court => 
      court.id === courtId ? { ...court, image: newImage } : court
    ));
  };

  // Crear reserva
  const handleCrearReserva = () => {
    if (!formReserva.cancha || !formReserva.numeroLote || !formReserva.nombreCliente || 
        !formReserva.horarioInicio || !formReserva.horarioFin) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }
    if (facturasAbiertas.length >= 3) {
      alert('No se pueden crear más reservas. Máximo 3 facturas abiertas simultáneamente.');
      return;
    }
    const duracion = calcularDuracion(formReserva.horarioInicio, formReserva.horarioFin);
    const nuevaReserva: Reservation = {
      id: Date.now().toString(),
      cancha: formReserva.cancha,
      numeroLote: formReserva.numeroLote,
      nombreCliente: formReserva.nombreCliente,
      horarioInicio: formReserva.horarioInicio,
      horarioFin: formReserva.horarioFin,
      fecha: formReserva.fecha,
      duracion,
      jugadores: formReserva.jugadores.filter(j => j.name.trim() !== ''),
      createdAt: new Date().toISOString()
    };
    setReservas(prev => [...prev, nuevaReserva]);
    const nuevaFactura: FacturaAbierta = {
      id: Date.now().toString(),
      reservaId: nuevaReserva.id,
      cancha: nuevaReserva.cancha,
      cliente: nuevaReserva.nombreCliente,
      numeroLote: nuevaReserva.numeroLote,
      fecha: nuevaReserva.fecha,
      horarioInicio: nuevaReserva.horarioInicio,
      horarioFin: nuevaReserva.horarioFin,
      items: [],
      total: 0,
      fechaCreacion: new Date().toISOString()
    };
    setFacturasAbiertas(prev => [...prev, nuevaFactura]);
    setFormReserva({
      cancha: '', numeroLote: '', nombreCliente: '',
      horarioInicio: '', horarioFin: '',
      fecha: new Date().toISOString().split('T')[0],
      jugadores: [
        { name: '', lote: '', telefono: '' },
        { name: '', lote: '', telefono: '' },
        { name: '', lote: '', telefono: '' },
        { name: '', lote: '', telefono: '' }
      ]
    });
    setMostrarFormReserva(false);
    alert('Reserva creada exitosamente. Factura abierta generada.');
  };

  // Agregar producto del kiosco con tope por stock
  const handleAgregarItemKiosco = (product: Product) => {
    if (!facturaSeleccionada) return;

    const disponible = stockDisponibleActual(product.id);
    if (disponible <= 0) {
      alert(`Sin stock disponible para "${product.name}".`);
      return;
    }

    const itemExistente = facturaSeleccionada.items.find(i => i.id === product.id);
    let nuevosItems: FacturaItem[];

    if (itemExistente) {
      // si ya no hay más disponible, no incrementamos
      if (itemExistente.cantidad >= (products.find(p => p.id === product.id)?.stock ?? 0)) {
        alert(`No podés vender más de ${products.find(p => p.id === product.id)?.stock ?? 0} u. de "${product.name}".`);
        return;
      }
      nuevosItems = facturaSeleccionada.items.map(i => 
        i.id === product.id 
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio }
          : i
      );
    } else {
      const nuevoItem: FacturaItem = {
        id: product.id,
        nombre: product.name,
        precio: product.price,
        cantidad: 1,
        subtotal: product.price,
        tipo: 'kiosco'
      };
      nuevosItems = [...facturaSeleccionada.items, nuevoItem];
    }

    const nuevoTotal = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
    const facturaActualizada = { ...facturaSeleccionada, items: nuevosItems, total: nuevoTotal };
    setFacturaSeleccionada(facturaActualizada);
    setFacturasAbiertas(prev => prev.map(f => f.id === facturaSeleccionada.id ? facturaActualizada : f));
  };

  const handleAgregarItemPersonalizado = () => {
    if (!facturaSeleccionada || !itemPersonalizado.nombre || itemPersonalizado.precio <= 0) return;
    const precioEntero = Math.round(itemPersonalizado.precio);
    const nuevoItem: FacturaItem = {
      id: `custom-${Date.now()}`,
      nombre: itemPersonalizado.nombre,
      precio: precioEntero,
      cantidad: 1,
      subtotal: precioEntero,
      tipo: 'personalizado'
    };
    const nuevosItems = [...facturaSeleccionada.items, nuevoItem];
    const nuevoTotal = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
    const facturaActualizada = { ...facturaSeleccionada, items: nuevosItems, total: nuevoTotal };
    setFacturaSeleccionada(facturaActualizada);
    setFacturasAbiertas(prev => prev.map(f => f.id === facturaSeleccionada.id ? facturaActualizada : f));
    setItemPersonalizado({ nombre: '', precio: 0 });
  };

  const handleAgregarServicio = (servicio: ServicioAdicional) => {
    if (!facturaSeleccionada) return;
    const nuevoItem: FacturaItem = {
      id: servicio.id, nombre: servicio.nombre, precio: servicio.precio,
      cantidad: 1, subtotal: servicio.precio, tipo: 'servicio', editable: true
    };
    const nuevosItems = [...facturaSeleccionada.items, nuevoItem];
    const nuevoTotal = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
    const facturaActualizada = { ...facturaSeleccionada, items: nuevosItems, total: nuevoTotal };
    setFacturaSeleccionada(facturaActualizada);
    setFacturasAbiertas(prev => prev.map(f => f.id === facturaSeleccionada.id ? facturaActualizada : f));
  };

  // Validación de stock justo antes de cerrar (por si cambió mientras tanto)
  const validarStockAntesDeCerrar = (): string[] => {
    if (!facturaSeleccionada) return [];
    const errores: string[] = [];
    for (const item of facturaSeleccionada.items) {
      if (item.tipo !== 'kiosco') continue;
      const prod = products.find(p => p.id === item.id);
      if (!prod) {
        errores.push(`El producto "${item.nombre}" ya no existe.`);
        continue;
      }
      if ((prod.stock ?? 0) < item.cantidad) {
        errores.push(`"${prod.name}": stock ${prod.stock ?? 0} < cantidad en factura ${item.cantidad}`);
      }
    }
    return errores;
  };

  const handleCerrarFactura = async () => {
    if (!facturaSeleccionada) return;

    if (totalIngresado !== facturaSeleccionada.total) {
      alert('Los montos ingresados deben coincidir con el total de la factura');
      return;
    }

    // validar stock contra estado actual
    const erroresStock = validarStockAntesDeCerrar();
    if (erroresStock.length > 0) {
      alert(`No se puede cerrar la factura por falta de stock en:\n• ${erroresStock.join('\n• ')}`);
      return;
    }

    if (!activeTurn) {
      alert('No hay un turno activo. No se puede cerrar la factura.');
      return;
    }

    try {
      // método de pago/combinado
      let finalPaymentMethod: 'efectivo' | 'transferencia' | 'expensa' | 'combinado';
      let paymentBreakdown: { efectivo: number; transferencia: number; expensa: number; } | undefined;
      const metodosUsados = [
        montoEfectivo > 0 ? 'efectivo' : null,
        montoTransferencia > 0 ? 'transferencia' : null,
        montoExpensa > 0 ? 'expensa' : null
      ].filter(Boolean);
      if (metodosUsados.length > 1) {
        finalPaymentMethod = 'combinado';
        paymentBreakdown = { efectivo: montoEfectivo, transferencia: montoTransferencia, expensa: montoExpensa };
      } else {
        if (montoEfectivo > 0) finalPaymentMethod = 'efectivo';
        else if (montoTransferencia > 0) finalPaymentMethod = 'transferencia';
        else finalPaymentMethod = 'expensa';
        paymentBreakdown = undefined;
      }

      const courtBill = await addCourtBill({
        reservationId: facturaSeleccionada.reservaId,
        courtId: facturaSeleccionada.cancha,
        courtName: facturaSeleccionada.cancha,
        customerName: facturaSeleccionada.cliente,
        lotNumber: facturaSeleccionada.numeroLote,
        startTime: facturaSeleccionada.horarioInicio,
        endTime: facturaSeleccionada.horarioFin,
        startDate: facturaSeleccionada.fecha,
        endDate: facturaSeleccionada.fecha,
        players: [],
        turnRate: 0,
        lightUsage: false,
        lightCost: 0,
        racketRental: false,
        racketCost: 0,
        services: facturaSeleccionada.items
          .filter(item => item.tipo === 'servicio')
          .map(item => ({
            service: { id: item.id, name: item.nombre, price: item.precio, category: 'other' as const },
            quantity: item.cantidad,
            subtotal: item.subtotal
          })),
        kioskItems: facturaSeleccionada.items
          .filter(item => item.tipo === 'kiosco' || item.tipo === 'personalizado')
          .map(item => {
            const prod: Product | undefined = item.tipo === 'kiosco' ? products.find(p => p.id === item.id) : undefined;
            return {
              product: {
                id: prod ? prod.id : item.id,
                name: prod ? prod.name : item.nombre,
                category: prod ? prod.category : (item.tipo === 'kiosco' ? 'Kiosco' : 'Personalizado'),
                price: prod ? prod.price : item.precio,
                stock: prod ? prod.stock : 1,
                createdAt: prod ? (prod as any).createdAt : new Date().toISOString(),
                updatedAt: prod ? (prod as any).updatedAt : new Date().toISOString()
              },
              quantity: item.cantidad,
              subtotal: item.subtotal
            };
          }),
        subtotal: facturaSeleccionada.total,
        total: facturaSeleccionada.total,
        paymentMethod: finalPaymentMethod,
        paymentBreakdown
      });

      // actualizar totales de turno
      const updatedCourtBills = [...activeTurn.courtBills, courtBill];
      let efectivoAgregar = 0, transferenciaAgregar = 0, expensaAgregar = 0;
      if (paymentBreakdown) {
        efectivoAgregar = paymentBreakdown.efectivo;
        transferenciaAgregar = paymentBreakdown.transferencia;
        expensaAgregar = paymentBreakdown.expensa;
      } else {
        if (finalPaymentMethod === 'efectivo') efectivoAgregar = facturaSeleccionada.total;
        else if (finalPaymentMethod === 'transferencia') transferenciaAgregar = facturaSeleccionada.total;
        else if (finalPaymentMethod === 'expensa') expensaAgregar = facturaSeleccionada.total;
      }
      const newTotals = {
        efectivo: activeTurn.totals.efectivo + efectivoAgregar,
        transferencia: activeTurn.totals.transferencia + transferenciaAgregar,
        expensa: activeTurn.totals.expensa + expensaAgregar,
        total: activeTurn.totals.total + facturaSeleccionada.total
      };
      const updatedTurn = await updateAdminTurn(activeTurn.id, { courtBills: updatedCourtBills, totals: newTotals });
      if (updatedTurn) setActiveTurn(updatedTurn);

      // cerrar factura abierta
      setFacturasAbiertas(prev => prev.filter(f => f.id !== facturaSeleccionada.id));
      setFacturaSeleccionada(null);
      setMostrarFactura(false);
      setMetodoPago('efectivo');
      setMontoEfectivo(0); setMontoTransferencia(0); setMontoExpensa(0);

      alert('Factura cerrada exitosamente y registrada en el arqueo de caja');
      refreshData?.(); // ver stock actualizado
    } catch (error) {
      console.error('Error al cerrar factura:', error);
      alert('Error al cerrar la factura');
    }
  };

  const handleEliminarItem = (itemId: string) => {
    if (!facturaSeleccionada) return;
    const nuevosItems = facturaSeleccionada.items.filter(item => item.id !== itemId);
    const nuevoTotal = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
    const facturaActualizada = { ...facturaSeleccionada, items: nuevosItems, total: nuevoTotal };
    setFacturaSeleccionada(facturaActualizada);
    setFacturasAbiertas(prev => prev.map(f => f.id === facturaSeleccionada.id ? facturaActualizada : f));
  };

  const handleEditarPrecio = (itemId: string, nuevoPrecio: number) => {
    if (!facturaSeleccionada) return;
    const precioEntero = Math.max(0, Math.round(nuevoPrecio));
    const nuevosItems = facturaSeleccionada.items.map(item => {
      if (item.id === itemId) {
        const nuevoSubtotal = precioEntero * item.cantidad;
        return { ...item, precio: precioEntero, subtotal: nuevoSubtotal };
      }
      return item;
    });
    const nuevoTotal = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);
    const facturaActualizada = { ...facturaSeleccionada, items: nuevosItems, total: nuevoTotal };
    setFacturaSeleccionada(facturaActualizada);
    setFacturasAbiertas(prev => prev.map(f => f.id === facturaSeleccionada.id ? facturaActualizada : f));
  };

  const handleAbrirFactura = (factura: FacturaAbierta) => {
    let itemsActualizados = [...factura.items];
    if (!itemsActualizados.some(item => item.nombre === 'Uso de Luz')) {
      itemsActualizados.push({ id: 's2', nombre: 'Uso de Luz', precio: 3500, cantidad: 1, subtotal: 3500, tipo: 'servicio', editable: true });
    }
    if (!itemsActualizados.some(item => item.nombre === 'Entrada Invitado')) {
      itemsActualizados.push({ id: 's3', nombre: 'Entrada Invitado', precio: 12000, cantidad: 1, subtotal: 12000, tipo: 'servicio', editable: true });
    }
    const nuevoTotal = itemsActualizados.reduce((sum, item) => sum + item.subtotal, 0);
    const facturaActualizada = { ...factura, items: itemsActualizados, total: nuevoTotal };
    setFacturaSeleccionada(facturaActualizada);
    setFacturasAbiertas(prev => prev.map(f => f.id === factura.id ? facturaActualizada : f));
    setMostrarFactura(true);
  };

  const handleEditCourtName = (courtId: string, newName: string) => {
    const updatedCourts = courtsConfig.map(court => court.id === courtId ? { ...court, name: newName } : court);
    setCourtsConfig(updatedCourts);
    setEditingCourtId(null);
    setEditingCourtName('');
  };

  const exportarFacturasCSV = () => {
    if (facturasAbiertas.length === 0) { alert('No hay facturas para exportar'); return; }
    const headers = ['Fecha', 'Cancha', 'Cliente', 'Lote', 'Horario', 'Items', 'Total'];
    const rows = facturasAbiertas.map(f => [
      f.fecha, f.cancha, f.cliente, f.numeroLote, `${f.horarioInicio}-${f.horarioFin}`, f.items.length, f.total
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url; link.download = `facturas-abiertas-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'efectivo': return <Banknote className="h-4 w-4 text-green-600" />;
      case 'transferencia': return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'expensa': return <FileText className="h-4 w-4 text-purple-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  // Productos visibles: reales con stock > 0 (visual). Luego el botón respeta el stock restante en la factura.
  const kioskProducts = products.filter(p => (p.stock ?? 0) > 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Gestión de Canchas</h1>
          <p className="mt-2 text-sm text-gray-700">Sistema de reservas y facturación con gestión de canchas</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-2">
          <button onClick={exportarFacturasCSV} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </button>
          <button onClick={() => setMostrarFormCancha(true)} className="inline-flex items-center justify-center rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100">
            <Settings className="h-4 w-4 mr-2" /> Gestionar Canchas
          </button>
          <button onClick={() => setMostrarFormReserva(true)} className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" /> Nueva Reserva
          </button>
        </div>
      </div>

      {/* Estado canchas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {courtsConfig.filter(court => court.isActive).map((court) => {
          const reservaActiva = obtenerReservaActiva(court.name);
          const facturaAbierta = facturasAbiertas.find(f => f.cancha === court.name);
          const tieneFactura = tieneFacturaAbierta(court.name);

          return (
            <div key={court.id} className={`rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl overflow-hidden ${
              tieneFactura ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100' :
              reservaActiva ? 'border-red-400 bg-gradient-to-br from-red-50 to-red-100' :
              'border-gray-200 bg-gradient-to-br from-white to-gray-50'
            }`}>
              {/* Imagen de la cancha */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={court.image || imagenesDisponibles[0]} 
                  alt={court.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = imagenesDisponibles[0];
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute top-4 right-4">
                  <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    tieneFactura ? 'bg-yellow-200 text-yellow-800' :
                    reservaActiva ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                  }`}>
                    {tieneFactura ? (<><Receipt className="h-4 w-4 mr-1" /> Factura Abierta</>) :
                     reservaActiva ? (<><Play className="h-4 w-4 mr-1" /> Ocupada</>) :
                                     (<><Square className="h-4 w-4 mr-1" /> Libre</>)}
                  </div>
                </div>
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-4 h-4 rounded-full ${court.color}`}></div>
                    <h3 className="text-xl font-bold text-white drop-shadow-lg">{court.name}</h3>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {reservaActiva ? (
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-700 bg-white bg-opacity-50 rounded-lg p-2">
                      <User className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-medium">{reservaActiva.nombreCliente}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700 bg-white bg-opacity-50 rounded-lg p-2">
                      <Clock className="h-4 w-4 mr-2 text-green-600" />
                      <span>{reservaActiva.horarioInicio} - {reservaActiva.horarioFin}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700 bg-white bg-opacity-50 rounded-lg p-2">
                      <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                      <span>Duración: {formatearDuracion(reservaActiva.duracion)}</span>
                    </div>
                    {facturaAbierta && (
                      <button onClick={() => handleAbrirFactura(facturaAbierta)} className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md">
                        <Receipt className="h-4 w-4 mr-2" /> Gestionar Factura (${facturaAbierta.total})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className={`w-16 h-16 ${court.color} rounded-full flex items-center justify-center mx-auto mb-4 opacity-20`}>
                      <Square className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600 mb-4 font-medium">Cancha disponible</p>
                    <button onClick={() => { setFormReserva({ ...formReserva, cancha: court.name }); setMostrarFormReserva(true); }} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md">
                      <Plus className="h-4 w-4 mr-2" /> Reservar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Facturas abiertas */}
      {facturasAbiertas.length > 0 && (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <h3 className="text-lg leading-6 font-semibold text-gray-900 flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-yellow-600" />
              Facturas Abiertas ({facturasAbiertas.length}/3)
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {facturasAbiertas.map((factura) => (
              <li key={factura.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                        <Receipt className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-semibold text-gray-900">
                          {factura.cancha} - {factura.cliente}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Abierta
                        </span>
                      </div>
                      <div className="flex items-center mt-1 space-x-4">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-sm text-gray-600">Total: ${factura.total}</p>
                        </div>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-sm text-gray-600">{factura.items.length} items</p>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-sm text-gray-600">{factura.horarioInicio} - {factura.horarioFin}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleAbrirFactura(factura)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md transition-all">
                    <Receipt className="h-4 w-4 mr-1" /> Gestionar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal de gestión de canchas */}
      {mostrarFormCancha && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMostrarFormCancha(false)} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Gestión de Canchas
              </h2>
              <button onClick={() => setMostrarFormCancha(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Formulario para nueva cancha */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-green-900 mb-4 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Nueva Cancha
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Cancha *</label>
                    <input
                      type="text"
                      value={nuevaCancha.name}
                      onChange={(e) => setNuevaCancha({ ...nuevaCancha, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ej: Cancha Norte"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color de Identificación</label>
                    <div className="flex flex-wrap gap-2">
                      {coloresDisponibles.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNuevaCancha({ ...nuevaCancha, color })}
                          className={`w-8 h-8 rounded-full ${color} border-2 ${
                            nuevaCancha.color === color ? 'border-gray-800' : 'border-gray-300'
                          } hover:scale-110 transition-transform`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de la Cancha</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {imagenesDisponibles.map((imagen, index) => (
                      <div
                        key={index}
                        onClick={() => setNuevaCancha({ ...nuevaCancha, image: imagen })}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                          nuevaCancha.image === imagen ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-300'
                        }`}
                      >
                        <img 
                          src={imagen} 
                          alt={`Opción ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        {nuevaCancha.image === imagen && (
                          <div className="absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center">
                            <Check className="h-6 w-6 text-green-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">O ingresa URL personalizada:</label>
                    <input
                      type="url"
                      value={nuevaCancha.image}
                      onChange={(e) => setNuevaCancha({ ...nuevaCancha, image: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setNuevaCancha({ name: '', color: 'bg-blue-500', image: '' })}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={handleCrearCancha}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Cancha
                  </button>
                </div>
              </div>

              {/* Lista de canchas existentes */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="h-5 w-5 mr-2 text-gray-600" />
                  Canchas Existentes ({courtsConfig.filter(c => c.isActive).length})
                </h3>
                
                <div className="space-y-4">
                  {courtsConfig.filter(c => c.isActive).map((court) => (
                    <div key={court.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={court.image || imagenesDisponibles[0]} 
                          alt={court.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = imagenesDisponibles[0];
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full ${court.color}`}></div>
                          <div>
                            <h4 className="font-medium text-gray-900">{court.name}</h4>
                            <p className="text-sm text-gray-500">Creada: {new Date(court.createdAt).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingCourtId(court.id);
                            setEditingCourtName(court.name);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                          title="Editar nombre"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        
                        <div className="relative group">
                          <button className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors" title="Cambiar imagen">
                            <Camera className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                            <div className="p-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Seleccionar imagen:</p>
                              <div className="grid grid-cols-3 gap-2">
                                {imagenesDisponibles.slice(0, 6).map((imagen, index) => (
                                  <img
                                    key={index}
                                    src={imagen}
                                    alt={`Opción ${index + 1}`}
                                    onClick={() => handleActualizarImagen(court.id, imagen)}
                                    className="w-full h-12 object-cover rounded cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleEliminarCancha(court.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                          title="Eliminar cancha"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de nueva reserva */}
      {mostrarFormReserva && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMostrarFormReserva(false)} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Nueva Reserva</h2>
              <button onClick={() => setMostrarFormReserva(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cancha *</label>
                  <select required value={formReserva.cancha} onChange={(e) => setFormReserva({ ...formReserva, cancha: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Seleccionar cancha</option>
                    {courtsConfig.filter(c => c.isActive).map(court => (<option key={court.id} value={court.name}>{court.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input type="date" value={formReserva.fecha} onChange={(e) => setFormReserva({ ...formReserva, fecha: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número de Lote *</label>
                  <input type="text" required value={formReserva.numeroLote} onChange={(e) => setFormReserva({ ...formReserva, numeroLote: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: 123" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
                  <input type="text" required value={formReserva.nombreCliente} onChange={(e) => setFormReserva({ ...formReserva, nombreCliente: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Nombre completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horario Inicio *</label>
                  <input type="time" required value={formReserva.horarioInicio} onChange={(e) => setFormReserva({ ...formReserva, horarioInicio: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horario Fin *</label>
                  <input type="time" required value={formReserva.horarioFin} onChange={(e) => setFormReserva({ ...formReserva, horarioFin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {formReserva.horarioInicio && formReserva.horarioFin && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-medium">
                      Duración: {formatearDuracion(calcularDuracion(formReserva.horarioInicio, formReserva.horarioFin))}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Jugadores Adicionales (Opcional)</h3>
                <div className="space-y-4">
                  {formReserva.jugadores.map((jugador, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                      <input type="text" placeholder="Nombre" value={jugador.name} onChange={(e) => { const js = [...formReserva.jugadores]; js[index].name = e.target.value; setFormReserva({ ...formReserva, jugadores: js }); }} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input type="text" placeholder="Lote" value={jugador.lote} onChange={(e) => { const js = [...formReserva.jugadores]; js[index].lote = e.target.value; setFormReserva({ ...formReserva, jugadores: js }); }} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input type="tel" placeholder="Teléfono" value={jugador.telefono} onChange={(e) => { const js = [...formReserva.jugadores]; js[index].telefono = e.target.value; setFormReserva({ ...formReserva, jugadores: js }); }} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button onClick={() => setMostrarFormReserva(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Cancelar</button>
                <button onClick={handleCrearReserva} disabled={facturasAbiertas.length >= 3} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Save className="h-4 w-4 mr-2" /> Crear Reserva
                </button>
              </div>

              {facturasAbiertas.length >= 3 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">No se pueden crear más reservas. Máximo 3 facturas abiertas simultáneamente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestión de factura */}
      {mostrarFactura && facturaSeleccionada && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMostrarFactura(false)} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Factura - {facturaSeleccionada.cancha} - {facturaSeleccionada.cliente}</h2>
              <button onClick={() => setMostrarFactura(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Productos del Kiosco */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos del Kiosco</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {kioskProducts.map(product => {
                      const qtyActual = qtyEnFactura(product.id);
                      const restante = Math.max(0, (product.stock ?? 0) - qtyActual);
                      const disabled = restante <= 0;
                      return (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">
                              ${product.price} · {product.category} · Stock: {product.stock} · Disp: {restante}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAgregarItemKiosco(product)}
                            className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                            disabled={disabled}
                            title={disabled ? 'Sin disponibilidad' : 'Agregar'}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                    {kioskProducts.length === 0 && (
                      <div className="text-sm text-gray-500 p-3 text-center">No hay productos con stock para mostrar.</div>
                    )}
                  </div>

                  {/* Item personalizado */}
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Agregar Item Personalizado</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input type="text" placeholder="Nombre del item" value={itemPersonalizado.nombre} onChange={(e) => setItemPersonalizado({ ...itemPersonalizado, nombre: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                      <input type="number" placeholder="Precio" value={itemPersonalizado.precio} onChange={(e) => setItemPersonalizado({ ...itemPersonalizado, precio: parseInt(e.target.value || '0', 10) })} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" min={0} step={1} />
                    </div>
                    <button onClick={handleAgregarItemPersonalizado} className="w-full bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700 transition-colors">
                      Agregar Item Personalizado
                    </button>
                  </div>

                  {/* Servicios adicionales */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Servicios Adicionales</h4>
                    <div className="space-y-2">
                      {serviciosAdicionales.map(servicio => (
                        <div key={servicio.id} className="flex items-center justify-between p-2 bg-white rounded">
                          <div>
                            <p className="font-medium text-gray-900">{servicio.nombre}</p>
                            <p className="text-sm text-gray-500">${servicio.precio}</p>
                          </div>
                          <button onClick={() => handleAgregarServicio(servicio)} className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desglose de Pago */}
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Desglose de Pago</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">💵 Monto en Efectivo</label>
                        <input type="number" min={0} step={1} value={montoEfectivo} onChange={(e) => setMontoEfectivo(parseInt(e.target.value || '0', 10))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">💳 Monto en Transferencia</label>
                        <input type="number" min={0} step={1} value={montoTransferencia} onChange={(e) => setMontoTransferencia(parseInt(e.target.value || '0', 10))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">📄 Monto en Expensa</label>
                        <input type="number" min={0} step={1} value={montoExpensa} onChange={(e) => setMontoExpensa(parseInt(e.target.value || '0', 10))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="0" />
                      </div>
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Total ingresado:</span>
                          <span className={`font-bold ${ totalIngresado === facturaSeleccionada.total ? 'text-green-600' : 'text-red-600' }`}>${totalIngresado}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total requerido:</span>
                          <span className="font-bold text-gray-900">${facturaSeleccionada.total}</span>
                        </div>
                        {totalIngresado !== facturaSeleccionada.total && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            ⚠️ Los montos ingresados no coinciden con el total de la factura
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items de la factura */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Items en la Factura</h3>
                  {facturaSeleccionada.items.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay items en la factura</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {facturaSeleccionada.items.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.nombre}</p>
                            <div className="flex items-center space-x-2">
                              {item.editable ? (
                                <input type="number" value={item.precio} onChange={(e) => handleEditarPrecio(item.id, parseInt(e.target.value || '0', 10))} className="w-20 px-2 py-1 text-sm border border-gray-300 rounded" min={0} step={1} />
                              ) : (
                                <span className="text-sm text-gray-500">${item.precio}</span>
                              )}
                              <span className="text-sm text-gray-500">x {item.cantidad} = ${item.subtotal}</span>
                              {item.tipo === 'kiosco' && (
                                <span className="text-xs text-gray-500 ml-2">
                                  Disp: {Math.max(0, (products.find(p => p.id === item.id)?.stock ?? 0) - item.cantidad)}
                                </span>
                              )}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              item.tipo === 'kiosco' ? 'bg-green-100 text-green-800' :
                              item.tipo === 'servicio' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>{item.tipo}</span>
                          </div>
                          <button onClick={() => handleEliminarItem(item.id)} className="text-red-600 hover:text-red-800 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-green-600">${facturaSeleccionada.total}</span>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['efectivo', 'transferencia', 'expensa'] as const).map((method) => (
                          <label key={method} className="flex items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input type="radio" name="metodoPago" value={method} checked={metodoPago === method} onChange={(e) => setMetodoPago(e.target.value as any)} className="mr-2" />
                            <div className="flex items-center">
                              {getPaymentIcon(method)}
                              <span className="text-sm capitalize ml-1">{method}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <button onClick={handleCerrarFactura} disabled={totalIngresado !== facturaSeleccionada.total} className={`w-full py-3 rounded-md transition-colors font-medium ${ totalIngresado !== facturaSeleccionada.total ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700' }`}>
                      Cerrar Factura
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de nombre de cancha */}
      {editingCourtId && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setEditingCourtId(null)} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Editar Nombre de Cancha</h2>
              <button onClick={() => setEditingCourtId(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nuevo nombre</label>
                <input
                  type="text"
                  value={editingCourtName}
                  onChange={(e) => setEditingCourtName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingCourtId(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleEditCourtName(editingCourtId, editingCourtName)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courts;