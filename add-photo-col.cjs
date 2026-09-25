const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  // Try to query an RPC or see if we have service_role_key
  console.log("Service key exists:", !!process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
}
test();
