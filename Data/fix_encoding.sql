-- Fix Encoding cho tất cả bảng có tiếng Việt
-- Chạy trên PostgreSQL Cloud SQL

-- 1. Fix bảng TOURS
UPDATE tours 
SET 
    name = CONVERT_FROM(CONVERT_TO(name, 'LATIN1'), 'UTF8'),
    short_description = CASE 
        WHEN short_description IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(short_description, 'LATIN1'), 'UTF8')
        ELSE short_description 
    END,
    description = CASE 
        WHEN description IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(description, 'LATIN1'), 'UTF8')
        ELSE description 
    END,
    highlights = CASE 
        WHEN highlights IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(highlights, 'LATIN1'), 'UTF8')
        ELSE highlights 
    END,
    included_services = CASE 
        WHEN included_services IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(included_services, 'LATIN1'), 'UTF8')
        ELSE included_services 
    END,
    excluded_services = CASE 
        WHEN excluded_services IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(excluded_services, 'LATIN1'), 'UTF8')
        ELSE excluded_services 
    END,
    terms_conditions = CASE 
        WHEN terms_conditions IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(terms_conditions, 'LATIN1'), 'UTF8')
        ELSE terms_conditions 
    END,
    cancellation_policy = CASE 
        WHEN cancellation_policy IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(cancellation_policy, 'LATIN1'), 'UTF8')
        ELSE cancellation_policy 
    END,
    transportation_type = CASE 
        WHEN transportation_type IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(transportation_type, 'LATIN1'), 'UTF8')
        ELSE transportation_type 
    END,
    departure_location = CASE 
        WHEN departure_location IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(departure_location, 'LATIN1'), 'UTF8')
        ELSE departure_location 
    END,
    return_location = CASE 
        WHEN return_location IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(return_location, 'LATIN1'), 'UTF8')
        ELSE return_location 
    END
WHERE name LIKE '%Ã%' OR name LIKE '%á»%' OR name LIKE '%Ä%';

-- 2. Fix bảng USERS
UPDATE users 
SET 
    full_name = CONVERT_FROM(CONVERT_TO(full_name, 'LATIN1'), 'UTF8'),
    address = CASE 
        WHEN address IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(address, 'LATIN1'), 'UTF8')
        ELSE address 
    END
WHERE full_name LIKE '%Ã%' OR full_name LIKE '%á»%' OR full_name LIKE '%Ä%';

-- 3. Fix bảng PLACES
UPDATE places 
SET 
    name = CONVERT_FROM(CONVERT_TO(name, 'LATIN1'), 'UTF8'),
    description = CASE 
        WHEN description IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(description, 'LATIN1'), 'UTF8')
        ELSE description 
    END,
    address = CASE 
        WHEN address IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(address, 'LATIN1'), 'UTF8')
        ELSE address 
    END
WHERE name LIKE '%Ã%' OR name LIKE '%á»%' OR name LIKE '%Ä%';

-- 4. Fix bảng TOUR_CATEGORIES
UPDATE tour_categories 
SET 
    name = CONVERT_FROM(CONVERT_TO(name, 'LATIN1'), 'UTF8'),
    description = CASE 
        WHEN description IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(description, 'LATIN1'), 'UTF8')
        ELSE description 
    END
WHERE name LIKE '%Ã%' OR name LIKE '%á»%' OR name LIKE '%Ä%';

-- 5. Fix bảng LOCATIONS
UPDATE locations 
SET 
    name = CONVERT_FROM(CONVERT_TO(name, 'LATIN1'), 'UTF8'),
    description = CASE 
        WHEN description IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(description, 'LATIN1'), 'UTF8')
        ELSE description 
    END
WHERE name LIKE '%Ã%' OR name LIKE '%á»%' OR name LIKE '%Ä%';

-- 6. Fix bảng TOUR_DAYS
UPDATE tour_days 
SET 
    title = CONVERT_FROM(CONVERT_TO(title, 'LATIN1'), 'UTF8'),
    description = CASE 
        WHEN description IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(description, 'LATIN1'), 'UTF8')
        ELSE description 
    END,
    accommodation = CASE 
        WHEN accommodation IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(accommodation, 'LATIN1'), 'UTF8')
        ELSE accommodation 
    END,
    meals = CASE 
        WHEN meals IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(meals, 'LATIN1'), 'UTF8')
        ELSE meals 
    END
WHERE title LIKE '%Ã%' OR title LIKE '%á»%' OR title LIKE '%Ä%';

-- 7. Fix bảng BANNER_SLIDES
UPDATE banner_slides 
SET 
    title = CONVERT_FROM(CONVERT_TO(title, 'LATIN1'), 'UTF8'),
    subtitle = CASE 
        WHEN subtitle IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(subtitle, 'LATIN1'), 'UTF8')
        ELSE subtitle 
    END,
    description = CASE 
        WHEN description IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(description, 'LATIN1'), 'UTF8')
        ELSE description 
    END,
    location = CASE 
        WHEN location IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(location, 'LATIN1'), 'UTF8')
        ELSE location 
    END,
    tag = CASE 
        WHEN tag IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(tag, 'LATIN1'), 'UTF8')
        ELSE tag 
    END,
    alt_text = CASE 
        WHEN alt_text IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(alt_text, 'LATIN1'), 'UTF8')
        ELSE alt_text 
    END
WHERE title LIKE '%Ã%' OR title LIKE '%á»%' OR title LIKE '%Ä%';

-- 8. Fix bảng TOUR_IMAGES
UPDATE tour_images 
SET 
    alt_text = CASE 
        WHEN alt_text IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(alt_text, 'LATIN1'), 'UTF8')
        ELSE alt_text 
    END
WHERE alt_text LIKE '%Ã%' OR alt_text LIKE '%á»%' OR alt_text LIKE '%Ä%';

-- 9. Fix bảng AMENITIES
UPDATE amenities 
SET 
    name = CONVERT_FROM(CONVERT_TO(name, 'LATIN1'), 'UTF8'),
    description = CASE 
        WHEN description IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(description, 'LATIN1'), 'UTF8')
        ELSE description 
    END
WHERE name LIKE '%Ã%' OR name LIKE '%á»%' OR name LIKE '%Ä%';

-- 10. Fix bảng DISCOUNT_CODES
UPDATE discount_codes 
SET 
    name = CONVERT_FROM(CONVERT_TO(name, 'LATIN1'), 'UTF8'),
    description = CASE 
        WHEN description IS NOT NULL 
        THEN CONVERT_FROM(CONVERT_TO(description, 'LATIN1'), 'UTF8')
        ELSE description 
    END
WHERE name LIKE '%Ã%' OR name LIKE '%á»%' OR name LIKE '%Ä%';

-- Kiểm tra kết quả
SELECT 'Tours fixed:' as message, COUNT(*) as count FROM tours WHERE name NOT LIKE '%Ã%';
SELECT 'Users fixed:' as message, COUNT(*) as count FROM users WHERE full_name NOT LIKE '%Ã%';
SELECT 'Places fixed:' as message, COUNT(*) as count FROM places WHERE name NOT LIKE '%Ã%';

-- Hiển thị mẫu dữ liệu sau khi fix
SELECT id, name, short_description FROM tours ORDER BY id LIMIT 5;
