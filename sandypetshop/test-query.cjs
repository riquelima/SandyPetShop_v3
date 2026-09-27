const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const rawPhone = '11969434941';
  const formatted11 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
  const formatted10 = rawPhone.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14);

  console.log("Values:", { rawPhone, formatted11, formatted10 });
  const { data, error } = await supabase
    .from('clients')
    .select('id, phone, name')
    .or(`phone.ilike.%${rawPhone}%,phone.ilike.%${formatted11}%,phone.ilike.%${formatted10}%`);
    
  console.log("Result:", data, error);
}

test();
