const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data: cols1 } = await supabase.from('appointments').select('*').limit(1);
  const { data: cols2 } = await supabase.from('pet_movel_appointments').select('*').limit(1);
  const { data: cols3 } = await supabase.from('agendamento_banhotosa').select('*').limit(1);
  console.log("Cols appointments:", Object.keys(cols1[0] || {}));
  console.log("Cols pet_movel_appointments:", Object.keys(cols2[0] || {}));
  console.log("Cols agendamento_banhotosa:", Object.keys(cols3[0] || {}));
}
test();
