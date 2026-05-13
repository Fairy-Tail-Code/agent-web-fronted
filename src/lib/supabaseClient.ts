import { createClient } from '@supabase/supabase-js';

const authUrl = import.meta.env.VITE_SUPABASE_AUTH_URL;
const projectUrl = import.meta.env.VITE_SUPABASE_URL || authUrl?.replace(/\/auth\/v1\/callback$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(projectUrl && anonKey);

export const supabaseClient = isSupabaseConfigured ? createClient(projectUrl as string, anonKey as string, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'agent-workbench-supabase-auth-token',
  },
}) : null;
