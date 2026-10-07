# Admin Tour Management API Documentation

This document lists the API endpoints for managing Tour details, including Amenities, Schedules, Itinerary (Days & Places), and Images.

## 1. Tour Amenities (Tiện nghi Tour)
Base URL: `/api/amenities`

### Link Amenity to Tour (Thêm tiện nghi vào Tour)
**Endpoint:** `POST /tour`
**Method:** `POST`
**Request Body:**
```json
{
  "tourId": 15,
  "amenityId": 3,
  "isIncluded": true,
  "isOptional": false, // true if user can pay extra for this
  "price": 0 // Price if optional
}
```

### Unlink Amenity from Tour (Xóa tiện nghi khỏi Tour)
**Endpoint:** `DELETE /tour`
**Method:** `DELETE`
**Request Body:**
```json
{
  "tourId": 15,
  "amenityId": 3
}
```

### List Amenities of Tour
**Endpoint:** `GET /tour/:tourId`
*(Existing)*

---

## 2. Tour Schedules (Lịch trình khởi hành)
Base URL: `/api/tour-schedules`

### Create Schedule (Tạo lịch khởi hành)
**Endpoint:** `POST /`
**Method:** `POST`
**Request Body:**
```json
{
  "tourId": 15,
  "startDate": "2024-06-01",
  "endDate": "2024-06-05", // Optional, can be calc from duration
  "priceOverride": 1600000, // Optional: override base price
  "totalSlots": 20,
  "status": "OPEN", // OPEN, CLOSED, FULL, CANCELLED
  "notes": "Summer special"
}
```

### Update Schedule
**Endpoint:** `PUT /:id`
**Method:** `PUT`
**Request Body:**
```json
{
  "availableSlots": 18,
  "status": "FULL"
}
```

### Delete Schedule
**Endpoint:** `DELETE /:id`
**Method:** `DELETE`

---

## 3. Tour Itinerary (Lịch trình chi tiết / Tour Days)
Base URL: `/api/tour-days`
*(Proposed New Module)*

### Add Day to Tour (Thêm ngày)
**Endpoint:** `POST /`
**Method:** `POST`
**Request Body:**
```json
{
  "tourId": 15,
  "dayNumber": 1,
  "title": "Welcome to Nha Trang",
  "description": "Pickup from airport...",
  "accommodation": "Hotel 4*",
  "meals": "Lunch, Dinner"
}
```

### Update Day
**Endpoint:** `PUT /:id`
**Method:** `PUT`
**Request Body:**
```json
{
  "title": "Welcome to Nha Trang (Updated)",
  "meals": "Breakfast, Lunch, Dinner"
}
```

### Delete Day
**Endpoint:** `DELETE /:id`
**Method:** `DELETE`

### Add Place to Day (Thêm địa điểm vào ngày)
**Endpoint:** `POST /:id/places`
**Method:** `POST`
**Request Body:**
```json
{
  "placeId": 5, // ID from Places table
  "visitOrder": 1,
  "durationMinutes": 60,
  "notes": "Free time for photos"
}
```

---

## 4. Tour Images (Hình ảnh Tour)
Base URL: `/api/tour-images`

### Add Image
**Endpoint:** `POST /`
**Method:** `POST`
**Request Body:**
```json
{
  "tourId": 15,
  "imageUrl": "https://...",
  "isCover": false
}
```

### Update Image
**Endpoint:** `PUT /:id`
**Request Body:** `{ "isCover": true }`

### Delete Image
**Endpoint:** `DELETE /:id`
