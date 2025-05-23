        -- Archivo: supabase/migrations/YYYYMMDDHHMMSS_add_vehicle_other_details.sql
        ALTER TABLE travel_segments
        ADD COLUMN IF NOT EXISTS vehicle_type_other_details TEXT NULL;