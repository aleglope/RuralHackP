-- Añadir la columna segment_order si no existe
ALTER TABLE public.travel_segments
ADD COLUMN IF NOT EXISTS segment_order INTEGER;

-- Crear un índice para mejorar el rendimiento si necesitamos ordenar por este campo
CREATE INDEX IF NOT EXISTS idx_travel_segments_segment_order ON public.travel_segments(segment_order);