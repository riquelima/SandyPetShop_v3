const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== MONTHLY CLIENTS FOR DUQUE ===");
  const { data: monthly, error: err1 } = await supabase
    .from('monthly_clients')
    .select('*')
    .ilike('pet_name', '%duque%');
  console.log("Monthly err:", err1);
  console.log("Monthly data:", JSON.stringify(monthly, null, 2));

  console.log("=== AGENDAMENTO_BANHOTOSA FOR DUQUE ===");
  const { data: agendamentos, error: err2 } = await supabase
    .from('agendamento_banhotosa')
    .select('*')
    .ilike('pet_name', '%duque%')
    .order('appointment_time', { ascending: true });
  console.log("Agendamentos err:", err2);
  console.log("Agendamentos data:", JSON.stringify(agendamentos, null, 2));
}

run();
