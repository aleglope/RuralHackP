        ALTER TABLE public.travel_segments
        ADD COLUMN IF NOT EXISTS calculated_carbon_footprint NUMERIC; -- O REAL, o DOUBLE PRECISION según la precisión que necesites