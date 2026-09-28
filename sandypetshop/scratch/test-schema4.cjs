const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: d, error: e } = await supabase.from('daycare_enrollments').select('*').limit(1);
  console.log('daycare_enrollments', Object.keys(d[0] || {}));
  
  const { data: h, error: he } = await supabase.from('hotel_registrations').select('*').limit(1);
  console.log('hotel_registrations', Object.keys(h[0] || {}));
}
main();
