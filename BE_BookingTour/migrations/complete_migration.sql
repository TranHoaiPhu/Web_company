-- Complete Migration Script for New Features
-- Run this to add all missing tables and columns

-- ============================================
-- 1. REVIEWS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id BIGSERIAL PRIMARY KEY,
    tour_id BIGINT NOT NULL,
    user_id UUID,
    order_id BIGINT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images TEXT[],
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reviews_tour_id ON public.reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

COMMENT ON TABLE public.reviews IS 'Bảng lưu trữ đánh giá của khách hàng về tours';

-- ============================================
-- 2. Update existing tables if needed
-- ============================================

-- Add user_id to orders if not exists (for reviews relationship)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN user_id UUID;
        ALTER TABLE orders ADD CONSTRAINT fk_orders_user 
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add payment_method to orders if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_method public.payment_method;
    END IF;
END $$;

-- ============================================
-- 3. Verify all required tables exist
-- ============================================

-- Check amenities table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'amenities') THEN
        RAISE NOTICE 'WARNING: amenities table does not exist. It should be created from the main schema.';
    END IF;
END $$;

-- Check places table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'places') THEN
        RAISE NOTICE 'WARNING: places table does not exist. It should be created from the main schema.';
    END IF;
END $$;

-- Check payments table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        RAISE NOTICE 'WARNING: payments table does not exist. It should be created from the main schema.';
    END IF;
END $$;

-- ============================================
-- 4. Add indexes for performance
-- ============================================

-- Tours indexes for search
CREATE INDEX IF NOT EXISTS idx_tours_name_trgm ON tours USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_tours_featured ON tours(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_tours_hot_deal ON tours(is_hot_deal) WHERE is_hot_deal = true;

-- Locations indexes for search
CREATE INDEX IF NOT EXISTS idx_locations_name_trgm ON locations USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active) WHERE is_active = true;

-- Orders indexes for statistics
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_code ON payments(payment_code);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(payment_method);

-- ============================================
-- 5. Enable pg_trgm extension for fuzzy search
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the migration was successful:

-- Check if reviews table exists
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'reviews'
) AS reviews_table_exists;

-- Count reviews
SELECT COUNT(*) as review_count FROM reviews;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE tablename IN ('reviews', 'tours', 'orders', 'payments', 'locations')
ORDER BY tablename, indexname;

-- Verify foreign keys
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'reviews';

RAISE NOTICE 'Migration completed successfully!';
