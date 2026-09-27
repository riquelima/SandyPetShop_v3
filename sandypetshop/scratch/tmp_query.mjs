import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('appointments').select('pet_name, pet_breed, owner_name, owner_cpf, whatsapp, owner_address, condominium').limit(1);
  console.log(data);
}
run();
