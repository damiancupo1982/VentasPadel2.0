/*
  # Crear tablas para sistema de backup

  1. Nuevas Tablas
    - `backups`
      - `id` (uuid, primary key)
      - `backup_type` (text) - 'full' o 'incremental'
      - `data` (jsonb) - datos del backup
      - `device_id` (text) - identificador del dispositivo
      - `version` (text) - versión del esquema
      - `created_at` (timestamp)
    
    - `sync_logs`
      - `id` (uuid, primary key)
      - `action` (text) - 'backup' o 'restore'
      - `status` (text) - 'success' o 'error'
      - `message` (text) - mensaje descriptivo
      - `device_id` (text) - identificador del dispositivo
      - `created_at` (timestamp)

  2. Seguridad
    - Enable RLS en ambas tablas
    - Políticas para que cada dispositivo solo acceda a sus datos
*/

-- Crear tabla de backups
CREATE TABLE IF NOT EXISTS backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL CHECK (backup_type IN ('full', 'incremental')),
  data jsonb NOT NULL,
  device_id text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de logs de sincronización
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('backup', 'restore')),
  status text NOT NULL CHECK (status IN ('success', 'error')),
  message text NOT NULL,
  device_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para backups
CREATE POLICY "Users can manage their own backups"
  ON backups
  FOR ALL
  USING (device_id = current_setting('app.device_id', true));

-- Políticas para logs
CREATE POLICY "Users can manage their own logs"
  ON sync_logs
  FOR ALL
  USING (device_id = current_setting('app.device_id', true));

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_backups_device_created 
  ON backups(device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sync_logs_device_created 
  ON sync_logs(device_id, created_at DESC);