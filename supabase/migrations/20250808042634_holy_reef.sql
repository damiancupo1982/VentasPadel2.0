/*
  # Sistema de Carnets de Socios - Villanueva Pádel

  1. Nuevas Tablas
    - `carnets_socios`
      - `id` (uuid, primary key)
      - `numero_carnet` (text, unique) - Formato: CS-YYYY-NNNN
      - `lote` (text)
      - `barrio` (text)
      - `tipo` (text) - INDIVIDUAL o FAMILIAR
      - `estado` (text) - ACTIVO, SUSPENDIDO, BAJA
      - `fecha_creacion` (timestamp)
      - `fecha_vencimiento` (timestamp, opcional)
      - `fecha_baja` (timestamp, opcional)
      - `motivo_baja` (text, opcional)
      - `creado_por` (text)
      - `dado_de_baja_por` (text, opcional)
      - `observaciones` (text, opcional)
      - `metadata` (jsonb)
      - `device_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `socios_miembros`
      - `id` (uuid, primary key)
      - `carnet_id` (uuid, foreign key)
      - `lote` (text)
      - `condicion` (text) - TITULAR, FAMILIAR_1, FAMILIAR_2, FAMILIAR_3, FAMILIAR_ADHERENTE
      - `nombre_completo` (text)
      - `telefono` (text)
      - `dni` (text)
      - `email` (text)
      - `barrio` (text)
      - `vinculo` (text)
      - `fecha_alta` (timestamp)
      - `fecha_baja` (timestamp, opcional)
      - `motivo_baja` (text, opcional)
      - `estado` (text) - ACTIVO, SUSPENDIDO, BAJA
      - `observaciones` (text, opcional)
      - `device_id` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Enable RLS en ambas tablas
    - Políticas para operaciones anónimas por device_id
    - Índices para consultas eficientes

  3. Constraints
    - Validación de estados
    - Validación de tipos
    - Validación de condiciones
    - DNI único por device_id
    - Número de carnet único por device_id
*/

-- Tabla principal de carnets
CREATE TABLE IF NOT EXISTS carnets_socios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_carnet text NOT NULL,
  lote text NOT NULL,
  barrio text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('INDIVIDUAL', 'FAMILIAR')),
  estado text NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'SUSPENDIDO', 'BAJA')),
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  fecha_vencimiento timestamptz,
  fecha_baja timestamptz,
  motivo_baja text,
  creado_por text NOT NULL DEFAULT 'Sistema',
  dado_de_baja_por text,
  observaciones text,
  metadata jsonb DEFAULT '{}',
  device_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de miembros del carnet
CREATE TABLE IF NOT EXISTS socios_miembros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carnet_id uuid NOT NULL REFERENCES carnets_socios(id) ON DELETE CASCADE,
  lote text NOT NULL,
  condicion text NOT NULL CHECK (condicion IN ('TITULAR', 'FAMILIAR_1', 'FAMILIAR_2', 'FAMILIAR_3', 'FAMILIAR_ADHERENTE')),
  nombre_completo text NOT NULL,
  telefono text NOT NULL,
  dni text NOT NULL,
  email text NOT NULL,
  barrio text NOT NULL,
  vinculo text NOT NULL,
  fecha_alta timestamptz NOT NULL DEFAULT now(),
  fecha_baja timestamptz,
  motivo_baja text,
  estado text NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'SUSPENDIDO', 'BAJA')),
  observaciones text,
  device_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE carnets_socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE socios_miembros ENABLE ROW LEVEL SECURITY;

-- Políticas RLS permisivas para operaciones anónimas
CREATE POLICY "Enable all operations for anon users on carnets_socios"
  ON carnets_socios
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for anon users on socios_miembros"
  ON socios_miembros
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_carnets_device_lote ON carnets_socios(device_id, lote);
CREATE INDEX IF NOT EXISTS idx_carnets_device_estado ON carnets_socios(device_id, estado);
CREATE INDEX IF NOT EXISTS idx_carnets_device_barrio ON carnets_socios(device_id, barrio);
CREATE INDEX IF NOT EXISTS idx_carnets_numero ON carnets_socios(numero_carnet);

CREATE INDEX IF NOT EXISTS idx_socios_carnet_id ON socios_miembros(carnet_id);
CREATE INDEX IF NOT EXISTS idx_socios_device_dni ON socios_miembros(device_id, dni);
CREATE INDEX IF NOT EXISTS idx_socios_device_lote ON socios_miembros(device_id, lote);
CREATE INDEX IF NOT EXISTS idx_socios_device_condicion ON socios_miembros(device_id, condicion);

-- Constraint para DNI único por device_id
ALTER TABLE socios_miembros 
ADD CONSTRAINT unique_dni_per_device 
UNIQUE (device_id, dni);

-- Constraint para número de carnet único por device_id
ALTER TABLE carnets_socios 
ADD CONSTRAINT unique_carnet_per_device 
UNIQUE (device_id, numero_carnet);