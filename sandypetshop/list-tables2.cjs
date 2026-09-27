const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('daycare_diary_entries').select('*').limit(1);
  console.log("daycare_diary_entries:", data ? Object.keys(data[0] || {}) : error);
}
test();
