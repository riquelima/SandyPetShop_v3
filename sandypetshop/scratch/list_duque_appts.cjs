const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase
    .from('agendamento_banhotosa')
    .select('*')
    .eq('monthly_client_id', 'e61476de-b597-44c1-b29b-637dbec4ba82')
    .order('appointment_time', { ascending: true });
  console.log("Total appointments:", data.length);
  for (const item of data) {
    const d = new Date(item.appointment_time);
    const dayOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getUTCDay()];
    const localDayOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(d.getTime() - 3*3600000).getUTCDay()];
    console.log(`${item.id} | ${item.appointment_time} | UTC_day: ${dayOfWeek} | SP_day: ${localDayOfWeek} | status: ${item.status} | resp: ${item.responsible}`);
  }
}

run();
