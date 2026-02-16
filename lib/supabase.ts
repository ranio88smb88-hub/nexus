import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Pendeteksian environment variable yang lebih tangguh untuk Vite & Vercel.
 * Vite menggunakan import.meta.env secara default.
 */
const getEnv = (key: string): string | undefined => {
  try {
    // @ts-ignore - Mencoba standar Vite/ESM
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    // @ts-ignore - Fallback ke standar Node (jika ada)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Diamkan error jika akses env gagal
  }
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

if (!supabase) {
  console.warn("Supabase credentials tidak ditemukan. Aplikasi akan menggunakan data default.");
}
