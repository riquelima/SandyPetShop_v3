import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const { data, error } = await supabase.from('daycare_enrollments').select('pet_photo_url').limit(1);
  console.log('daycare_enrollments pet_photo_url:', data, error);
}
run();
