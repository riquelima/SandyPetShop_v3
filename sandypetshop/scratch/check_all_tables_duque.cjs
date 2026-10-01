const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tables = ['appointments', 'agendamento_banhotosa', 'pet_movel_appointments'];
  for (const t of tables) {
    const { data, error } = await supabase
      .from(t)
      .select('id, appointment_time, status, pet_name, service')
      .ilike('pet_name', '%duque%');
    console.log(`Table ${t}: ${data ? data.length : 0} items, err: ${error ? error.message : null}`);
    if (data && data.length > 0) {
      console.log(data);
    }
  }
}

run();
