// src/utils/supabaseCarnets.ts
// STUB sencillo para desactivar la sincronización con Supabase

export const supabaseCarnetsService = {
  async syncFromSupabaseToLocal(): Promise<{ ok: boolean; message: string }> {
    // No hace nada. Solo devuelve un mensaje para que la app no rompa.
    return { ok: false, message: 'Sincronización desactivada' };
  },
};
