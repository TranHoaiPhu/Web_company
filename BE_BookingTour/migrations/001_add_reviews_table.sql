-- Migration: Add Reviews Table
-- Run this SQL script to add the reviews functionality

-- Create reviews table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_tour_id ON public.reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Add comment
COMMENT ON TABLE public.reviews IS 'Bảng lưu trữ đánh giá của khách hàng về tours';
COMMENT ON COLUMN public.reviews.rating IS 'Điểm đánh giá từ 1-5 sao';
COMMENT ON COLUMN public.reviews.images IS 'Mảng URLs của ảnh đánh giá';

-- Grant permissions (adjust as needed)
ALTER TABLE public.reviews OWNER TO postgres;
