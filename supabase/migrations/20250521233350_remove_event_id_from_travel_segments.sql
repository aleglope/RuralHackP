    -- Eliminar las políticas RLS dependientes
    ALTER TABLE public.travel_segments DISABLE ROW LEVEL SECURITY; -- Puede ser necesario deshabilitar RLS temporalmente para dropear policies, o no.
    DROP POLICY IF EXISTS "Allow insert for active events" ON public.travel_segments;
    DROP POLICY IF EXISTS "Allow read access for active events" ON public.travel_segments;

    -- Primero, eliminar la restricción de clave foránea específica
    ALTER TABLE public.travel_segments
    DROP CONSTRAINT IF EXISTS travel_segments_event_id_fkey;

    -- Luego, eliminar la columna
    ALTER TABLE public.travel_segments
    DROP COLUMN IF EXISTS event_id;