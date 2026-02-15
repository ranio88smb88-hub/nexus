
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Menggunakan pengaman untuk akses process.env di lingkungan browser
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env ? process.env[key] : undefined) || 
           // @ts-ignore
           (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[`VITE_${key}`] : undefined);
  } catch (e) {
    return undefined;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const supabase: SupabaseClient | null = 
  supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

if (!supabase) {
  console.warn("Supabase credentials missing. Pastikan variabel SUPABASE_URL dan SUPABASE_ANON_KEY sudah diatur di Vercel Environment Variables.");
}
