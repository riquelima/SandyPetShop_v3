import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log('=== MENSALISTAS SAMANTHA ===');
  const { data: mc, error: mcErr } = await supabase
    .from('monthly_clients')
    .select('id, pet_name, owner_name, recurrence_day, recurrence_time, recurrence_type, price, is_active, condominium')
    .or('owner_name.ilike.%Samantha%,pet_name.ilike.%Thor%,pet_name.ilike.%Chanel%,pet_name.ilike.%Bibi%,pet_name.ilike.%Branquinho%,pet_name.ilike.%Koreia%');
  
  console.log(mc);

  console.log('\n=== AGENDAMENTOS PET MOVEL (A PARTIR DE 2026-10-01) ===');
  const { data: pma, error: pmaErr } = await supabase
    .from('pet_movel_appointments')
    .select('id, pet_name, owner_name, appointment_time, status, monthly_client_id, service, condominium')
    .gte('appointment_time', '2026-10-01T00:00:00Z')
    .or('owner_name.ilike.%Samantha%,pet_name.ilike.%Thor%,pet_name.ilike.%Chanel%,pet_name.ilike.%Bibi%,pet_name.ilike.%Branquinho%,pet_name.ilike.%Koreia%')
    .order('appointment_time', { ascending: true });

  for (const a of (pma || [])) {
    const d = new Date(a.appointment_time);
    const spDate = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const spTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' });
    console.log(`[PMA] ${a.id} | ${spDate} (${weekday}) ${spTime} (UTC: ${a.appointment_time}) | Pet: ${a.pet_name} | Owner: ${a.owner_name} | MC_ID: ${a.monthly_client_id} | Status: ${a.status}`);
  }

  console.log('\n=== AGENDAMENTOS APPOINTMENTS (A PARTIR DE 2026-10-01) ===');
  const { data: appts, error: apptErr } = await supabase
    .from('appointments')
    .select('id, pet_name, owner_name, appointment_time, status, monthly_client_id, service, condominium')
    .gte('appointment_time', '2026-10-01T00:00:00Z')
    .or('owner_name.ilike.%Samantha%,pet_name.ilike.%Thor%,pet_name.ilike.%Chanel%,pet_name.ilike.%Bibi%,pet_name.ilike.%Branquinho%,pet_name.ilike.%Koreia%')
    .order('appointment_time', { ascending: true });

  for (const a of (appts || [])) {
    const d = new Date(a.appointment_time);
    const spDate = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const spTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' });
    console.log(`[APPT] ${a.id} | ${spDate} (${weekday}) ${spTime} (UTC: ${a.appointment_time}) | Pet: ${a.pet_name} | Owner: ${a.owner_name} | MC_ID: ${a.monthly_client_id} | Status: ${a.status}`);
  }
}

inspect();
