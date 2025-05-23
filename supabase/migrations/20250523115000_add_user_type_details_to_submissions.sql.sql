-- project/supabase/migrations/YYYYMMDDHHMMSS_add_user_type_details_to_submissions.sql

ALTER TABLE public.travel_data_submissions
ADD COLUMN IF NOT EXISTS user_type_other_details TEXT NULL;

-- Opcional: Añadir un comentario a la columna para describir su propósito
COMMENT ON COLUMN public.travel_data_submissions.user_type_other_details IS 'Details provided when user_type is "other".';