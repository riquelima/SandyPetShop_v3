import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xilavhopbmjhsovvybza.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpbGF2aG9wYm1qaHNvdnZ5YnphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDA2MTgsImV4cCI6MjA4OTcxNjYxOH0.DaGBDdCplBebKEO9epY2L5ZPRvslktQzwo072o7rRwI';

const supabase = createClient(supabaseUrl, supabaseKey);

const THOR_MC_ID = '60e31493-894d-470e-95ba-f5de1eaf9cb9';
const CHANEL_BIBI_MC_ID = 'ed789a33-b441-440d-9d87-bc795969d760';
const BRANQUINHO_KOREIA_MC_ID = '357c261e-4265-428c-963c-cbade392ae46';

async function fix() {
  console.log('--- 1. ATUALIZANDO TABELA monthly_clients ---');
  
  // 1.1 Thor: Quarta às 15h
  const { error: errThorMC } = await supabase
    .from('monthly_clients')
    .update({
      pet_name: 'Thor',
      owner_name: 'Samantha',
      recurrence_day: 3,
      recurrence_time: 15,
      condominium: 'Vitta Parque 131 torre 1',
      price: 340,
      is_active: true
    })
    .eq('id', THOR_MC_ID);
  if (errThorMC) console.error('Erro ao atualizar Thor MC:', errThorMC);
  else console.log('✓ Mensalista Thor atualizado: Quarta às 15:00');

  // 1.2 Chanel e Bibi: Quarta às 13h
  const { error: errChanelMC } = await supabase
    .from('monthly_clients')
    .update({
      pet_name: 'Chanel e Bibi',
      owner_name: 'Samantha',
      recurrence_day: 3,
      recurrence_time: 13,
      condominium: 'Vitta Parque',
      price: 640,
      is_active: true
    })
    .eq('id', CHANEL_BIBI_MC_ID);
  if (errChanelMC) console.error('Erro ao atualizar Chanel e Bibi MC:', errChanelMC);
  else console.log('✓ Mensalista Chanel e Bibi atualizado: Quarta às 13:00');

  // 1.3 Branquinho e Koreia: Quarta às 14h
  const { error: errBranqMC } = await supabase
    .from('monthly_clients')
    .update({
      pet_name: 'Branquinho e Koreia',
      owner_name: 'Samantha',
      recurrence_day: 3,
      recurrence_time: 14,
      condominium: 'Vitta Parque 131 t 01',
      price: 640,
      is_active: true
    })
    .eq('id', BRANQUINHO_KOREIA_MC_ID);
  if (errBranqMC) console.error('Erro ao atualizar Branquinho e Koreia MC:', errBranqMC);
  else console.log('✓ Mensalista Branquinho e Koreia atualizado: Quarta às 14:00');

  console.log('\n--- 2. ATUALIZANDO AGENDAMENTOS FUTUROS (04/11 até 30/12) ---');

  // 2.1 Atualizar agendamentos existentes de Chanel e Bibi: mudar de 15:00 UTC (12:00 BRT) para 16:00 UTC (13:00 BRT), ajustar nome para "Chanel e Bibi" e preço para 160
  const { data: bibiAppts, error: errFetchBibi } = await supabase
    .from('pet_movel_appointments')
    .select('id, appointment_time')
    .eq('monthly_client_id', CHANEL_BIBI_MC_ID)
    .gte('appointment_time', '2026-11-01T00:00:00Z');

  if (errFetchBibi) console.error('Erro buscando agendamentos Bibi:', errFetchBibi);
  else {
    for (const appt of bibiAppts) {
      // Ajustar data mantendo o dia, mas definindo 16:00 UTC (13:00 BRT)
      const d = new Date(appt.appointment_time);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const newTime = `${y}-${m}-${day}T16:00:00+00:00`;

      const { error: errUpBibi } = await supabase
        .from('pet_movel_appointments')
        .update({
          pet_name: 'Chanel e Bibi',
          owner_name: 'Samantha',
          appointment_time: newTime,
          price: 160,
          condominium: 'Vitta Parque',
          service: 'Banho (Pet Móvel)'
        })
        .eq('id', appt.id);

      if (errUpBibi) console.error(`Erro atualizando agendamento ${appt.id}:`, errUpBibi);
      else console.log(`✓ Chanel e Bibi agendamento ${day}/${m} atualizado para 13:00 BRT (${newTime})`);
    }
  }

  // 2.2 Atualizar agendamentos de Branquinho e Koreia: padronizar pet_name, owner_name, preço
  const { data: branqAppts } = await supabase
    .from('pet_movel_appointments')
    .select('id, appointment_time')
    .eq('monthly_client_id', BRANQUINHO_KOREIA_MC_ID)
    .gte('appointment_time', '2026-11-01T00:00:00Z');

  for (const appt of (branqAppts || [])) {
    const d = new Date(appt.appointment_time);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const y = d.getUTCFullYear();
    const newTime = `${y}-${m}-${day}T17:00:00+00:00`; // 14:00 BRT

    await supabase
      .from('pet_movel_appointments')
      .update({
        pet_name: 'Branquinho e Koreia',
        owner_name: 'Samantha',
        appointment_time: newTime,
        price: 160,
        condominium: 'Vitta Parque 131 t 01',
        service: 'Banho (Pet Móvel)'
      })
      .eq('id', appt.id);
    console.log(`✓ Branquinho e Koreia agendamento ${day}/${m} verificado para 14:00 BRT`);
  }

  // 2.3 Atualizar agendamentos de Thor: padronizar pet_name, owner_name, preço
  const { data: thorAppts } = await supabase
    .from('pet_movel_appointments')
    .select('id, appointment_time')
    .eq('monthly_client_id', THOR_MC_ID)
    .gte('appointment_time', '2026-11-01T00:00:00Z');

  for (const appt of (thorAppts || [])) {
    const d = new Date(appt.appointment_time);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const y = d.getUTCFullYear();
    const newTime = `${y}-${m}-${day}T18:00:00+00:00`; // 15:00 BRT

    await supabase
      .from('pet_movel_appointments')
      .update({
        pet_name: 'Thor',
        owner_name: 'Samantha',
        appointment_time: newTime,
        price: 85,
        condominium: 'Vitta Parque 131 torre 1',
        service: 'Banho (Pet Móvel)'
      })
      .eq('id', appt.id);
    console.log(`✓ Thor agendamento ${day}/${m} verificado para 15:00 BRT`);
  }

  console.log('\n--- 3. CRIANDO AGENDAMENTOS PARA 28/10/2026 ---');
  // Verificar se já existe agendamento em 28/10 para evitar duplicidade
  const { data: existingOct28 } = await supabase
    .from('pet_movel_appointments')
    .select('id, monthly_client_id, pet_name')
    .gte('appointment_time', '2026-10-28T00:00:00Z')
    .lte('appointment_time', '2026-10-28T23:59:59Z')
    .in('monthly_client_id', [THOR_MC_ID, CHANEL_BIBI_MC_ID, BRANQUINHO_KOREIA_MC_ID]);

  const existingMcIds = new Set((existingOct28 || []).map(x => x.monthly_client_id));

  // 3.1 Chanel e Bibi em 28/10 às 13:00 BRT (16:00 UTC)
  if (!existingMcIds.has(CHANEL_BIBI_MC_ID)) {
    const { error: insBibi } = await supabase
      .from('pet_movel_appointments')
      .insert({
        pet_name: 'Chanel e Bibi',
        pet_breed: 'Lulu',
        owner_name: 'Samantha',
        owner_address: 'Vitta',
        condominium: 'Vitta Parque',
        whatsapp: '(11) 98206-5079',
        service: 'Banho (Pet Móvel)',
        weight: 'Pequeno',
        price: 160,
        status: 'AGENDADO',
        monthly_client_id: CHANEL_BIBI_MC_ID,
        appointment_time: '2026-10-28T16:00:00+00:00',
        observation: 'Não colocar acessórios ',
        cancelled_by_client: false
      });
    if (insBibi) console.error('Erro inserindo Chanel e Bibi 28/10:', insBibi);
    else console.log('✓ Chanel e Bibi agendado para 28/10/2026 às 13:00 BRT (16:00 UTC)');
  } else {
    console.log('Chanel e Bibi já existe em 28/10');
  }

  // 3.2 Branquinho e Koreia em 28/10 às 14:00 BRT (17:00 UTC)
  if (!existingMcIds.has(BRANQUINHO_KOREIA_MC_ID)) {
    const { error: insBranq } = await supabase
      .from('pet_movel_appointments')
      .insert({
        pet_name: 'Branquinho e Koreia',
        pet_breed: 'Lulu',
        owner_name: 'Samantha',
        owner_address: 'Vitta',
        condominium: 'Vitta Parque 131 t 01',
        whatsapp: '(11) 98206-5079',
        service: 'Banho (Pet Móvel)',
        weight: 'Até 5kg',
        price: 160,
        status: 'AGENDADO',
        monthly_client_id: BRANQUINHO_KOREIA_MC_ID,
        appointment_time: '2026-10-28T17:00:00+00:00',
        observation: 'Mesma Família \nNão colocar acessórios ',
        cancelled_by_client: false
      });
    if (insBranq) console.error('Erro inserindo Branquinho e Koreia 28/10:', insBranq);
    else console.log('✓ Branquinho e Koreia agendado para 28/10/2026 às 14:00 BRT (17:00 UTC)');
  } else {
    console.log('Branquinho e Koreia já existe em 28/10');
  }

  // 3.3 Thor em 28/10 às 15:00 BRT (18:00 UTC)
  if (!existingMcIds.has(THOR_MC_ID)) {
    const { error: insThor } = await supabase
      .from('pet_movel_appointments')
      .insert({
        pet_name: 'Thor',
        pet_breed: 'Lulu',
        owner_name: 'Samantha',
        owner_address: 'Vitta',
        condominium: 'Vitta Parque 131 torre 1',
        whatsapp: '(11) 98206-5079',
        service: 'Banho (Pet Móvel)',
        weight: 'Até 10kg',
        price: 85,
        status: 'AGENDADO',
        monthly_client_id: THOR_MC_ID,
        appointment_time: '2026-10-28T18:00:00+00:00',
        observation: 'Mesma família \nMaior \nNão colocar acessórios ',
        cancelled_by_client: false
      });
    if (insThor) console.error('Erro inserindo Thor 28/10:', insThor);
    else console.log('✓ Thor agendado para 28/10/2026 às 15:00 BRT (18:00 UTC)');
  } else {
    console.log('Thor já existe em 28/10');
  }

  console.log('\n--- 4. CONFERINDO RESULTADO FINAL ---');
  const { data: finalAppts } = await supabase
    .from('pet_movel_appointments')
    .select('id, pet_name, owner_name, appointment_time, price, status')
    .gte('appointment_time', '2026-10-28T00:00:00Z')
    .in('monthly_client_id', [THOR_MC_ID, CHANEL_BIBI_MC_ID, BRANQUINHO_KOREIA_MC_ID])
    .order('appointment_time', { ascending: true });

  console.log(`Total de agendamentos futuros encontrados: ${finalAppts?.length}`);
  finalAppts?.forEach(a => {
    const d = new Date(a.appointment_time);
    const spDate = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const spTime = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    console.log(`${spDate} às ${spTime} | Pet: ${a.pet_name} | Preço: R$ ${a.price} | Status: ${a.status}`);
  });
}

fix();
