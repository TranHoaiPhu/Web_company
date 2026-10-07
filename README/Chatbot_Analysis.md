# Phân Tích Chi Tiết Folder Chatbot & Tích Hợp Frontend

Tài liệu này cung cấp phân tích chuyên sâu về folder `Chatbot` trong dự án `ai_trip_system`, giải thích cấu trúc, dòng chảy dữ liệu (data flow) và cách nó được tích hợp vào Frontend.

## 1. Tổng Quan
Folder `Chatbot` là một **Microservice độc lập** (chạy trên port 5000) chịu trách nhiệm xử lý các hội thoại về du lịch. Nó không chỉ là một API đơn giản mà là một hệ thống **AI Agent** thông minh sử dụng **LangGraph** để quản lý trạng thái hội thoại và ra quyết định.

*   **Nhiệm vụ chính:** Tư vấn du lịch, gợi ý địa điểm, nhà hàng, khách sạn, và cung cấp thông tin thời tiết/di chuyển.
*   **Điểm đặc biệt:** Có khả năng tìm kiếm thông tin theo thời gian thực (Real-time Search) khi kiến thức có sẵn không đủ.

## 2. Kiến Trúc & Công Nghệ
Chatbot được xây dựng trên các công nghệ hiện đại:

*   **Node.js & Express:** Server backend nhẹ nhàng, xử lý HTTP requests.
*   **LangGraph (`@langchain/langgraph`):** Quản lý luồng đi của hội thoại dưới dạng một đồ thị (State Machine). Đây là "bộ não" của chatbot.
*   **Gemini 1.5 Flash:** Mô hình ngôn ngữ lớn (LLM) dùng để phân tích ý định và sinh câu trả lời tự nhiên.
*   **Tavily AI:** Công cụ tìm kiếm chuyên dụng cho AI, giúp chatbot lấy thông tin mới nhất từ internet.
*   **In-Memory Cache:** Hệ thống lưu trữ lịch sử và context hội thoại tạm thời.

## 3. Phân Tích Cấu Trúc File Core (`Chatbot/`)

### 3.1 `server.js` - Điểm Khởi Đầu
Đây là file chạy chính của ứng dụng.
*   **Khởi tạo:** Load `TravelChatbotApp` và kết nối với các dịch vụ AI.
*   **API Endpoints:**
    *   `POST /api/chat`: Nhận tin nhắn từ Frontend, xử lý và trả về phản hồi.
    *   `GET /api/health`: Kiểm tra trạng thái hoạt động của chatbot.
    *   `GET /api/session/:sessionId/...`: Lấy lịch sử và thống kê hội thoại.
*   **Middleware:** Xử lý CORS và JSON parsing.

### 3.2 `src/index.js` - Lớp Ứng Dụng
Class `TravelChatbotApp` đóng vai trò là lớp vỏ (wrapper) quản lý:
*   Khởi tạo `chatbot` từ workflow.
*   Quản lý vòng đời của session.
*   Cung cấp các hàm tiện ích như `getHistory`, `clearHistory`.

### 3.3 `src/graph/` - "Bộ Não" Của Chatbot (Quan Trọng Nhất)
Đây là nơi chứa logic thông minh nhất của hệ thống.

*   **`travel-workflow.js`:** Định nghĩa **Graph (Đồ thị)** xử lý. Nó quy định các bước đi của dữ liệu:
    1.  **Start** -> `analyze_query` (Phân tích câu hỏi)
    2.  -> `decide_search_needed` (Có cần tìm Google không?)
    3.  -> **Nếu CÓ:** `search_information` (Gọi Tavily search) -> `generate_response`
    4.  -> **Nếu KHÔNG:** `generate_response` (Trả lời ngay bằng kiến thức có sẵn)
    5.  -> `check_follow_up` (Kiểm tra xem user có cần hỏi thêm không) -> **End**

*   **`nodes.js`:** Chứa code thực thi của từng node trong biểu đồ trên:
    *   `analyzeQuery`: Dùng Gemini để trích xuất intent (ý định), location (địa điểm), category (danh mục) từ câu chat.
    *   `decideSearchNeeded`: Logic kiểm tra xem câu hỏi có chứa từ khóa thời gian thực ("thời tiết", "giá vé", "hôm nay"...) hay không.
    *   `searchInformation`: Gọi `TravelSearchTool` để lấy dữ liệu.
    *   `generateResponse`: Tổng hợp thông tin từ Search + Context cũ + Prompt để Gemini viết câu trả lời cuối cùng.

### 3.4 `src/tools/tavily-search.js`
Công cụ tìm kiếm thông minh.
*   Có khả năng "Rank" (xếp hạng) kết quả tìm kiếm dựa trên độ liên quan đến du lịch (ví dụ: ưu tiên kết quả về review nhà hàng nếu đang hỏi về ăn uống).

### 3.5 `src/memory/`
*   **`conversation-memory.js`**: Lưu trữ lịch sử chat để chatbot "nhớ" những gì bạn vừa nói (ví dụ: Bạn nói "Đà Lạt", sau đó hỏi "Ăn gì ở đó?", nó sẽ hiểu "đó" là Đà Lạt).

## 4. Tích Hợp Vào Frontend (`ai_trip_system`)

Frontend của bạn (Next.js) không gọi trực tiếp đến mô hình AI, mà gọi qua Chatbot Service này.

### 4.1 Luồng Dữ Liệu Frontend -> Backend
1.  **User gõ tin nhắn** tại component `HomeChatbot` hoặc giao diện chat.
2.  **Next.js Proxy:** Request được gửi đến `src/app/(public)/api/chatbot/route.ts` của Next.js.
3.  **Forwarding:** Route này hoạt động như một cầu nối (proxy), chuyển tiếp request đến `http://localhost:5000/api/chat`.
    *   *Mục đích:* Giấu địa chỉ thực của Chatbot Service và tránh lỗi CORS trình duyệt.
4.  **Phản hồi:** Chatbot xử lý xong trả JSON về -> Proxy trả về React Component -> Hiển thị lên màn hình.

### 4.2 Các Component Liên Quan
*   **`src/components/HomeChatbot.tsx`:**
    *   Giao diện chat chính.
    *   Có hàm kiểm tra `checkChatbotHealth` để xem server 5000 có đang chạy không (hiển thị chấm xanh/đỏ).
    *   Gửi request POST đến `/api/chatbot` với `{ message, sessionId }`.
*   **`src/components/ChatbotStatus.tsx`:** Component nhỏ hiển thị trạng thái kết nối (Online/Offline) ở góc màn hình hoặc trong admin panel.

## 5. Flow Hoạt Động Tổng Thể (Ví Dụ)

**Kịch bản:** User hỏi "Thời tiết Đà Lạt hôm nay thế nào?"

1.  **Frontend:** Gửi `{ message: "Thời tiết Đà Lạt hôm nay thế nào?" }` đến `/api/chatbot`.
2.  **Proxy:** Chuyển tiếp đến `localhost:5000/api/chat`.
3.  **Chatbot (Graph Start):**
    *   `analyzeQuery`: Hiểu là -> Intent: Weather, Location: Đà Lạt, Time: Hôm nay.
    *   `decideSearchNeeded`: Thấy từ khóa "hôm nay" và "thời tiết" -> **CẦN SEARCH**.
    *   `searchInformation`: Gọi Tavily tìm "weather Da Lat today report".
    *   `generateResponse`: Nhận kết quả từ Tavily (ví dụ: "20 độ C, mưa nhẹ"), Gemini viết lại thành câu văn thân thiện.
4.  **Response:** Trả về JSON: `{ success: true, response: "Hôm nay Đà Lạt khoảng 20 độ, có mưa nhẹ..." }`.
5.  **Frontend:** Hiển thị tin nhắn trả lời.

## 6. Kết Luận
*   **Chức năng:** Trợ lý du lịch thông minh, có khả năng tra cứu realtime.
*   **Sức mạnh:** Tách biệt logic xử lý AI ra khỏi Frontend (Microservice architecture), giúp Frontend nhẹ hơn và dễ bảo trì.
*   **Điểm cần lưu ý:** Cần có file `.env` chứa `GEMINI_API_KEY` và `TAVILY_API_KEY` ở folder Chatbot thì server mới chạy được.
