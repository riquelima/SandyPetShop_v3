-- Correção de recorrência do mensalista Duque (ariany)
-- Problema: agendamentos gerados nas sextas (recurrence_day=5) em vez de quinta (recurrence_day=4)
-- Ação:
--   1. Mover os agendamentos futuros AGENDADOS de sexta -> quinta (D-1)
--   2. Criar agendamento para HOJE (01/10/2026 quinta) que está faltando
--   3. Atualizar recurrence_day para 4 (quinta) e recurrence_time para 14 no cadastro do mensalista
--   4. NÃO alterar registros CONCLUÍDOS (histórico)

BEGIN;

-- 1) Atualizar o cadastro do mensalista para refletir Quinta 14:00
UPDATE monthly_clients
SET recurrence_day = 4,   -- 4 = quinta-feira
    recurrence_time = 14
WHERE pet_name ILIKE 'Duque'
  AND owner_name ILIKE '%ariany%';

-- 2) Mover agendamentos futuros AGENDADOS de sexta -> quinta (D-1 dia)
--    Não tocamos em CONCLUÍDOS para preservar histórico financeiro
UPDATE agendamento_banhotosa
SET appointment_time = appointment_time - INTERVAL '1 day'
WHERE id IN (
    '430f5444-b105-45e0-865c-51c9c7840b01',  -- 2026-10-09 sex -> qui
    '6b5d93ef-4b6b-4838-bd99-4b2f68e06c2e',  -- 2026-10-16 sex -> qui
    '0722df86-8088-4e2c-92fa-48c5f78fd31a',  -- 2026-10-23 sex -> qui
    '848d5921-6b96-4a3f-8ad4-1934b9933485',  -- 2026-10-30 sex -> qui
    'ee787e58-0671-4ca8-bcfe-e33077c133ec'   -- 2026-11-06 sex -> qui
)
AND status = 'AGENDADO';

-- 3) Criar o agendamento de HOJE (quinta, 01/10/2026 14:00) que estava faltando
--    Usamos o monthly_client_id de qualquer agendamento do Duque (todos compartilham o mesmo FK)
INSERT INTO agendamento_banhotosa (
    appointment_time,
    pet_name,
    owner_name,
    whatsapp,
    service,
    weight,
    addons,
    price,
    status,
    monthly_client_id,
    responsible
)
SELECT
    '2026-10-01 14:00:00+00'::timestamptz,
    'Duque',
    mc.owner_name,
    mc.whatsapp,
    mc.service,
    mc.weight,
    NULL,
    mc.price,
    'AGENDADO',
    mc.id,
    'Haslan'
FROM monthly_clients mc
WHERE mc.pet_name ILIKE 'Duque'
  AND mc.owner_name ILIKE '%ariany%'
LIMIT 1
ON CONFLICT DO NOTHING;

COMMIT;
