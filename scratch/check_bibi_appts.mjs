import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: appts, error } = await supabase
    .from('appointments')
    .select('*')
    .ilike('pet_name', '%Bibi%')
    .limit(20);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Appointments for Bibi count:', appts.length);
    console.log(JSON.stringify(appts, null, 2));
  }
}

main();
