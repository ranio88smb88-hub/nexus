
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fungsi pendeteksi ENV yang kompatibel dengan Vite & Vercel
const getEnv = (key: string): string | undefined => {
  try {
    // Coba dengan prefix VITE_ (Standar Vite/Vercel Frontend)
    const viteKey = `VITE_${key}`;
    
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      // @ts-ignore
      return import.meta.env[viteKey];
    }
    
    // Fallback ke nama asli (Tanpa VITE_)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }

    // Fallback ke process.env (Standard Node/Vercel SSR)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[viteKey] || process.env[key];
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
