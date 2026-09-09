import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== BIJOU MENSALISTA ===');
  const { data: bijouClient } = await supabase.from('monthly_clients').select('*').ilike('pet_name', '%Bijou%');
  console.log(JSON.stringify(bijouClient, null, 2));

  console.log('\n=== BIJOU AGENDAMENTOS ===');
  const { data: bijouAppts } = await supabase.from('pet_movel_appointments').select('*').ilike('pet_name', '%Bijou%');
  console.log(`Found ${bijouAppts?.length} in pet_movel_appointments:`);
  bijouAppts?.slice(0, 10).forEach(a => {
    const d = new Date(a.appointment_time);
    console.log(`  UTC: ${a.appointment_time} | BRT: ${d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} | Status: ${a.status}`);
  });

  console.log('\n=== NINA MENSALISTA ===');
  const { data: ninaClient } = await supabase.from('monthly_clients').select('*').ilike('pet_name', '%Nina%');
  console.log(JSON.stringify(ninaClient, null, 2));
}

main();
