-- Fix broken Unsplash image URL for Sa Pa tour
UPDATE tours 
SET image_url = 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=80'
WHERE image_url = 'https://images.unsplash.com/photo-1583396095097-dc8e0c647b63?w=1920&q=80';

-- Verify the update
SELECT id, title, image_url FROM tours WHERE id = 5;
