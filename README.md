# 🏓 Villanueva Pádel - Sistema de Gestión Integral

Sistema completo de gestión para complejo de canchas de pádel con kiosco integrado, desarrollado en React + TypeScript con backup automático en la nube.

## 📋 Descripción General

**Villanueva Pádel** es una aplicación web progresiva (PWA) diseñada para la gestión integral de un complejo deportivo que incluye:
- 🏓 **3 canchas de pádel** para alquiler (SILICON, REMAX, PHIA RENTAL)
- 🛒 **Kiosco integrado** con venta de productos
- 👥 **Sistema de carnets** para socios con importación masiva
- 📦 **Control de inventario** con sistema de semáforo
- 📊 **Dashboard ejecutivo** con analytics avanzados
- ⏰ **Gestión de turnos** administrativos
- 💼 **Arqueo de caja** y reportes financieros

## 🎯 Estado del Proyecto

| Categoría | Completado | Porcentaje |
|-----------|------------|------------|
| ✅ **Funcionalidades Core** | 43/48 | **89.6%** |
| 🔄 **En Desarrollo** | 4/48 | **8.3%** |
| ❌ **Pendientes** | 1/48 | **2.1%** |

### **🚀 Funcionalidades Principales Completadas**
- ✅ Sistema de ventas completo con carrito
- ✅ Gestión de canchas y servicios adicionales
- ✅ Control de inventario con alertas automáticas
- ✅ Dashboard ejecutivo con KPIs y proyecciones
- ✅ Historial completo de transacciones
- ✅ Arqueo de caja y cierre de turnos

## 🚀 Tecnologías Utilizadas

### **Frontend & Core**
- **React 18** - Framework principal
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Iconografía moderna
- **React Router DOM** - Navegación SPA

### **Estado y Persistencia**
- **Zustand** - Gestión de estado global
- **IndexedDB** - Base de datos cliente principal
- **localStorage** - Fallback automático
- **idb-keyval** - Wrapper para IndexedDB

### **Reportes y Exportación**
- **CSV Export** - Exportación de datos
- **jsPDF** - Generación de PDFs
- **jsPDF-autotable** - Tablas en PDF

### **PWA y Offline**
- **Vite PWA Plugin** - Service Worker
- **Workbox** - Estrategias de cache
- **Funcionamiento offline** completo

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    VILLANUEVA PÁDEL                         │
├─────────────────────────────────────────────────────────────┤
│  🔐 AUTENTICACIÓN                                           │
│  ├── Usuario Clásico (Ventas, Canchas, Carnets, Turno)     │
│  └── Administrador (Acceso completo + Dashboard + Backup)   │
├─────────────────────────────────────────────────────────────┤
│  📱 MÓDULOS PRINCIPALES                                     │
│  ├── 🛒 Sistema de Ventas (Kiosco)                         │
│  ├── 🏓 Gestión de Canchas y Servicios                     │
│  ├── 👥 Carnets de Socios (Individual/Familiar)            │
│  ├── 📦 Control de Inventario (Semáforo de Stock)          │
│  ├── ⏰ Gestión de Turnos Administrativos                   │
│  ├── 📊 Dashboard Ejecutivo (KPIs + Analytics)             │
│  ├── 🧾 Historial de Transacciones                         │
│  └── ☁️ Backup Automático (Supabase)                       │
├─────────────────────────────────────────────────────────────┤
│  💾 PERSISTENCIA HÍBRIDA                                   │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Funcionalidades Detalladas

### 🛒 **Sistema de Ventas (Kiosco)**
- **Catálogo dinámico** con categorías (Bebidas, Snacks, Deportes)
- **Carrito inteligente** con control de stock en tiempo real
- **Métodos de pago**: Efectivo, Transferencia, Expensa, **Combinado**
- **Recibos automáticos** (formato: `VP-YYYY-NNNNNN`)
- **Asociación a canchas** para ventas durante partidos
- **Datos de cliente** opcionales (nombre, lote)
- **Sonidos de confirmación** para mejor UX

### 🏓 **Gestión de Canchas**
**Canchas configuradas:**
- 🟢 **SILICON** (Cancha 1)
- 🔵 **REMAX** (Cancha 2)  
- 🟣 **PHIA RENTAL** (Cancha 3)

**Servicios adicionales:**
- 🏓 Alquiler de paletas ($2000)
- 💡 Uso de luz nocturna ($1500)
- 👤 Entrada para invitados ($1000)
- 🏃 Toallas de cortesía ($500)
- ⚽ Tubo de pelotas ($800)

**Funcionalidades:**
- ✅ Facturación integrada con kiosco
- ✅ Cálculo automático de tiempo de juego
- ✅ Servicios adicionales configurables
- ✅ Pagos combinados soportados

### 👥 **Carnets de Socios**
**Tipos soportados:**
- 👤 **Individual**: 1 titular
- 👨‍👩‍👧‍👦 **Familiar**: Hasta 5 miembros (Titular + Familiar 1-3 + Adherente)

**Funcionalidades avanzadas:**
- ✅ **Importación masiva** desde CSV/XLSX
- ✅ **Validación automática** de DNI y campos
- ✅ **Filtros inteligentes** por barrio, condición, lote
- ✅ **Búsqueda rápida** por número de lote
- ✅ **Sistema de bajas** con motivos y auditoría
- ✅ **Exportación completa** a CSV

**Barrios soportados:**
Santa Catalina, San Isidro Labrador, Santa Clara, San Agustín, San Marco, Santa Teresa, San Rafael, San Gabriel, San Francisco, San Benito, San Juan, Santa Ana, OTRO

### 📦 **Control de Inventario Inteligente**
**Sistema de semáforo automático:**
- 🟢 **Stock Alto**: > mínimo × 2
- 🟡 **Stock Medio**: entre mínimo y mínimo × 2
- 🔴 **Stock Bajo**: < stock mínimo
- ⚫ **Sin Stock**: = 0

**Movimientos automáticos:**
- ➕ **Entrada**: Reposición manual
- ➖ **Salida**: Retiro manual
- 🛒 **Venta**: Automático desde ventas
- 💔 **Merma**: Pérdidas/roturas

**Visualización:**
- 📊 **Gráfico de barras** por producto
- 🚨 **Alertas visuales** para stock crítico
- 📈 **Estadísticas** por nivel de stock

### ⏰ **Gestión de Turnos Administrativos**
- 👤 **Control por administrativo** con nombre
- 💰 **Caja inicial** configurable
- 📊 **Seguimiento en tiempo real**:
  - Total por método de pago (efectivo, transferencia, expensa)
  - Cantidad de transacciones
  - Tiempo de turno activo
- 🔒 **Validación obligatoria** para realizar ventas
- 📋 **Cierre con arqueo** completo

### 📊 **Dashboard Ejecutivo (Solo Admin)**
**KPIs principales:**
- 💰 Ingresos totales y por fuente (kiosco vs canchas)
- 🧾 Número de transacciones
- 🎯 Ticket promedio
- ⚠️ Alertas de stock bajo

**Analytics avanzados:**
- 🏆 **Productos más vendidos** (ranking top 5)
- 🥧 **Ventas por categoría** con porcentajes
- 📈 **Proyecciones** semanales y mensuales
- 📊 **Análisis de tendencias** (crecimiento/decrecimiento)

**Filtros temporales:**
- Hoy, Última semana, Último mes, Rango personalizado

### 🧾 **Historial de Transacciones**
- 📜 **Registro completo** de todas las operaciones
- 🔍 **Filtros avanzados**: Fecha, tipo, método de pago, cliente
- 🔎 **Búsqueda**: Por cliente, recibo, lote, origen
- 📤 **Exportación**: CSV detallado y completo
- 👁️ **Vista detallada** por transacción con items
- 🏷️ **Categorización**: Kiosco, Canchas, Retiros, Gastos, Caja inicial

### ☁️ **Sistema de Backup Automático (NUEVO)**
**Funcionalidades implementadas:**
- 🔄 **Backup automático** cada 6 horas
- 📱 **Backup manual** disponible 24/7
- 🔄 **Restauración completa** desde cualquier backup
- 📋 **Historial de operaciones** con auditoría
- 🧹 **Limpieza automática** (mantiene últimos 30)
- 🔒 **Seguridad RLS** por dispositivo
- 🧪 **Suite de pruebas** para verificación
- 📊 **Panel de control** en `/backup`

**Base de datos Supabase:**
- 📦 **Tabla `backups`**: Almacenamiento de respaldos
- 📋 **Tabla `sync_logs`**: Auditoría de operaciones
- 🔍 **Índices optimizados**: Para consultas eficientes
- 🛡️ **Políticas RLS**: Seguridad por dispositivo

## 🔐 Sistema de Autenticación

### **👤 Usuario Clásico** (Sin contraseña)
- ✅ Ventas (Kiosco)
- ✅ Gestión de Canchas
- ✅ Turno Actual
- ✅ Carnets de Socios

### **🔑 Administrador** (Contraseña: `2580`)
- ✅ **Todo lo anterior +**
- ✅ Dashboard Ejecutivo
- ✅ Gestión de Productos
- ✅ Control de Stock
- ✅ Movimientos de Inventario
- ✅ Arqueo de Caja
- ✅ Historial de Transacciones
- ✅ **Backup y Seguridad**

## 💳 Métodos de Pago Avanzados

### **Pagos Simples**
- 💵 **Efectivo**
- 💳 **Transferencia**
- 📄 **Expensa**

### **Pagos Combinados**
- 🔄 Permite dividir el pago entre múltiples métodos
- ✅ Validación automática de montos
- 📊 Desglose detallado en recibos y reportes

## 🗄️ Arquitectura de Datos

### **💾 Persistencia Híbrida**
```
┌─────────────────┐
│   DISPOSITIVO   │
│                 │
│ IndexedDB       │
│ localStorage    │
│ (Funcionamiento │
│  Principal)     │
└─────────────────┘
```

## 📁 Estructura del Proyecto

```
src/
├── components/           # Componentes reutilizables
│   ├── AdminLogin.tsx   # Modal de login administrativo
│   ├── Cart.tsx         # Carrito de compras avanzado
│   ├── CarnetDialog.tsx # Formulario de carnets
│   ├── BackupManager.tsx# Gestión de backups (NUEVO)
│   ├── SupabaseStatus.tsx# Estado de conexión (NUEVO)
│   ├── ErrorBoundary.tsx# Manejo de errores
│   └── ...
├── pages/               # Páginas principales
│   ├── Sales.tsx        # Sistema de ventas
│   ├── Courts.tsx       # Gestión de canchas
│   ├── Carnets.tsx      # Carnets de socios
│   ├── Dashboard.tsx    # Analytics ejecutivos
│   ├── Products.tsx     # Gestión de productos
│   ├── Stock.tsx        # Control de inventario
│   ├── Movements.tsx    # Movimientos de stock
│   ├── CurrentTurn.tsx  # Turno actual
│   ├── Transactions.tsx # Historial completo
│   ├── CashRegister.tsx # Arqueo de caja
│   └── BackupSettings.tsx# Backup y seguridad (NUEVO)
├── store/               # Estado global
│   └── useStore.ts      # Store principal con Zustand
├── types/               # Definiciones TypeScript
│   ├── index.ts         # Tipos principales
│   ├── carnets.ts       # Tipos de carnets
│   └── classes.ts       # Tipos de clases (futuro)
├── utils/               # Utilidades
│   ├── db.ts           # Base de datos local
│   ├── carnetsDb.ts    # DB específica de carnets
└── App.tsx             # Componente raíz
```

## 🗄️ Modelo de Datos

### **Entidades Principales**

```typescript
// Producto del kiosco
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock?: number;
  createdAt: string;
  updatedAt: string;
}

// Venta realizada
interface Sale {
  id: string;
  receiptNumber: string;  // VP-YYYY-NNNNNN
  items: SaleItem[];
  total: number;
  paymentMethod: 'efectivo' | 'transferencia' | 'expensa';
  customerName?: string;
  lotNumber?: string;
  courtId?: string;
  createdAt: string;
}

// Carnet de socio
interface Carnet {
  id: string;
  tipo: 'Individual' | 'Familiar';
  estado: 'Activo' | 'Baja';
  miembros: CarnetMember[];
  fechaCreacion: string;
  fechaBaja?: string;
  motivoBaja?: string;
  creadoPor: string;
}

// Turno administrativo
interface AdminTurn {
  id: string;
  adminName: string;
  startDate: string;
  status: 'active' | 'closed';
  sales: Sale[];
  courtBills: CourtBill[];
  totals: {
    efectivo: number;
    transferencia: number;
    expensa: number;
    total: number;
  };
}

```

## 📊 Sistema de Reportes y Analytics

### **📤 Exportaciones Disponibles**

#### 👥 **Carnets de Socios**
- **Formato**: CSV completo
- **Incluye**: Datos personales, estados, fechas, motivos de baja
- **Filtros**: Aplicables antes de exportar

#### 🧾 **Transacciones**
- **Resumen**: CSV con totales por método de pago
- **Completo**: CSV con detalle de items por transacción
- **Filtros**: Fecha, tipo, método de pago, cliente

#### 📦 **Inventario**
- **Productos**: JSON backup completo del sistema
- **Stock**: CSV con niveles actuales y alertas
- **Movimientos**: Historial completo de cambios

#### ⏰ **Turnos**
- **Resumen imprimible**: HTML optimizado para impresión
- **Detalle**: CSV con todas las transacciones del turno
- **Arqueo**: PDF con conciliación de caja

### **📥 Importaciones Soportadas**

#### 👥 **Carnets Masivos**
- **Formatos**: CSV, XLSX
- **Estructura esperada**:
  ```csv
  LOTE, Condicion, Apellido y Nombre, Edad
  123, T, García Juan, 45
  123, F1, García María, 42
  456, T, López Pedro, 38
  ```
- **Validaciones**: DNI únicos, campos obligatorios, duplicados
- **Autocompletado**: DNI incremental, teléfono "Sin Teléfono", barrio "OTRO"
- **Agrupación**: Automática por lote para carnets familiares

## 🚀 Instalación y Configuración

### **Requisitos Previos**
- Node.js 18+
- npm o yarn

### **Instalación Rápida**
```bash
# Clonar el repositorio
git clone [repository-url]
cd villanueva-padel

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

### **🔧 Configuración PWA**
La aplicación se instala automáticamente como PWA:
- **Nombre**: Villanueva Pádel
- **Tema**: Verde corporativo (#16a34a)
- **Modo**: Standalone (app nativa)
- **Cache**: Automático con Workbox
- **Offline**: Funcionamiento completo sin internet

## 🔧 Configuración Inicial del Sistema

### **📦 Datos Predeterminados**
Al primer uso, el sistema inicializa:

#### **Productos de Ejemplo**
- Agua Mineral ($500) - Stock: 20, Mín: 5
- Gatorade ($800) - Stock: 15, Mín: 3
- Coca Cola ($600) - Stock: 25, Mín: 5
- Barrita Cereal ($400) - Stock: 30, Mín: 10
- Toalla Deportiva ($1500) - Stock: 10, Mín: 2

#### **Servicios de Cancha**
- Alquiler de Paletas: $2000 (equipment)
- Uso de Luz: $1500 (facility)
- Entrada Invitado: $1000 (entry)
- Toallas: $500 (equipment)
- Pelotas: $800 (equipment)

### **🔑 Configuración de Administrador**
- **Contraseña por defecto**: `2580`
- **Ubicación**: `src/components/AdminLogin.tsx`
- **Cambio**: Modificar línea 25 para nueva contraseña

## 🔄 Flujos de Trabajo Principales

### **🛒 Flujo de Venta Completo**
1. **Verificación de turno** (obligatorio)
2. **Selección de productos** con filtros por categoría
3. **Agregado al carrito** con control de stock
4. **Datos del cliente** (nombre, lote) - opcional
5. **Selección de cancha** - opcional
6. **Método de pago** (simple o combinado)
7. **Generación automática** de recibo VP-YYYY-NNNNNN
8. **Actualización de stock** automática
9. **Registro en turno** activo
10. **Sonido de confirmación**

### **👥 Flujo de Gestión de Carnets**
1. **Selección de tipo** (Individual/Familiar)
2. **Datos del titular** (todos obligatorios)
3. **Agregado de familiares** (nombre y teléfono obligatorios)
4. **Validación automática** (DNI únicos, campos requeridos)
5. **Generación de ID** único del carnet
6. **Almacenamiento** con auditoría completa

### **📦 Flujo de Control de Stock**
1. **Monitoreo automático** con sistema de semáforo
2. **Alertas visuales** por nivel de stock
3. **Movimientos manuales** (entrada/salida/merma)
4. **Actualización automática** desde ventas
5. **Reportes** de stock bajo/crítico
6. **Gráficos** de barras en tiempo real

## 📱 Características PWA

### **🔄 Funcionalidades Offline**
- ✅ **Cache automático** de recursos estáticos
- ✅ **Funcionamiento completo** sin conexión
- ✅ **Sincronización automática** al reconectar
- ✅ **Actualizaciones automáticas** del service worker

### **📲 Instalación**
- ✅ **Instalable en móviles** (Android/iOS)
- ✅ **Instalable en desktop** (Chrome/Edge/Safari)
- ✅ **Icono personalizado** del complejo
- ✅ **Splash screen** con branding

## 🛠️ Mantenimiento y Operaciones

### **💾 Gestión de Datos**
```typescript
// Backup completo del sistema
const backupData = await exportData();

// Restaurar desde backup
await importData(backupData);

// Limpiar toda la base de datos
await clearAllData();

```

### **📊 Monitoreo del Sistema**
- **Alertas de stock** automáticas
- **Métricas de performance** en tiempo real
- **Historial de errores** para debugging

## 🐛 Manejo de Errores y Recuperación

### **🛡️ Error Boundaries**
- Captura errores en componentes React
- Fallbacks específicos por módulo
- Recuperación automática cuando es posible
- Información detallada en modo desarrollo

### **✅ Validaciones Implementadas**
- ✅ **Formularios**: Validación en tiempo real
- ✅ **Stock**: Control antes de ventas
- ✅ **Turnos**: Validación de turno activo obligatorio
- ✅ **Importaciones**: Verificación de datos CSV/XLSX

### **🔄 Recuperación Automática**
- **IndexedDB → localStorage**: Fallback automático
- **Datos corruptos**: Inicialización de datos por defecto
- **Errores de red**: Retry automático en operaciones críticas

## 📈 Métricas y KPIs Avanzados

### **💰 Métricas Financieras**
- **Ingresos totales** por período
- **Ingresos por fuente** (kiosco vs canchas)
- **Ticket promedio** por transacción
- **Proyecciones** semanales y mensuales
- **Análisis de tendencias** automático

### **📊 Métricas Operacionales**
- **Productos más vendidos** (ranking dinámico)
- **Ventas por categoría** con porcentajes
- **Rotación de inventario** por producto
- **Alertas de stock** por nivel de criticidad

### **👥 Métricas de Socios**
- **Total de carnets** activos/dados de baja
- **Distribución por barrio** y tipo
- **Crecimiento** de base de socios
- **Análisis por condición** (titular/familiar)

## 🔄 Próximas Funcionalidades

### **🔥 En Desarrollo (8.3%)**
- 🔄 **Corrección de tableros** de turnos (información incorrecta)
- 🔄 **Mejora de facturación** de canchas
- 🔄 **Optimización de arqueo** de caja
- 🔄 **Integración kiosco-canchas** mejorada

### **❌ Pendiente (2.1%)**
- ❌ **Creación de carnets** (formulario no funciona completamente)

### **🚀 Futuras Mejoras**
- 📱 **Notificaciones push** para alertas
- 📊 **Dashboard en tiempo real** con WebSockets
- 🤖 **Predicciones de stock** con IA
- 📧 **Reportes automáticos** por email

## 🤝 Contribución y Desarrollo

### **🔧 Comandos de Desarrollo**
```bash
# Desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview

# Linting
npm run lint

# Verificar Supabase (NUEVO)
# Ir a /backup y ejecutar pruebas
```

### **📋 Estructura de Commits**
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: estilos/formato
refactor: refactorización
test: pruebas
chore: tareas de mantenimiento
backup: cambios en sistema de backup
```

### **🧪 Testing y Verificación**
- **Suite de pruebas Supabase**: Verificación automática
- **Error boundaries**: Captura de errores en desarrollo
- **Validaciones**: Formularios y datos
- **Logs detallados**: Para debugging

## 📞 Soporte y Troubleshooting

### **🔧 Problemas Comunes**

#### **❌ Error de IndexedDB**
- **Síntoma**: Datos no se guardan
- **Solución**: Sistema usa localStorage automáticamente

#### **⚠️ Turno no activo**
- **Síntoma**: No se pueden realizar ventas
- **Solución**: Abrir nuevo turno desde página de ventas

#### **📦 Stock negativo**
- **Síntoma**: Productos con stock < 0
- **Solución**: Ajustar con movimiento de entrada

#### **☁️ Backup no funciona**
- **Síntoma**: No disponible (funcionalidad removida)
- **Solución**: Los datos se mantienen localmente

#### **📥 Importación de carnets falla**
- **Síntoma**: Errores en importación CSV
- **Solución**: Verificar formato y campos obligatorios

### **🔍 Herramientas de Debugging**
- **DevTools**: Console para errores detallados
- **Application > Storage**: Verificar datos locales
- **Network**: Problemas de conectividad

## 🎯 Roadmap 2025

### **Q1 2025 (Enero-Marzo)**
- 🔄 Corrección de tableros de turnos
- 🔄 Mejora de arqueo de caja
- 🔄 Funcionalidad completa de carnets

### **Q2 2025 (Abril-Junio)**
- 📱 Notificaciones push
- 🤖 Predicciones de stock con IA
- 📊 Dashboard en tiempo real
- 🧪 Suite de testing completa

### **Q3 2025 (Julio-Septiembre)**
- 📧 Reportes automáticos
- 🔄 Sincronización multi-dispositivo
- 📱 App móvil nativa
- 🎨 Rediseño de UI/UX

## 📄 Licencia y Créditos

Este proyecto está desarrollado específicamente para **Villanueva Pádel**.

**Tecnologías principales**: React, TypeScript, Tailwind CSS, Vite
**Arquitectura**: PWA con persistencia local
**Almacenamiento**: IndexedDB con fallback a localStorage

---

*Sistema de gestión integral para complejos deportivos*

---

## 📞 Contacto y Soporte

Para soporte técnico o nuevas funcionalidades, contactar al equipo de desarrollo.

**Versión actual**: 1.0.0
**Última actualización**: Enero 2025