DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'unknown' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'fuel_type_enum')) THEN
        ALTER TYPE public.fuel_type_enum ADD VALUE 'unknown';
    END IF;
END$$;


DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'other' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'fuel_type_enum')) THEN
        ALTER TYPE public.fuel_type_enum ADD VALUE 'other';
    END IF;
END$$; 