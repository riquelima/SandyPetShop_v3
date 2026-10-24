-- Tabela para gerenciar dinamicamente a capacidade e grade de horários de atendimento
-- (Pet Móvel e Banho & Tosa Fixo)
CREATE TABLE IF NOT EXISTS public.schedule_slot_configs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    category text NOT NULL, -- 'pet_movel' | 'fixed'
    condominium text,        -- 'Vitta Parque', 'Max Haus', 'Paseo' (ou null para fixo)
    day_of_week integer NOT NULL, -- 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
    hour integer NOT NULL,        -- 8, 9, 10, 11, 12, 13, 14, 15, etc.
    capacity integer NOT NULL DEFAULT 1, -- 0=fechado, 1=1 vaga, 2=2 vagas, etc.
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT schedule_slot_configs_pkey PRIMARY KEY (id),
    CONSTRAINT schedule_slot_configs_unique_slot UNIQUE (category, condominium, day_of_week, hour)
);

-- Índices para buscas rápidas por serviço, condomínio e dia
CREATE INDEX IF NOT EXISTS idx_schedule_slot_configs_query 
ON public.schedule_slot_configs(category, condominium, day_of_week, is_active);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.schedule_slot_configs ENABLE ROW LEVEL SECURITY;

-- Política de leitura pública (para clientes verem os horários disponíveis no site)
CREATE POLICY "Public read schedule_slot_configs" 
ON public.schedule_slot_configs 
FOR SELECT 
USING (true);

-- Política de escrita para administradores (ou anon para controle simplificado)
CREATE POLICY "Admins can manage schedule_slot_configs" 
ON public.schedule_slot_configs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Inserção de dados iniciais padrão:
-- 1. Pet Móvel: Vitta Parque (Quarta-feira = 3, 08h às 15h, 1 vaga)
INSERT INTO public.schedule_slot_configs (category, condominium, day_of_week, hour, capacity, is_active)
VALUES 
  ('pet_movel', 'Vitta Parque', 3, 8, 1, true),
  ('pet_movel', 'Vitta Parque', 3, 9, 1, true),
  ('pet_movel', 'Vitta Parque', 3, 10, 1, true),
  ('pet_movel', 'Vitta Parque', 3, 11, 1, true),
  ('pet_movel', 'Vitta Parque', 3, 12, 1, true),
  ('pet_movel', 'Vitta Parque', 3, 13, 1, true),
  ('pet_movel', 'Vitta Parque', 3, 14, 1, true),
  ('pet_movel', 'Vitta Parque', 3, 15, 1, true)
ON CONFLICT (category, condominium, day_of_week, hour) DO NOTHING;

-- 2. Pet Móvel: Max Haus (Quinta-feira = 4, 08h às 15h, 1 vaga)
INSERT INTO public.schedule_slot_configs (category, condominium, day_of_week, hour, capacity, is_active)
VALUES 
  ('pet_movel', 'Max Haus', 4, 8, 1, true),
  ('pet_movel', 'Max Haus', 4, 9, 1, true),
  ('pet_movel', 'Max Haus', 4, 10, 1, true),
  ('pet_movel', 'Max Haus', 4, 11, 1, true),
  ('pet_movel', 'Max Haus', 4, 12, 1, true),
  ('pet_movel', 'Max Haus', 4, 13, 1, true),
  ('pet_movel', 'Max Haus', 4, 14, 1, true),
  ('pet_movel', 'Max Haus', 4, 15, 1, true)
ON CONFLICT (category, condominium, day_of_week, hour) DO NOTHING;

-- 3. Pet Móvel: Paseo (Sexta-feira = 5, 08h às 15h, 1 vaga)
INSERT INTO public.schedule_slot_configs (category, condominium, day_of_week, hour, capacity, is_active)
VALUES 
  ('pet_movel', 'Paseo', 5, 8, 1, true),
  ('pet_movel', 'Paseo', 5, 9, 1, true),
  ('pet_movel', 'Paseo', 5, 10, 1, true),
  ('pet_movel', 'Paseo', 5, 11, 1, true),
  ('pet_movel', 'Paseo', 5, 12, 1, true),
  ('pet_movel', 'Paseo', 5, 13, 1, true),
  ('pet_movel', 'Paseo', 5, 14, 1, true),
  ('pet_movel', 'Paseo', 5, 15, 1, true)
ON CONFLICT (category, condominium, day_of_week, hour) DO NOTHING;

-- 4. Banho & Tosa Fixo (Terça a Sexta: 10h às 17h, 1 vaga)
INSERT INTO public.schedule_slot_configs (category, condominium, day_of_week, hour, capacity, is_active)
SELECT 
  'fixed', 
  NULL, 
  d, 
  h, 
  1, 
  true
FROM generate_series(2, 5) AS d
CROSS JOIN unnest(ARRAY[10, 11, 12, 14, 15, 16, 17]) AS h
ON CONFLICT (category, condominium, day_of_week, hour) DO NOTHING;
