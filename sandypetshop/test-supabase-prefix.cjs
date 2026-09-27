const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  console.log("Testing prefix scan...");
  const rawPhone = "11996261395";
  const formatted11 = "(11) 99626-1395";
  const formatted10 = "(11) 9962-6139";
  const start = Date.now();
  const { data, error } = await supabase.from('monthly_clients').select('*').or(`whatsapp.ilike."${rawPhone}%",whatsapp.ilike."${formatted11}%",whatsapp.ilike."${formatted10}%"`);
  console.log("Time:", Date.now() - start, "ms. Data:", data?.length, "Error:", error);
}
test();
