<p align="center">
  <a href="https://www.uit.edu.vn/" title="Trường Đại học Công nghệ Thông tin" style="border: 5;">
    <img src="https://i.imgur.com/WmMnSRt.png" alt="Trường Đại học Công nghệ Thông tin | University of Information Technology">
  </a>
</p>

<!-- Title -->
<h1 align="center"><b>SE347.Q12 - Công nghệ Web và ứng dụng</b></h1>

# Nhóm 11 - HỆ THỐNG ĐỀ XUẤT LỘ TRÌNH THÔNG MINH DỰA TRÊN AI

## BẢNG MỤC LỤC
* [ Giảng viên hướng dẫn](#giangvien)
* [ Thành viên nhóm](#thanhvien)
* [ Đồ án môn học](#doan)
* [ Bảng phân công công việc](#cv)

<a name="giangvien"></a>
## GIẢNG VIÊN HƯỚNG DẪN
* ThS. **Đặng Việt Dũng** - *dungdv@uit.edu.vn*

<a name="thanhvien"></a>
## THÀNH VIÊN NHÓM

| STT    | MSSV          | Họ và Tên              | Github                                               | Email                   | Chức vụ              |
| ------ |:-------------:| ----------------------:|-----------------------------------------------------:|-------------------------|---------------------:|
| 1      | 22521508      | Võ Ngọc Bảo Trân       |                                                      |22521508@gm.uit.edu.vn   | Trưởng nhóm          |
| 2      | 22520047      | Lê Ngọc Kiều Anh       |                                                      |22520047@gm.uit.edu.vn   | Thành viên           |
| 3      | 22521106      | Trần Hoài Phú          |                                                      |22521106@gm.uit.edu.vn   | Thành viên           |
| 4      | 22520937      | Trần Thư Ngân          |                                                      |22520937@gm.uit.edu.vn   | Thành viên           |

<a name="doan"></a>
## ĐỒ ÁN MÔN HỌC

Đồ án Nhóm: Hệ thống đề xuất lộ trình thông minh dựa trên AI

Đây là dự án website được xây dựng nhằm mục đích giải quyết sự phức tạp của việc tự lập kế hoạch du lịch bằng cách sử dụng AI để tạo ra các lộ trình di chuyển được tối ưu hóa và phù hợp cho người dùng. Hệ thống được xây dựng dựa trên Framwork ReactJS, FastAPI 

<u>Chức năng: </u>

<img src="https://i.imgur.com/ad07kOl.jpeg" alt="function">

<a name="cv"></a>
## Bảng phân công công việc:

| Thành Viên         | Tuần 1                         | Tuần 2 + 3                                                     | Tuần 4         |
|--------------------|--------------------------------|----------------------------------------------------------------|----------------|
| Võ Ngọc Bảo Trân   | Tìm hiểu database, FastAPI     | Thiết kế CSDL, Repository User, TripMem                        | Word + Slide   |
| Lê Ngọc Kiều Anh   | Tìm hiểu database, FastAPI     | Thiết kế schema, Repository Notify, AI Rec                     | Word + Slide   |
| Trần Hoài Phú      | Tìm hiểu database, FastAPI     | Model friends, notify, ai rec, review, Repo Friends, Book      | Word + Slide   |
| Trần Thư Ngân      | Tìm hiểu database, FastAPI     | Model detail, places, book, Repo Places, Detail                | Word + Slide   |

## Installation

Xem hướng dẫn chi tiết tại:
- **Frontend Setup:** [ai_trip_system/README.md](ai_trip_system/README.md)
- **API Setup:** [Set_Up/HUONG_DAN_CHAY_API.md](Set_Up/HUONG_DAN_CHAY_API.md)
- **Chatbot Setup:** [Set_Up/HUONG_DAN_CHAY_CHATBOT.md](Set_Up/HUONG_DAN_CHAY_CHATBOT.md)
- **Cloud Deployment:** [Set_Up/HUONG_DAN_DEPLOY_CLOUD.md](Set_Up/HUONG_DAN_DEPLOY_CLOUD.md)

### Quick Start

1. **Clone the repository:**

    ```bash
    git clone https://github.com//AITripSystem.git
    cd SE317.Q12
    ```

2. **Setup Frontend (NextJS):**

    ```bash
    cd ai_trip_system
    npm install
    npm run dev
    ```
    Frontend sẽ chạy tại: `http://localhost:3000`

3. **Setup API (FastAPI) - Optional nếu muốn chạy local:**

    ```bash
    cd API
    pip install -r requirements.txt
    python main.py
    ```
    API sẽ chạy tại: `http://localhost:8000`

4. **Setup Chatbot - Optional:**

    ```bash
    cd Chatbot
    npm install
    npm start
    ```
    Chatbot sẽ chạy tại: `http://localhost:5000`

## Cloud Deployment

Hệ thống đã được deploy lên Google Cloud Platform:

### 🚀 Live URLs
- **API Backend (Cloud Run):** https://ai-trip-api-40205731279.us-central1.run.app
- **API Documentation:** https://ai-trip-api-40205731279.us-central1.run.app/docs
- **Frontend:** Deployed on Vercel (configure NEXTAUTH_URL)

### 📚 Documentation
- [CLOUD_RUN_INTEGRATION.md](CLOUD_RUN_INTEGRATION.md) - Hướng dẫn tích hợp Cloud Run
- [API_CONFIG_GUIDE.md](API_CONFIG_GUIDE.md) - Hướng dẫn cấu hình API

## Inference

### Web Application (Production)
- Frontend tự động kết nối với Cloud Run API
- Không cần chạy local API nữa
- Chỉ cần: `cd ai_trip_system && npm run dev`
