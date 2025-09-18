// src/utils/autoBackup.ts
// Auto-backup a carpeta elegida por el usuario usando File System Access API (Chrome/Edge).
// Requiere HTTPS (tu app ya lo tiene) y un gesto del usuario para otorgar permisos.

import { exportData } from './db';
import { get, set, del } from 'idb-keyval'; // ya lo usás en el proyecto

const DIR_HANDLE_KEY = 'backup-dir-handle';
const CFG_KEY = 'auto-backup-config';

type AutoBackupConfig = {
  enabled: boolean;
  intervalMinutes: number; // cada cuánto
};

let timerId: number | null = null;

/** Util: nombre de archivo con fecha */
function buildFilename(prefix = 'villanueva-backup') {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${prefix}-${y}${m}${day}-${hh}${mm}${ss}.json`;
}

/** Guardado “descarga” como fallback */
function downloadFallback(text: string, filename: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Pide/verifica permiso de escritura sobre un directorio */
async function ensurePermission(dirHandle: any): Promise<boolean> {
  if (!dirHandle) return false;
  if (!dirHandle.queryPermission || !dirHandle.requestPermission) return false;
  const opts = { mode: 'readwrite' as const };
  const current = await dirHandle.queryPermission(opts);
  if (current === 'granted') return true;
  if (current === 'prompt') {
    const res = await dirHandle.requestPermission(opts);
    return res === 'granted';
  }
  return false;
}

/** Permite elegir carpeta de backups (guardamos el handle en IndexedDB) */
export async function selectBackupDirectory(): Promise<boolean> {
  try {
    // @ts-ignore
    const dirHandle = await (window as any).showDirectoryPicker();
    const ok = await ensurePermission(dirHandle);
    if (!ok) return false;
    await set(DIR_HANDLE_KEY, dirHandle);
    return true;
  } catch (e) {
    console.error('No se pudo seleccionar carpeta:', e);
    return false;
  }
}

/** Estado actual de la carpeta (si está elegida y con permiso) */
export async function getDirectoryStatus(): Promise<'ok' | 'no-permission' | 'not-set' | 'unsupported'> {
  // @ts-ignore
  if (!(window as any).showDirectoryPicker) return 'unsupported';
  const handle = await get(DIR_HANDLE_KEY);
  if (!handle) return 'not-set';
  const ok = await ensurePermission(handle);
  return ok ? 'ok' : 'no-permission';
}

/** Hace un backup ahora mismo (a carpeta si hay, sino descarga) */
export async function backupNow(): Promise<'dir' | 'download' | 'error'> {
  try {
    const data = await exportData();
    const text = JSON.stringify(data, null, 2);
    const filename = buildFilename();

    const handle = await get(DIR_HANDLE_KEY);
    if (handle && await ensurePermission(handle)) {
      const fileHandle = await handle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      return 'dir';
    } else {
      downloadFallback(text, filename);
      return 'download';
    }
  } catch (e) {
    console.error('Error en backupNow:', e);
    return 'error';
  }
}

/** Lee/guarda config en localStorage */
function loadConfig(): AutoBackupConfig {
  const raw = localStorage.getItem(CFG_KEY);
  if (!raw) return { enabled: false, intervalMinutes: 60 };
  try {
    const cfg = JSON.parse(raw) as AutoBackupConfig;
    return {
      enabled: !!cfg.enabled,
      intervalMinutes: Math.max(1, Number(cfg.intervalMinutes) || 60),
    };
  } catch {
    return { enabled: false, intervalMinutes: 60 };
  }
}
function saveConfig(cfg: AutoBackupConfig) {
  localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
}

/** Inicia el scheduler */
export function startAutoBackupLoop() {
  const cfg = loadConfig();
  stopAutoBackupLoop();
  if (!cfg.enabled) return;

  const ms = cfg.intervalMinutes * 60 * 1000;
  // Backup inmediato + cada intervalo
  backupNow();
  timerId = window.setInterval(() => {
    backupNow();
  }, ms);
}

/** Detiene el scheduler */
export function stopAutoBackupLoop() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

/** Cambia config y reinicia si corresponde */
export function setAutoBackupConfig(partial: Partial<AutoBackupConfig>) {
  const current = loadConfig();
  const next = { ...current, ...partial };
  saveConfig(next);
  startAutoBackupLoop();
}

/** Helpers para UI */
export function getAutoBackupConfig(): AutoBackupConfig {
  return loadConfig();
}

/** Limpia la carpeta elegida (olvida el handle) */
export async function clearBackupDirectory() {
  await del(DIR_HANDLE_KEY);
}
