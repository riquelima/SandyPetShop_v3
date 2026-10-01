const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: monthly } = await supabase
    .from('monthly_clients')
    .select('*')
    .ilike('pet_name', '%duque%');
  console.log("MONTHLY RECORD:", JSON.stringify(monthly, null, 2));

  const { data: allAgendamentos } = await supabase
    .from('agendamento_banhotosa')
    .select('id, appointment_time, status, service, responsible')
    .ilike('pet_name', '%duque%')
    .order('appointment_time', { ascending: true });
  console.log("AGENDAMENTOS:", JSON.stringify(allAgendamentos, null, 2));
}

run();
