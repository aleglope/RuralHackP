    -- project/supabase/migrations/[timestamp]_create_custom_enums.sql

    CREATE TYPE public.user_type_enum AS ENUM (
        'public',
        'participant',
        'logistics',
        'provider',
        'staff',
        'other'
    );

    CREATE TYPE public.transport_type_enum AS ENUM (
        'walking',
        'bicycle',
        'motorcycle',
        'car',
        'van',
        'bus',
        'truck',
        'train',
        'plane',
        'other'
    );

    CREATE TYPE public.fuel_type_enum AS ENUM (
        'gasoline',
        'diesel',
        'hybrid',
        'pluginHybrid',
        'electric'
    );

    CREATE TYPE public.van_truck_size_enum AS ENUM (
        '<7.5t',
        '7.5-12t',
        '20-26t',
        '34-40t',
        '50-60t'
    );