import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== 1. ALL APPOINTMENTS FOR BIBI (monthly_client_id: 605c4d1b-9b03-4ed6-a6e1-0df155bc1880) ===');
  const { data: bibiAppts } = await supabase
    .from('appointments')
    .select('*')
    .eq('monthly_client_id', '605c4d1b-9b03-4ed6-a6e1-0df155bc1880')
    .order('appointment_time', { ascending: true });

  console.log(`Found ${bibiAppts?.length} appointments for Bibi:`);
  bibiAppts?.forEach(a => {
    const utcDate = new Date(a.appointment_time);
    // local string in America/Sao_Paulo
    const brtString = utcDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`ID: ${a.id} | UTC: ${a.appointment_time} | BRT: ${brtString} | Status: ${a.status} | Price: ${a.price}`);
  });

  console.log('\n=== 2. ALL APPOINTMENTS ON 2026-09-10 (ALL CLIENTS) ===');
  const { data: dayAppts } = await supabase
    .from('appointments')
    .select('*')
    .gte('appointment_time', '2026-09-10T00:00:00Z')
    .lte('appointment_time', '2026-09-10T23:59:59Z')
    .order('appointment_time', { ascending: true });

  console.log(`Found ${dayAppts?.length} appointments on 2026-09-10:`);
  dayAppts?.forEach(a => {
    const utcDate = new Date(a.appointment_time);
    const brtString = utcDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`Pet: ${a.pet_name} | Tutor: ${a.owner_name} | Condomínio: ${a.condominium} | UTC: ${a.appointment_time} | BRT: ${brtString} | Status: ${a.status}`);
  });

  console.log('\n=== 3. ALL APPOINTMENTS ON 2026-09-24 (ALL CLIENTS) ===');
  const { data: day2Appts } = await supabase
    .from('appointments')
    .select('*')
    .gte('appointment_time', '2026-09-24T00:00:00Z')
    .lte('appointment_time', '2026-09-24T23:59:59Z')
    .order('appointment_time', { ascending: true });

  console.log(`Found ${day2Appts?.length} appointments on 2026-09-24:`);
  day2Appts?.forEach(a => {
    const utcDate = new Date(a.appointment_time);
    const brtString = utcDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    console.log(`Pet: ${a.pet_name} | Tutor: ${a.owner_name} | Condomínio: ${a.condominium} | UTC: ${a.appointment_time} | BRT: ${brtString} | Status: ${a.status}`);
  });

  console.log('\n=== 4. CHECK OTHER CLIENTS OF FABIANA OR MAX HAUS ===');
  const { data: fabianaClients } = await supabase
    .from('monthly_clients')
    .select('*')
    .or('owner_name.ilike.%Fabiana%,condominium.ilike.%Max%Haus%');

  console.log(`Found ${fabianaClients?.length} monthly clients matching Fabiana / Max Haus:`);
  fabianaClients?.forEach(c => {
    console.log(`ID: ${c.id} | Pet: ${c.pet_name} | Owner: ${c.owner_name} | Cond: ${c.condominium} | Day: ${c.recurrence_day} | Time: ${c.recurrence_time} | Type: ${c.recurrence_type}`);
  });
}

main();
