
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fungsi pendeteksi ENV yang kompatibel dengan Vite & Vercel
const getEnv = (key: string): string | undefined => {
  try {
    // Vite menggunakan import.meta.env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    // Fallback ke process.env jika tersedia
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Abaikan error akses env
  }
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL') || '';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || '';

// Hanya buat client jika URL & Key tersedia
export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

if (!supabase) {
  console.warn("Supabase credentials tidak ditemukan. Aplikasi akan menggunakan data default.");
}
