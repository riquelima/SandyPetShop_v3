import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: bibiAppts } = await supabase
    .from('appointments')
    .select('*')
    .eq('monthly_client_id', '605c4d1b-9b03-4ed6-a6e1-0df155bc1880')
    .eq('status', 'AGENDADO');

  const { data: bijouAppts } = await supabase
    .from('pet_movel_appointments')
    .select('*')
    .eq('monthly_client_id', '2a6388f1-0c04-40cb-af6c-5d770c94aa6c')
    .eq('status', 'AGENDADO');

  console.log(`Bibi AGENDADO appointments: ${bibiAppts?.length}`);
  bibiAppts?.forEach(a => {
    const d = new Date(a.appointment_time);
    console.log(`  Bibi: ${a.id} | Curr UTC: ${a.appointment_time} | Curr BRT: ${d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })} on ${d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  });

  console.log(`\nBijou AGENDADO appointments: ${bijouAppts?.length}`);
  bijouAppts?.forEach(a => {
    const d = new Date(a.appointment_time);
    console.log(`  Bijou: ${a.id} | Curr UTC: ${a.appointment_time} | Curr BRT: ${d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })} on ${d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  });
}

main();
