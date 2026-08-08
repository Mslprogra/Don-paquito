import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validar que las variables de entorno existan antes de instanciar el cliente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuración crítica ausente: Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno (.env.local).'
  );
}

// Implementación de almacenamiento defensivo seguro para SSR (Next.js)
const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Al asignar sessionStorage, la sesión se destruye automáticamente al cerrar la pestaña o el navegador
    storage: isBrowser ? window.sessionStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});