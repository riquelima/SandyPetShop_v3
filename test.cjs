const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const phone = '969434941'; // Just the main numbers to find it regardless of DDD prefix style like 55
  
  const res1 = await supabase.from('monthly_clients').select('id, whatsapp, tutor_name');
  const mc = res1.data?.filter(d => d.whatsapp && d.whatsapp.replace(/\D/g, '').includes(phone));
  
  const res2 = await supabase.from('clients').select('id, phone, name');
  const cl = res2.data?.filter(d => d.phone && d.phone.replace(/\D/g, '').includes(phone));
  
  const res3 = await supabase.from('appointments').select('id, whatsapp, owner_name').limit(2000);
  const ap = res3.data?.filter(d => d.whatsapp && d.whatsapp.replace(/\D/g, '').includes(phone));

  const res4 = await supabase.from('pet_movel_appointments').select('id, whatsapp, owner_name').limit(2000);
  const pm = res4.data?.filter(d => d.whatsapp && d.whatsapp.replace(/\D/g, '').includes(phone));

  console.log("monthly_clients:", mc);
  console.log("clients:", cl);
  console.log("appointments:", ap);
  console.log("pet_movel_appointments:", pm);
}

test();
