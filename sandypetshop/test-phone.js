const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const phone = '71999088651';
  
  const res1 = await supabase.from('monthly_clients').select('id, whatsapp, tutor_name');
  console.log("monthly_clients:", res1.data?.filter(d => d.whatsapp && d.whatsapp.replace(/\D/g, '').includes(phone)));
  
  const res2 = await supabase.from('clients').select('id, phone, name');
  console.log("clients:", res2.data?.filter(d => d.phone && d.phone.replace(/\D/g, '').includes(phone)));
  
  const res3 = await supabase.from('appointments').select('id, whatsapp, owner_name').limit(1000);
  console.log("appointments:", res3.data?.filter(d => d.whatsapp && d.whatsapp.replace(/\D/g, '').includes(phone)).slice(0,2));
}

test();
