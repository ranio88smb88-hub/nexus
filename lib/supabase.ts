
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  try {
    const viteKey = `VITE_${key}`;
    // @ts-ignore
    if (import.meta.env && import.meta.env[viteKey]) return import.meta.env[viteKey];
    // @ts-ignore
    if (import.meta.env && import.meta.env[key]) return import.meta.env[key];
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) return process.env[viteKey] || process.env[key];
  } catch (e) {}
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL') || '';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || '';

export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

if (!supabase) {
  console.warn("Supabase credentials tidak ditemukan. Aplikasi akan menggunakan data default.");
}
