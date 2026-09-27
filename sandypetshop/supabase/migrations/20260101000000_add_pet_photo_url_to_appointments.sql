-- Adiciona coluna pet_photo_url às tabelas de agendamento para suportar foto do pet no card do admin
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS pet_photo_url text;

ALTER TABLE public.pet_movel_appointments
  ADD COLUMN IF NOT EXISTS pet_photo_url text;

ALTER TABLE public.agendamento_banhotosa
  ADD COLUMN IF NOT EXISTS pet_photo_url text;