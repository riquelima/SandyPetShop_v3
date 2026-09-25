const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data: cols1 } = await supabase.from('clients').select('*').limit(1);
  const { data: cols2 } = await supabase.from('client').select('*').limit(1);
  const { data: cols3 } = await supabase.from('tutores').select('*').limit(1);
  console.log("Cols clients:", cols1 ? Object.keys(cols1[0] || {}) : "No table");
  console.log("Cols client:", cols2 ? Object.keys(cols2[0] || {}) : "No table");
  console.log("Cols tutores:", cols3 ? Object.keys(cols3[0] || {}) : "No table");
}
test();
