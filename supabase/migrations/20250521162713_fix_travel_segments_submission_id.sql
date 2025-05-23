        -- Asume que la tabla public.travel_data_submissions ya existe y tiene una columna id (PK)
        -- También asume que travel_segments ya existe pero le falta submission_id

        ALTER TABLE public.travel_segments
        ADD COLUMN IF NOT EXISTS submission_id BIGINT; -- O UUID si travel_data_submissions.id es UUID
        ALTER TABLE public.travel_segments
        ALTER COLUMN submission_id SET NOT NULL;

        ALTER TABLE public.travel_segments
        ADD CONSTRAINT fk_travel_segments_submission_id
        FOREIGN KEY (submission_id)
        REFERENCES public.travel_data_submissions(id)
        ON DELETE CASCADE;

        -- (Opcional) Crear un índice para mejorar el rendimiento
        CREATE INDEX IF NOT EXISTS idx_travel_segments_submission_id ON public.travel_segments(submission_id);