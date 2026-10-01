const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

const updates = [
  { id: '490758f6-afaf-4967-8108-5dc2c593b231', newTime: '2026-10-01T17:00:00+00:00' }, // 01/10/2026 Qui 14:00
  { id: '43f0f544-b105-45e0-865c-51c9c7840b01', newTime: '2026-10-08T17:00:00+00:00' }, // 08/10/2026 Qui 14:00
  { id: '6b5d93ef-4b6b-4838-bd99-4b2f68e06c2e', newTime: '2026-10-15T17:00:00+00:00' }, // 15/10/2026 Qui 14:00
  { id: '0722df86-8088-4e2c-92fa-48c5f78fd31a', newTime: '2026-10-22T17:00:00+00:00' }, // 22/10/2026 Qui 14:00
  { id: '848d5921-6b96-4a3f-8ad4-1934b9933485', newTime: '2026-10-29T17:00:00+00:00' }, // 29/10/2026 Qui 14:00
  { id: 'ee787e58-0671-4ca8-bcfe-e33077c133ec', newTime: '2026-11-05T17:00:00+00:00' }, // 05/11/2026 Qui 14:00
  { id: '62d8edf2-c1a0-4060-841d-3cd5876f7117', newTime: '2026-11-12T17:00:00+00:00' }, // 12/11/2026 Qui 14:00
  { id: '264bb35f-1d67-4a86-983c-a91e26b35444', newTime: '2026-11-19T17:00:00+00:00' }, // 19/11/2026 Qui 14:00
  { id: 'b0d837fd-c41e-4c62-a2ee-06d808687c9d', newTime: '2026-11-26T17:00:00+00:00' }, // 26/11/2026 Qui 14:00
  { id: '1850151a-64aa-42dd-b066-721a9bc86842', newTime: '2026-12-03T17:00:00+00:00' }, // 03/12/2026 Qui 14:00
  { id: 'b595a6c5-8b1c-4b1b-b1cc-55442c7443db', newTime: '2026-12-10T17:00:00+00:00' }, // 10/12/2026 Qui 14:00
  { id: 'a695cc3f-91b3-4ab0-8957-7cf3b2efb911', newTime: '2026-12-17T17:00:00+00:00' }, // 17/12/2026 Qui 14:00
  { id: 'acdae19c-b65c-448d-9f65-e8c03a39ffa1', newTime: '2026-12-24T17:00:00+00:00' }, // 24/12/2026 Qui 14:00
];

async function run() {
  console.log("Updating Duque appointments...");
  for (const item of updates) {
    const { data, error } = await supabase
      .from('agendamento_banhotosa')
      .update({ appointment_time: item.newTime })
      .eq('id', item.id)
      .select('id, appointment_time, status, responsible');
    if (error) {
      console.error(`Error updating ${item.id}:`, error);
    } else {
      console.log(`Updated ${item.id} -> ${item.newTime}:`, data);
    }
  }

  // Check if 31/12/2026 already exists or insert it
  const { data: dec31 } = await supabase
    .from('agendamento_banhotosa')
    .select('id')
    .eq('monthly_client_id', 'e61476de-b597-44c1-b29b-637dbec4ba82')
    .eq('appointment_time', '2026-12-31T17:00:00+00:00');

  if (!dec31 || dec31.length === 0) {
    console.log("Inserting 31/12/2026 appointment for Duque...");
    const { data: newRow, error: insertErr } = await supabase
      .from('agendamento_banhotosa')
      .insert({
        appointment_time: '2026-12-31T17:00:00+00:00',
        pet_name: 'duque',
        pet_breed: 'maltes ',
        owner_name: 'ariany',
        owner_address: 'aqui na rua da creche ',
        whatsapp: '(11) 98539-6380',
        service: 'Banho (Pet Móvel)',
        weight: 'Até 5kg',
        addons: null,
        price: 65,
        status: 'AGENDADO',
        monthly_client_id: 'e61476de-b597-44c1-b29b-637dbec4ba82',
        condominium: 'Banho & Tosa Fixo',
        extra_services: null,
        observation: '',
        responsible: null,
        owner_cpf: '00000000000',
        pet_photo_url: null
      })
      .select();
    console.log("Inserted 31/12/2026:", newRow, insertErr);
  }

  console.log("\n=== VERIFYING ALL DUQUE APPOINTMENTS FROM OCTOBER ===");
  const { data: finalData } = await supabase
    .from('agendamento_banhotosa')
    .select('id, appointment_time, status, responsible')
    .eq('monthly_client_id', 'e61476de-b597-44c1-b29b-637dbec4ba82')
    .gte('appointment_time', '2026-10-01T00:00:00+00:00')
    .order('appointment_time', { ascending: true });

  for (const r of finalData) {
    const d = new Date(r.appointment_time);
    const dateStr = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'America/Sao_Paulo' });
    console.log(`${r.id} | ${dateStr} (${dayName}), ${timeStr} | ${r.status} | resp: ${r.responsible}`);
  }
}

run();
