const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data: cols } = await supabase.from('daycare_reports').select('*').limit(1);
  console.log("Cols daycare_reports:", cols ? Object.keys(cols[0] || {}) : "No table");
}
test();
