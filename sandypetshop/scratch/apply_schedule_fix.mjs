import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateSchedule() {
  console.log('=== EXECUTANDO ATUALIZAÇÃO DOS HORÁRIOS ===');

  // 1. Atualizar agendamentos futuros da BIBI para 15:00 BRT (18:00 UTC)
  // ID do mensalista Bibi: 605c4d1b-9b03-4ed6-a6e1-0df155bc1880
  const { data: bibiAppts, error: bibiErr } = await supabase
    .from('appointments')
    .select('id, appointment_time')
    .eq('monthly_client_id', '605c4d1b-9b03-4ed6-a6e1-0df155bc1880')
    .gte('appointment_time', '2026-09-01T00:00:00Z');

  if (bibiErr) {
    console.error('Erro ao buscar Bibi:', bibiErr);
    return;
  }

  console.log(`Atualizando ${bibiAppts.length} agendamentos da Bibi para 15:00 BRT (18:00 UTC)...`);
  for (const appt of bibiAppts) {
    // Manter a data YYYY-MM-DD e ajustar a hora UTC para 18:00:00+00:00 (15:00 no Brasil)
    const datePart = appt.appointment_time.split('T')[0];
    const newTime = `${datePart}T18:00:00+00:00`;
    const { error } = await supabase
      .from('appointments')
      .update({ appointment_time: newTime })
      .eq('id', appt.id);
    if (error) console.error(`Erro ao atualizar Bibi ${appt.id}:`, error);
    else console.log(`  Bibi ${appt.id} (${datePart}) -> ${newTime} (15:00 BRT)`);
  }

  // 2. Atualizar agendamentos futuros da BIJOU para 16:00 BRT (19:00 UTC)
  // ID do mensalista Bijou: 2a6388f1-0c04-40cb-af6c-5d770c94aa6c
  const { data: bijouAppts, error: bijouErr } = await supabase
    .from('pet_movel_appointments')
    .select('id, appointment_time')
    .eq('monthly_client_id', '2a6388f1-0c04-40cb-af6c-5d770c94aa6c')
    .gte('appointment_time', '2026-09-01T00:00:00Z');

  if (bijouErr) {
    console.error('Erro ao buscar Bijou:', bijouErr);
    return;
  }

  console.log(`\nAtualizando ${bijouAppts.length} agendamentos da Bijou para 16:00 BRT (19:00 UTC)...`);
  for (const appt of bijouAppts) {
    const datePart = appt.appointment_time.split('T')[0];
    const newTime = `${datePart}T19:00:00+00:00`;
    const { error } = await supabase
      .from('pet_movel_appointments')
      .update({ appointment_time: newTime })
      .eq('id', appt.id);
    if (error) console.error(`Erro ao atualizar Bijou ${appt.id}:`, error);
    else console.log(`  Bijou ${appt.id} (${datePart}) -> ${newTime} (16:00 BRT)`);
  }

  // 3. Atualizar agendamento avulso da NINA em 10/09/2026 para 17:00 BRT (20:00 UTC)
  const ninaId = '4f29bebd-4256-4787-86d8-5dd16bafb885';
  console.log(`\nAtualizando agendamento da Nina em 10/09/2026 para 17:00 BRT (20:00 UTC)...`);
  const { error: ninaErr } = await supabase
    .from('pet_movel_appointments')
    .update({ appointment_time: '2026-09-10T20:00:00+00:00' })
    .eq('id', ninaId);

  if (ninaErr) console.error('Erro ao atualizar Nina:', ninaErr);
  else console.log(`  Nina ${ninaId} -> 2026-09-10T20:00:00+00:00 (17:00 BRT)`);

  console.log('\n=== ATUALIZAÇÃO CONCLUÍDA ===');
}

updateSchedule();
