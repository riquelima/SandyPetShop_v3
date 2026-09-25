const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data: cols1 } = await supabase.rpc('get_columns', { table_name: 'appointments' });
  const { data: cols2 } = await supabase.rpc('get_columns', { table_name: 'monthly_clients' });
  console.log("Cols appointments:", cols1);
  console.log("Cols monthly_clients:", cols2);
}
test();
