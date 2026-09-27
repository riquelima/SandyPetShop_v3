import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== TODOS OS MENSALISTAS DE QUINTA-FEIRA (recurrence_day: 4) ===');
  const { data: thursdayClients } = await supabase
    .from('monthly_clients')
    .select('*')
    .eq('recurrence_day', 4);

  thursdayClients.forEach(c => {
    console.log(`ID: ${c.id} | Pet: ${c.pet_name} | Tutor: ${c.owner_name} | Cond: ${c.condominium} | Hora: ${c.recurrence_time}:00 | Tipo: ${c.recurrence_type} | Ativo: ${c.is_active}`);
  });

  console.log('\n=== BUSCAR NINA (ADRIANA) ===');
  const { data: ninaAdriana } = await supabase
    .from('pet_movel_appointments')
    .select('*')
    .ilike('pet_name', '%Nina%');
  
  ninaAdriana.forEach(a => {
    const d = new Date(a.appointment_time);
    console.log(`ID: ${a.id} | Pet: ${a.pet_name} | Tutor: ${a.owner_name} | BRT: ${d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} | Status: ${a.status} | MonthlyId: ${a.monthly_client_id}`);
  });
}

main();
