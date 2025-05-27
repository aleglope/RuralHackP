    ALTER TABLE public.travel_segments
    DROP COLUMN IF EXISTS carbon_footprint,
    DROP COLUMN IF EXISTS hotel_nights,
    DROP COLUMN IF EXISTS comments;

    ALTER TABLE public.travel_data_submissions
    DROP COLUMN IF EXISTS submitted_at;