# Phân Tích Chuyên Sâu: Cơ Chế Tạo Lịch Trình Bằng AI

Tài liệu này giải thích chi tiết cách hệ thống "AI Trip System" tạo ra một bảng lịch trình du lịch hoàn chỉnh từ yêu cầu của người dùng.

## 1. Tổng Quan Quy Trình (Workflow)

```mermaid
graph TD
    User[User Input (Frontend)] -->|POST /generate-trip| API[FastAPI Backend]
    API -->|Prompt Chế Biến| Gemini[Gemini AI Model]
    Gemini -->|JSON Lịch Trình| API
    API -->|Trích xuất Địa Điểm| ImgSearch[Hệ thống Tìm Ảnh]
    ImgSearch -->|1. Google Places API| Google[Google Maps Photos]
    ImgSearch -->|2. Nếu lỗi -> OpenVerse| OpenVerse[OpenVerse API]
    ImgSearch -->|Ảnh, Lat, Lon| DB[Lưu vào Database]
    DB --> Frontend[Hiển thị Lịch Trình]
```

## 2. Chi Tiết Kỹ Thuật

### 2.1 Input Đầu Vào (`AIRequest`)
Khi người dùng điền form "Tạo chuyến đi mới", Frontend gửi một JSON object (`API/schemas/ai_recommendation_schema.py`):

```json
{
  "departure": "Hồ Chí Minh",
  "destination": "Đà Lạt",
  "time": "20/10/2024",
  "days": 3,
  "people": 2,
  "money": "5 triệu",
  "transportation": "Máy bay",
  "travelStyle": "Nghỉ dưỡng",
  "interests": ["Check-in", "Cà phê", "Săn mây"],
  "accommodation": "Khách sạn 4 sao"
}
```

### 2.2 Kỹ Thuật Prompt Engineering (Quan Trọng)
File `API/controllers/ai_recommendation_ctrl.py` chứa một kỹ thuật **Prompt Template** rất chi tiết để "ép" Gemini trả về kết quả đúng định dạng.

Prompt được xây dựng động bằng cách ghép các chuỗi:
1.  **Context:** "Lập kế hoạch du lịch {days} ngày từ {departure} đến {destination}..."
2.  **Constraints (Ràng buộc):** Chia rõ khung giờ (06:30 ăn sáng, 08:00 tham quan...).
3.  **Requirements (Yêu cầu):** "Tổng số hoạt động > 5", "Tránh trùng lặp", "Có toạ độ GPS".

### 2.3 Cấu Trúc Dữ Liệu Đầu Ra (Structured Output)
Backend sử dụng tính năng **Configuration** của Gemini client (`API/gemini_client.py`) để yêu cầu trả về JSON khớp với Schema `TripPlan` (`API/schemas/result.py`).

Điều này đảm bảo AI **không bao giờ** trả về văn bản lung tung, mà luôn là JSON chuẩn:
```python
class TripPlan(BaseModel):
    name: str                  # Tên chuyến đi
    parameters: TripParameters # Chi tiết ngày, địa điểm
```

### 2.4 Cơ Chế Tự Động Tìm Ảnh & Dữ Liệu Địa Điểm

Đây là phần "thông minh" nhất của Backend, giúp lịch trình trở nên sinh động:

Sau khi có danh sách địa điểm từ Gemini, hàm `save_place` sẽ chạy ngầm (`BackgroundTasks`):
1.  **Kiểm tra trùng lặp:** Dùng hàm `exists_within_radius` trong Database (qua Supabase RPC) để xem địa điểm này đã có chưa (check bán kính 50m).
2.  **Tìm Ảnh (Hàm `find_images`):**
    *   **Ưu tiên 1:** Gọi **Google Places API** (`nearbysearch` -> `details/photos`) để lấy ảnh thực tế, chất lượng cao nhất của địa điểm đó.
    *   **Ưu tiên 2 (Fallback):** Nếu Google không ra hoặc hết quota, hệ thống tự động chuyển sang gọi **OpenVerse API** (kho ảnh miễn phí).
3.  **Lưu trữ:** Lưu thông tin địa điểm (Tên, Mô tả, Rating, Lat/Lon) và Ảnh vào các bảng `Place` và `PlaceImage`.

## 3. Điểm Mạnh & Hạn Chế

### ĐIểm Mạnh
*   **Structured Data:** Lịch trình luôn đúng cấu trúc, dễ dàng hiển thị lên bản đồ (vì có Lat/Lon) và Timeline.
*   **Hình ảnh thực tế:** Nhờ tích hợp Google Places, user thấy được ảnh thật của quán ăn/khách sạn chứ không phải ảnh minh hoạ chung chung.
*   **Tự động hoá:** Toàn bộ quá trình từ lúc nhấn nút đến khi có lịch trình chỉ mất khoảng 10-20s (tùy tốc độ OpenAI/Gemini).

### Hạn Chế Tiềm Năng
*   **Chi phí API:** Google Places API tính phí khá cao nếu lượng user lớn.
*   **Độ chính xác GPS:** Đôi khi AI có thể "bịa" toạ độ GPS nếu địa điểm quá mới hoặc không nổi tiếng (Hallucination).

## 4. Kết Luận
Module tạo lịch trình này là một ví dụ điển hình của việc kết hợp **Generative AI (Gemini)** với **Traditional API (Google Maps)** để tạo ra một sản phẩm hoàn chỉnh, có giá trị sử dụng thực tế cao hơn so với việc chỉ chat suông với AI.
