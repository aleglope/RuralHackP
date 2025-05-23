-- Migración para establecer políticas RLS correctas para la nueva estructura
-- travel_segments -> travel_data_submissions -> events

-- Habilitar RLS en travel_segments si no está habilitado
ALTER TABLE public.travel_segments ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en travel_data_submissions
ALTER TABLE public.travel_data_submissions ENABLE ROW LEVEL SECURITY;

-- Políticas para travel_data_submissions
CREATE POLICY "Allow insert for active events"
  ON public.travel_data_submissions
  FOR INSERT
  TO public
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE is_active = true)
  );

CREATE POLICY "Allow read access for active events" 
  ON public.travel_data_submissions
  FOR SELECT
  TO public
  USING (
    event_id IN (SELECT id FROM public.events WHERE is_active = true)
  );

-- Políticas para travel_segments que usan la relación indirecta
CREATE POLICY "Allow insert for segments linked to active events"
  ON public.travel_segments
  FOR INSERT
  TO public
  WITH CHECK (
    submission_id IN (
      SELECT tds.id 
      FROM public.travel_data_submissions tds
      JOIN public.events e ON tds.event_id = e.id
      WHERE e.is_active = true
    )
  );

CREATE POLICY "Allow read access for segments linked to active events"
  ON public.travel_segments  
  FOR SELECT
  TO public
  USING (
    submission_id IN (
      SELECT tds.id
      FROM public.travel_data_submissions tds
      JOIN public.events e ON tds.event_id = e.id  
      WHERE e.is_active = true
    )
  );

-- Crear índices para mejorar el rendimiento de las consultas de las políticas
CREATE INDEX IF NOT EXISTS idx_travel_data_submissions_event_id ON public.travel_data_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active); 