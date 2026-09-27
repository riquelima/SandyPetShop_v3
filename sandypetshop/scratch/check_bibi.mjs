import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('--- BUSCANDO MENSALISTA BIBI ---');
  const { data: monthlyClients, error: mErr } = await supabase
    .from('monthly_clients')
    .select('*')
    .ilike('pet_name', '%Bibi%');
  
  if (mErr) console.error('Erro monthly_clients:', mErr);
  else console.log('Monthly Clients:', JSON.stringify(monthlyClients, null, 2));

  console.log('\n--- BUSCANDO AGENDAMENTOS BIBI ---');
  const { data: appointments, error: aErr } = await supabase
    .from('appointments')
    .select('*')
    .ilike('pet_name', '%Bibi%')
    .order('start_time', { ascending: true });

  if (aErr) console.error('Erro appointments:', aErr);
  else console.log('Appointments:', JSON.stringify(appointments, null, 2));
}

main();
