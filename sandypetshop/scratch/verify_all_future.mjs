import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

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

  for (const dateStr of dates) {
    const startOfDay = `${dateStr}T00:00:00-03:00`;
    const endOfDay = `${dateStr}T23:59:59-03:00`;

    const [bathGroomData, petMobileData, regularData] = await Promise.all([
      supabase.from('agendamento_banhotosa').select('*').gte('appointment_time', startOfDay).lte('appointment_time', endOfDay),
      supabase.from('pet_movel_appointments').select('*').gte('appointment_time', startOfDay).lte('appointment_time', endOfDay),
      supabase.from('appointments').select('*').gte('appointment_time', startOfDay).lte('appointment_time', endOfDay)
    ]);

    const all = [
      ...(bathGroomData.data || []),
      ...(petMobileData.data || []),
      ...(regularData.data || [])
    ];

    console.log(`\n📅 ${dateStr} - Agendamentos existentes:`);
    all.forEach(a => {
      const d = new Date(a.appointment_time);
      const brt = d.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      console.log(`   ${brt} | ${a.pet_name} (${a.owner_name}) | ${a.condominium}`);
    });
  }
}

main();
