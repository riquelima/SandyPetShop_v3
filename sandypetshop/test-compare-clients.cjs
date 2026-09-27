const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data: all } = await supabase.from('clients').select('phone').limit(20);
  console.log("Some phones in clients:");
  all.forEach(r => console.log(r.phone));
}
test();
