-- Create favorite_tours table
CREATE TABLE IF NOT EXISTS public.favorite_tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_user UUID NOT NULL REFERENCES public.users(iduser) ON DELETE CASCADE,
    id_tour BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_user, id_tour)
);

-- Add comment
COMMENT ON TABLE public.favorite_tours IS 'Table to store users favorite tours from the Node.js booking system';

-- Disable RLS because security is handled at the Python API level (using custom JWT)
ALTER TABLE public.favorite_tours DISABLE ROW LEVEL SECURITY;

-- Note: If you want to use RLS, you would need to use Supabase Auth or pass the JWT to Supabase.
-- Since the Python BE handles ownership checks, disabling RLS is the simplest fix.
