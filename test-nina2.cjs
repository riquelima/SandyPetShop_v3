const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data } = await supabase.from('monthly_clients').select('*').ilike('whatsapp', '%11948890590%');
  console.log("Aline monthly:", data);
}
test();
