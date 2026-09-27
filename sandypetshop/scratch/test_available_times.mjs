import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

const PET_MOBILE_HOURS = [9, 10, 11, 12, 14, 15, 16, 17];

const getHourBRT = (appointmentTime) => {
  return parseInt(
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' })
      .format(new Date(appointmentTime)),
    10
  );
};

async function testAvailableTimes(dateStr) {
  const startOfDay = `${dateStr}T00:00:00-03:00`;
  const endOfDay = `${dateStr}T23:59:59-03:00`;

  const [bathGroomData, petMobileData, regularData, inactiveClientsRes] = await Promise.all([
    supabase.from('agendamento_banhotosa').select('appointment_time, condominium, status, monthly_client_id, service').gte('appointment_time', startOfDay).lte('appointment_time', endOfDay),
    supabase.from('pet_movel_appointments').select('appointment_time, condominium, status, monthly_client_id, service').gte('appointment_time', startOfDay).lte('appointment_time', endOfDay),
    supabase.from('appointments').select('appointment_time, condominium, status, monthly_client_id, service').gte('appointment_time', startOfDay).lte('appointment_time', endOfDay),
    supabase.from('monthly_clients').select('id').eq('is_active', false)
  ]);

  const inactiveIds = new Set((inactiveClientsRes.data || []).map(c => c.id));

  const allAppointments = [
    ...(bathGroomData.data || []),
    ...(petMobileData.data || []),
    ...(regularData.data || [])
  ].filter(apt => !apt.monthly_client_id || !inactiveIds.has(apt.monthly_client_id));

  const maxHausAppts = allAppointments.filter(apt => apt.condominium === 'Max Haus' && apt.status !== 'cancelled');
  const bookedHours = maxHausAppts.map(apt => getHourBRT(apt.appointment_time));
  const availableHours = PET_MOBILE_HOURS.filter(h => !bookedHours.includes(h));

  console.log(`📅 ${dateStr} (Max Haus):`);
  console.log(`   Horários Ocupados: ${bookedHours.sort((a,b)=>a-b).map(h=>`${h}:00`).join(', ')}`);
  console.log(`   Horários Disponíveis: ${availableHours.length ? availableHours.map(h=>`${h}:00`).join(', ') : 'Nenhum (Dia Cheio)'}`);
}

async function main() {
  await testAvailableTimes('2026-09-10');
  await testAvailableTimes('2026-09-24');
  await testAvailableTimes('2026-10-08');
}

main();
