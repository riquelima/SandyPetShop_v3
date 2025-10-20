const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check .env.local file.');
}

// @ts-ignore - Acessa o objeto global 'supabase' injetado pelo script no index.html
const { createClient } = window.supabase;

export const supabase = createClient(supabaseUrl, supabaseKey);
