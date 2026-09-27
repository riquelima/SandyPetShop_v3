const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { count, error } = await supabase.from('monthly_clients').select('*', { count: 'exact', head: true });
  console.log("Count monthly_clients:", count, "Error:", error);
  const { count: c2 } = await supabase.from('daycare_enrollments').select('*', { count: 'exact', head: true });
  console.log("Count daycare_enrollments:", c2);
  const { count: c3 } = await supabase.from('appointments').select('*', { count: 'exact', head: true });
  console.log("Count appointments:", c3);
}
test();
