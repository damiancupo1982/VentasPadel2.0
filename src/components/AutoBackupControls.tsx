// src/components/AutoBackupControls.tsx
import React, { useEffect, useState } from 'react';
import { Cloud, Upload, Timer, FolderOpen } from 'lucide-react';
import {
  selectBackupDirectory,
  getDirectoryStatus,
  backupNow,
  startAutoBackupLoop,
  stopAutoBackupLoop,
  setAutoBackupConfig,
  getAutoBackupConfig,
  clearBackupDirectory
} from '../utils/autoBackup';

const AutoBackupControls: React.FC = () => {
  const [status, setStatus] = useState<'ok' | 'no-permission' | 'not-set' | 'unsupported'>('not-set');
  const [enabled, setEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [busy, setBusy] = useState(false);

  async function refreshStatus() {
    const st = await getDirectoryStatus();
    setStatus(st);
  }

  useEffect(() => {
    const cfg = getAutoBackupConfig();
    setEnabled(cfg.enabled);
    setIntervalMinutes(cfg.intervalMinutes);
    refreshStatus();
    startAutoBackupLoop(); // enciende si estaba habilitado
    return () => stopAutoBackupLoop();
  }, []);

  const chooseFolder = async () => {
    const ok = await selectBackupDirectory();
    await refreshStatus();
    if (ok) alert('Carpeta seleccionada. ¡Listo para auto-backups!');
  };

  const handleToggle = async () => {
    const newVal = !enabled;
    setEnabled(newVal);
    setAutoBackupConfig({ enabled: newVal, intervalMinutes });
    if (newVal) {
      const st = await getDirectoryStatus();
      if (st !== 'ok') {
        alert('Elegí una carpeta y otorgá permisos primero.');
      }
    }
  };

  const handleIntervalChange = (v: number) => {
    const val = Math.max(1, Math.floor(v || 1));
    setIntervalMinutes(val);
    setAutoBackupConfig({ intervalMinutes: val });
  };

  const handleBackupNow = async () => {
    setBusy(true);
    const mode = await backupNow();
    setBusy(false);
    if (mode === 'dir') alert('Backup guardado en la carpeta elegida ✅');
    else if (mode === 'download') alert('No había carpeta con permiso, se descargó el archivo ✅');
    else alert('Hubo un error generando el backup');
  };

  const handleClearFolder = async () => {
    await clearBackupDirectory();
    await refreshStatus();
    alert('Se olvidó la carpeta seleccionada.');
  };

  const statusLabel = {
    ok: 'Carpeta lista (permiso ok)',
    'no-permission': 'Sin permiso (elegí de nuevo)',
    'not-set': 'Sin carpeta elegida',
    'unsupported': 'Tu navegador no soporta guardar directo en carpeta',
  }[status];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cloud className="h-5 w-5 text-emerald-600" />
          <span className="font-medium">Auto-Backup</span>
        </div>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            onChange={handleToggle}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full" />
          <span className="ml-3 text-sm">Activado</span>
        </label>
      </div>

      <div className="text-sm text-gray-700">
        Estado: <span className="font-medium">{statusLabel}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={chooseFolder}
          className="inline-flex items-center rounded-md border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Elegir carpeta…
        </button>
        <button
          onClick={handleClearFolder}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          Olvidar carpeta
        </button>
        <div className="flex items-center ml-auto space-x-2">
          <Timer className="h-4 w-4 text-gray-500" />
          <input
            type="number"
            min={1}
            value={intervalMinutes}
            onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
            title="Minutos"
          />
          <span className="text-sm text-gray-600">min</span>
          <button
            onClick={handleBackupNow}
            disabled={busy}
            className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Backup ahora
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Nota: los auto-backups se ejecutan solo mientras la app esté abierta en el navegador.  
        Para respaldos en segundo plano/cerrado se necesita un backend o sincronización en la nube.
      </p>
    </div>
  );
};

export default AutoBackupControls;
