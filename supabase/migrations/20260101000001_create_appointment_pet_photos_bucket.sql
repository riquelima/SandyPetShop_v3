-- Cria bucket publico appointment_pet_photos para armazenar fotos do pet enviadas no agendamento externo
-- ATENCAO: este projeto Supabase (ffxpsothavxbrdhshtoj) NAO e o banco real do Sandy Pet Shop.
-- A instrucao foi explicita do usuario para criar o bucket aqui mesmo.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'appointment_pet_photos',
  'appointment_pet_photos',
  true,
  5242880, -- 5 MB
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Politicas de acesso publico para leitura
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read appointment_pet_photos'
  ) THEN
    CREATE POLICY "Public read appointment_pet_photos"
      ON storage.objects FOR SELECT
      USING ( bucket_id = 'appointment_pet_photos' );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public insert appointment_pet_photos'
  ) THEN
    CREATE POLICY "Public insert appointment_pet_photos"
      ON storage.objects FOR INSERT
      WITH CHECK ( bucket_id = 'appointment_pet_photos' );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public update appointment_pet_photos'
  ) THEN
    CREATE POLICY "Public update appointment_pet_photos"
      ON storage.objects FOR UPDATE
      USING ( bucket_id = 'appointment_pet_photos' );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public delete appointment_pet_photos'
  ) THEN
    CREATE POLICY "Public delete appointment_pet_photos"
      ON storage.objects FOR DELETE
      USING ( bucket_id = 'appointment_pet_photos' );
  END IF;
END $$;
