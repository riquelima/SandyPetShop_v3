const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: d1 } = await supabase
    .from('agendamento_banhotosa')
    .select('id, pet_name, appointment_time, monthly_client_id')
    .gte('appointment_time', '2026-10-01T00:00:00Z')
    .lte('appointment_time', '2026-10-01T23:59:59Z');
  console.log("2026-10-01:", d1);

  const { data: d2 } = await supabase
    .from('agendamento_banhotosa')
    .select('id, pet_name, appointment_time, monthly_client_id')
    .gte('appointment_time', '2026-10-02T00:00:00Z')
    .lte('appointment_time', '2026-10-02T23:59:59Z');
  console.log("2026-10-02:", d2);
}

run();
