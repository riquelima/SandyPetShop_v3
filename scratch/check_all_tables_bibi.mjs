import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const tables = ['appointments', 'pet_movel_appointments', 'agendamento_banhotosa', 'daycare_appointments', 'hotel_reservations'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .or('pet_name.ilike.%Bibi%,owner_name.ilike.%Fabiana%');
    
    if (error) {
      console.log(`Table ${table} error:`, error.message);
    } else {
      console.log(`Table ${table}: found ${data.length} records`);
      data.forEach(d => {
        const timeField = d.appointment_time || d.check_in_date || d.start_time;
        const brt = timeField ? new Date(timeField).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'N/A';
        console.log(`  [${table}] ID: ${d.id} | Pet: ${d.pet_name} | Date: ${timeField} (BRT: ${brt}) | Status: ${d.status}`);
      });
    }
  }
}

main();
