/*
  # Corregir políticas RLS para operaciones de backup

  1. Políticas Actualizadas
    - Permitir INSERT en tabla `backups` para usuarios anónimos con device_id válido
    - Permitir INSERT en tabla `sync_logs` para usuarios anónimos con device_id válido
    - Mantener políticas de SELECT/UPDATE/DELETE basadas en device_id

  2. Seguridad
    - Cada dispositivo solo puede ver y modificar sus propios datos
    - Se mantiene la seguridad por device_id
    - Permite operaciones anónimas necesarias para el funcionamiento

  3. Cambios
    - DROP de políticas existentes que causan conflictos
    - CREATE de nuevas políticas más permisivas para operaciones anónimas
    - Mantenimiento de la seguridad por device_id
*/

-- Eliminar políticas existentes que causan problemas
DROP POLICY IF EXISTS "Users can manage their own backups" ON backups;
DROP POLICY IF EXISTS "Users can manage their own logs" ON sync_logs;

-- Crear nuevas políticas para la tabla backups
CREATE POLICY "Allow anonymous backup operations"
  ON backups
  FOR ALL
  TO anon, authenticated
  USING (device_id = current_setting('app.device_id'::text, true))
  WITH CHECK (device_id = current_setting('app.device_id'::text, true));

-- Crear nuevas políticas para la tabla sync_logs  
CREATE POLICY "Allow anonymous log operations"
  ON sync_logs
  FOR ALL
  TO anon, authenticated
  USING (device_id = current_setting('app.device_id'::text, true))
  WITH CHECK (device_id = current_setting('app.device_id'::text, true));