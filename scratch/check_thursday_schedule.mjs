import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== VERIFICANDO TODOS OS AGENDAMENTOS EM QUINTAS-FEIRAS DE 2026 NO MAX HAUS ===');
  
  // Buscar agendamentos a partir de setembro de 2026
  const { data: appts, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('appointment_time', '2026-09-01T00:00:00Z')
    .lte('appointment_time', '2026-12-31T23:59:59Z')
    .order('appointment_time', { ascending: true });

  const { data: petMovelAppts } = await supabase
    .from('pet_movel_appointments')
    .select('*')
    .gte('appointment_time', '2026-09-01T00:00:00Z')
    .lte('appointment_time', '2026-12-31T23:59:59Z')
    .order('appointment_time', { ascending: true });

  const all = [...(appts || []), ...(petMovelAppts || [])];

  // Group by date (in BRT)
  const byDate = {};
  all.forEach(a => {
    const d = new Date(a.appointment_time);
    const brtDate = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const brtTime = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    const dayOfWeek = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' });
    
    if (!byDate[brtDate]) byDate[brtDate] = { dayOfWeek, items: [] };
    byDate[brtDate].items.push({
      id: a.id,
      pet: a.pet_name,
      tutor: a.owner_name,
      condo: a.condominium,
      service: a.service,
      brtTime,
      utc: a.appointment_time,
      status: a.status,
      monthly_client_id: a.monthly_client_id
    });
  });

  for (const [date, info] of Object.entries(byDate)) {
    if (info.dayOfWeek.toLowerCase().includes('quinta')) {
      console.log(`\n📅 ${date} (${info.dayOfWeek}):`);
      info.items.forEach(it => {
        console.log(`   ⏰ ${it.brtTime} | Pet: ${it.pet} | Tutor: ${it.tutor} | Cond: ${it.condo} | Status: ${it.status} | ID: ${it.id} | MensalistaID: ${it.monthly_client_id}`);
      });
    }
  }
}

main();
