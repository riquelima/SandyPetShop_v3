import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDate(dateStr) {
  console.log(`\n================= DATA: ${dateStr} =================`);
  const startOfDay = `${dateStr}T00:00:00-03:00`;
  const endOfDay = `${dateStr}T23:59:59-03:00`;

  const [bathGroomData, petMobileData, regularData] = await Promise.all([
    supabase.from('agendamento_banhotosa').select('*').gte('appointment_time', startOfDay).lte('appointment_time', endOfDay),
    supabase.from('pet_movel_appointments').select('*').gte('appointment_time', startOfDay).lte('appointment_time', endOfDay),
    supabase.from('appointments').select('*').gte('appointment_time', startOfDay).lte('appointment_time', endOfDay)
  ]);

  const all = [
    ...(bathGroomData.data || []).map(a => ({ ...a, source: 'agendamento_banhotosa' })),
    ...(petMobileData.data || []).map(a => ({ ...a, source: 'pet_movel_appointments' })),
    ...(regularData.data || []).map(a => ({ ...a, source: 'appointments' }))
  ].sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));

  console.log(`Total agendamentos: ${all.length}`);
  all.forEach(a => {
    const d = new Date(a.appointment_time);
    const brtTime = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
    console.log(`[${a.source}] ${brtTime} (UTC: ${a.appointment_time}) | Pet: ${a.pet_name} | Tutor: ${a.owner_name} | Cond: ${a.condominium} | Status: ${a.status} | ID: ${a.id}`);
  });
}

async function main() {
  const dates = [
    '2026-09-10',
    '2026-09-24',
    '2026-10-08',
    '2026-10-22',
    '2026-11-05',
    '2026-11-19',
    '2026-12-03',
    '2026-12-17',
    '2026-12-31'
  ];

  for (const d of dates) {
    await checkDate(d);
  }
}

main();
