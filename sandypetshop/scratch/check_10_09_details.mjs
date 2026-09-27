import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: ninaAppt } = await supabase
    .from('pet_movel_appointments')
    .select('*')
    .eq('id', '4f29bebd-4256-4787-86d8-5dd16bafb885');
  console.log('NINA APPT 10/09:', JSON.stringify(ninaAppt, null, 2));

  const { data: bijouAppt } = await supabase
    .from('pet_movel_appointments')
    .select('*')
    .eq('id', 'dad1ded0-002b-4b1f-92b6-d16583e688fe');
  console.log('BIJOU APPT 10/09:', JSON.stringify(bijouAppt, null, 2));

  const { data: bibiAppt } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', 'e723a2c9-1af8-4bad-9306-22e2ac80e6c0');
  console.log('BIBI APPT 10/09:', JSON.stringify(bibiAppt, null, 2));
}

main();
