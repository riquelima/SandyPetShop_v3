const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: monthly } = await supabase.from('monthly_clients').select('id, pet_name, owner_name, whatsapp').ilike('pet_name', '%duque%');
  console.log("monthly_clients Duque:", monthly);

  const { data: pets } = await supabase.from('pets').select('id, name, owner_id').ilike('name', '%duque%');
  console.log("pets Duque:", pets);
}

run();
