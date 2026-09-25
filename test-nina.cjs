const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data } = await supabase.from('pet_movel_appointments').select('whatsapp, owner_name, pet_name').ilike('pet_name', '%Nina%');
  console.log("Nina appointments:", data);
}

test();
