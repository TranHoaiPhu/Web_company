# Phân Tích Logic Gợi Ý Lịch Trình (Itinerary Generation) vs Chatbot

Bạn hoàn toàn chính xác! 🎯 **"Chatbot" và "Gợi ý lịch trình" là hai hệ thống hoàn toàn riêng biệt trong dự án này.**

Dưới đây là bảng so sánh và phân tích chi tiết để bạn hiểu rõ sự khác biệt:

## 1. Bảng So Sánh Nhanh

| Tính Năng | **Chatbot AI** (Folder `Chatbot`) | **Gợi Ý Lịch Trình** (Folder `API`) |
| :--- | :--- | :--- |
| **Nhiệm vụ chính** | Trò chuyện, trả lời câu hỏi ngắn, tìm kiếm thông tin nhanh (thời tiết, giá vé). | **Lập bảng kế hoạch chi tiết** theo ngày (Sáng/Trưa/Chiều/Tối) dựa trên ngân sách, sở thích. |
| **Dạng trả lời** | Văn bản hội thoại tự nhiên (như chat với người). | Cấu trúc dữ liệu JSON chi tiết (List các địa điểm, giờ giấc, toạ độ GPS). |
| **Backend** | **Node.js** (Server chạy trên port 5000). | **Python / FastAPI** (Server chạy trên port 8000 hoặc deploy trên Render). |
| **Công nghệ AI** | **LangGraph + Gemini + Tavily** (để tìm kiếm realtime). | **Gemini** (Prompt trực tiếp để sinh kế hoạch). |
| **File xử lý chính** | `Chatbot/src/graph/travel-workflow.js` | `API/controllers/ai_recommendation_ctrl.py` |

---

## 2. Phân Tích Chi Tiết Logic Gợi Ý Lịch Trình

Tính năng "Gợi ý hành trình" nằm hoàn toàn trong folder `API` (Backend Python), không dính dáng gì đến folder `Chatbot`.

### 2.1 Luồng hoạt động (Flow)
1.  **User điền Form:** Trên Frontend, user nhập:
    *   Điểm đến (VD: Đà Nẵng)
    *   Số ngày (VD: 3 ngày)
    *   Ngân sách (VD: 5 triệu)
    *   Sở thích (VD: Tắm biển, Ăn uống)

2.  **API Call:** Frontend gọi đến endpoint:
    `POST /api/v1/ai_recs/generate-trip` (nằm trong file `API/controllers/ai_recommendation_ctrl.py`).

3.  **Prompt Engineering (Tạo câu lệnh cho AI):**
    Backend Python sẽ ghép một prompt rất dài và chi tiết (xem file `ai_recommendation_ctrl.py` dòng 61):
    > "Lập kế hoạch du lịch {days} ngày từ {departure} đến {destination}... Yêu cầu lập lịch trình chi tiết theo từng ngày... chia rõ 06:30 ăn sáng... 08:00 tham quan..."

4.  **Xử lý Dữ liệu:**
    *   Sau khi Gemini trả về kết hoạch, Backend Python sẽ chạy vòng lặp để xử lý từng địa điểm.
    *   **Lấy ảnh:** Nó tự động gọi **Google Places API** hoặc **OpenVerse** để tìm ảnh đẹp cho từng địa điểm trong lịch trình (Hàm `find_images`).
    *   **Lưu Database:** Lưu toàn bộ kế hoạch và địa điểm vào database để user xem lại sau.

### 2.2 Tại sao lại tách riêng?
*   **Gợi ý lịch trình** cần xử lý dữ liệu nặng (lưu database, tìm ảnh, tính toán toạ độ GPS) -> Python/FastAPI làm việc này rất tốt.
*   **Chatbot** cần phản hồi nhanh, duy trì kết nối realtime và nhớ ngữ cảnh hội thoại -> Node.js/LangGraph phù hợp hơn.

## 3. Kết luận
*   Folder `Chatbot` bạn thấy lúc nãy chỉ là "Người trợ lý ảo" để hỏi đáp.
*   Còn tính năng "Tạo lịch trình" xịn xò ("đúng chất AI Trip System") nằm ở folder `API`.

File `Chatbot` **không** có khả năng tạo ra một lịch trình đầy đủ có ảnh, có bản đồ như tính năng chính của Web.
