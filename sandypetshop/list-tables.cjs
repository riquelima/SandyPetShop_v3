const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('daycare_diaries').select('*').limit(1);
  console.log("daycare_diaries:", data || error);
  const { data: d2, error: e2 } = await supabase.from('daycare_reports').select('*').limit(1);
  console.log("daycare_reports:", d2 || e2);
  const { data: d3, error: e3 } = await supabase.from('diario_creche').select('*').limit(1);
  console.log("diario_creche:", d3 || e3);
  const { data: d4, error: e4 } = await supabase.from('diarios').select('*').limit(1);
  console.log("diarios:", d4 || e4);
}
test();
