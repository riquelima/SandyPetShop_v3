const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bbjmlbzcqnhhteyhverk.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiam1sYnpjcW5oaHRleWh2ZXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTIwMTcsImV4cCI6MjA3NDU2ODAxN30.ljRrFkqmxI0pLKZTGWPcwsbwMnU8_ToIs2nuKegM6s4';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

// Criar um mock do cliente Supabase para fallback
const createMockSupabaseClient = () => {
  console.warn('Using mock Supabase client - some features may not work');
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not available' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Supabase not available' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not available' } }),
      eq: function() { return this; },
      order: function() { return this; },
      range: function() { return this; }
    })
  };
};

// Aguardar o carregamento do Supabase de forma síncrona
function getSupabaseClient() {
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    console.log('Supabase loaded successfully');
    const { createClient } = window.supabase;
    return createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn('Supabase library not available, using mock client');
    return createMockSupabaseClient();
  }
}

// Tentar criar o cliente Supabase
let supabase: any;

try {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables, using mock client');
    supabase = createMockSupabaseClient();
  } else {
    supabase = getSupabaseClient();
    console.log('Supabase client created successfully');
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
  console.warn('Falling back to mock client');
  supabase = createMockSupabaseClient();
  
  // Tentar novamente após um delay
  setTimeout(() => {
    try {
      if (supabaseUrl && supabaseKey) {
        const realClient = getSupabaseClient();
        if (realClient && typeof realClient.from === 'function') {
          supabase = realClient;
          console.log('Supabase client created successfully (retry)');
        }
      }
    } catch (retryError) {
      console.error('Failed to create Supabase client after retry:', retryError);
    }
  }, 2000);
}

export { supabase };
