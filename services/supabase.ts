import { createClient } from '@supabase/supabase-js';

// VITE REQUIREMENT: Use import.meta.env directly for environment variables.
// Do not use process.env or complex wrappers as they can fail in production builds.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Flag global para verificar si Supabase está activo
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Validación de estado de la Base de Datos
if (!isSupabaseConfigured) {
  console.warn(
    '%c[Argon DB] Modo OFFLINE: Base de Datos Real no conectada.',
    'color: #F59E0B; font-weight: bold; background: #222; padding: 4px; border-radius: 4px;'
  );
  console.info(
    '%cPara activar la Base de Datos Real:\n1. Crea un proyecto en Supabase.com\n2. Ejecuta el esquema SQL necesario\n3. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY a tu entorno.',
    'color: #10B981;'
  );
} else {
  console.log(
    '%c[Argon DB] Base de Datos Real: CONECTADA',
    'color: #000; font-weight: bold; background: #10B981; padding: 4px; border-radius: 4px;'
  );
}

// Inicializamos el cliente. Si faltan las keys, usamos placeholders seguros.
// La app funcionará en modo "Local Storage" hasta que se configuren las keys reales.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);