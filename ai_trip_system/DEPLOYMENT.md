# AI Trip System Frontend - Cloud Run Deployment Guide

Hướng dẫn chi tiết để deploy ứng dụng Next.js lên Google Cloud Run.

## Yêu cầu

- Google Cloud SDK (gcloud CLI) đã được cài đặt và cấu hình
- Tài khoản Google Cloud với quyền deploy lên Cloud Run
- Docker (tùy chọn, Cloud Run sẽ tự build từ source)

## Cấu hình tài nguyên

Service này được cấu hình với:
- **CPU**: 4 cores
- **Memory**: 4GB RAM
- **Min instances**: 1
- **Max instances**: 4
- **Concurrency**: 80 requests per instance
- **Port**: 8080

**Lưu ý về Storage**: Cloud Run sử dụng ephemeral storage (tạm thời), không có persistent disk. Mọi dữ liệu lưu trên container sẽ bị mất khi container restart.

## Cách 1: Deploy bằng script tự động (Khuyến nghị)

### Bước 1: Cấu hình biến môi trường

Chỉnh sửa file `deploy.sh` và cập nhật các biến môi trường phù hợp với môi trường production của bạn:

```bash
NEXT_PUBLIC_API_BASE_URL="https://your-api-url"
NEXT_PUBLIC_BOOKING_API_URL="https://your-booking-api-url"
# ... các biến khác
```

### Bước 2: Chạy script deploy

Trong thư mục `ai_trip_system`, chạy:

```bash
# Trên Linux/Mac
chmod +x deploy.sh
./deploy.sh

# Trên Windows (Git Bash)
bash deploy.sh
```

## Cách 2: Deploy bằng câu lệnh thủ công

### Câu lệnh deploy đầy đủ:

```bash
gcloud run deploy ai-trip-system-frontend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 4 \
  --memory 4Gi \
  --min-instances 1 \
  --max-instances 4 \
  --concurrency 80 \
  --set-build-env-vars "NEXT_PUBLIC_API_BASE_URL=https://ai-trip-api-40205731279.us-central1.run.app/api/v1,NEXT_PUBLIC_BOOKING_API_URL=https://booking-tour-api-40205731279.us-central1.run.app/api,NEXT_PUBLIC_CHATBOT_SERVICE_URL=http://localhost:5000,NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=YOUR_KEY,NEXT_PUBLIC_SUPABASE_URL=YOUR_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY,GOOGLE_CLIENT_ID=YOUR_ID,GOOGLE_CLIENT_SECRET=YOUR_SECRET,NEXTAUTH_URL=YOUR_APP_URL,NEXTAUTH_SECRET=YOUR_SECRET,NEXT_PUBLIC_APP_URL=YOUR_APP_URL" \
  --set-env-vars "NEXT_PUBLIC_API_BASE_URL=https://ai-trip-api-40205731279.us-central1.run.app/api/v1,NEXT_PUBLIC_BOOKING_API_URL=https://booking-tour-api-40205731279.us-central1.run.app/api,NEXT_PUBLIC_CHATBOT_SERVICE_URL=http://localhost:5000,NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=YOUR_KEY,NEXT_PUBLIC_SUPABASE_URL=YOUR_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY,GOOGLE_CLIENT_ID=YOUR_ID,GOOGLE_CLIENT_SECRET=YOUR_SECRET,NEXTAUTH_URL=YOUR_APP_URL,NEXTAUTH_SECRET=YOUR_SECRET,NEXT_PUBLIC_APP_URL=YOUR_APP_URL"
```

**Lưu ý**: Thay thế `YOUR_KEY`, `YOUR_URL`, etc. bằng các giá trị thực tế từ file `.env.production`.

## Cách 3: Deploy trên Windows PowerShell/CMD

Nếu bạn đang sử dụng PowerShell hoặc CMD trên Windows, sử dụng câu lệnh sau:

```powershell
gcloud run deploy ai-trip-system-frontend ^
  --source . ^
  --region us-central1 ^
  --platform managed ^
  --allow-unauthenticated ^
  --port 8080 ^
  --cpu 4 ^
  --memory 4Gi ^
  --min-instances 1 ^
  --max-instances 4 ^
  --concurrency 80 ^
  --set-build-env-vars "NEXT_PUBLIC_API_BASE_URL=https://ai-trip-api-40205731279.us-central1.run.app/api/v1,NEXT_PUBLIC_BOOKING_API_URL=https://booking-tour-api-40205731279.us-central1.run.app/api,NEXT_PUBLIC_CHATBOT_SERVICE_URL=http://localhost:5000,NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=YOUR_GOOGLE_PLACES_API_KEY,NEXT_PUBLIC_SUPABASE_URL=https://bvwritmmnhacndrxkvjn.supabase.co,NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY,GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET=GROUP_2" ^
  --set-env-vars "NEXT_PUBLIC_API_BASE_URL=https://ai-trip-api-40205731279.us-central1.run.app/api/v1,NEXT_PUBLIC_BOOKING_API_URL=https://booking-tour-api-40205731279.us-central1.run.app/api,NEXT_PUBLIC_CHATBOT_SERVICE_URL=http://localhost:5000,NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=YOUR_GOOGLE_PLACES_API_KEY,NEXT_PUBLIC_SUPABASE_URL=https://bvwritmmnhacndrxkvjn.supabase.co,NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY,GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET=GROUP_2"
```

**Lưu ý**:
- Sử dụng `^` để xuống dòng trong CMD/PowerShell
- Sau khi deploy lần đầu, bạn cần cập nhật `NEXTAUTH_URL` và `NEXT_PUBLIC_APP_URL` với URL thực tế của Cloud Run

## Sau khi deploy

### 1. Lấy URL của ứng dụng

```bash
gcloud run services describe ai-trip-system-frontend --region us-central1 --format 'value(status.url)'
```

### 2. Cập nhật URL trong Google OAuth

Truy cập [Google Cloud Console](https://console.cloud.google.com/apis/credentials) và cập nhật:
- Authorized JavaScript origins: `https://your-app-url.run.app`
- Authorized redirect URIs: `https://your-app-url.run.app/api/auth/callback/google`

### 3. Cập nhật biến môi trường với URL mới

```bash
gcloud run services update ai-trip-system-frontend \
  --region us-central1 \
  --set-env-vars "NEXTAUTH_URL=https://your-actual-url.run.app,NEXT_PUBLIC_APP_URL=https://your-actual-url.run.app"
```

## Monitoring và Logs

### Xem logs

```bash
gcloud run services logs read ai-trip-system-frontend --region us-central1
```

### Xem metrics

```bash
gcloud run services describe ai-trip-system-frontend --region us-central1
```

## Troubleshooting

### Build failed

- Kiểm tra Dockerfile có đúng không
- Đảm bảo `output: "standalone"` có trong next.config.ts
- Kiểm tra tất cả dependencies trong package.json

### Container failed to start

- Kiểm tra port 8080 có được expose đúng không
- Xem logs để biết lỗi chi tiết: `gcloud run services logs read ...`

### Authentication errors

- Đảm bảo NEXTAUTH_URL và NEXT_PUBLIC_APP_URL đã được cập nhật
- Kiểm tra Google OAuth redirect URIs
- Verify NEXTAUTH_SECRET có đủ 32 ký tự

## Cập nhật ứng dụng

Để cập nhật ứng dụng sau khi có thay đổi code, chỉ cần chạy lại câu lệnh deploy:

```bash
./deploy.sh
# hoặc
gcloud run deploy ai-trip-system-frontend --source . --region us-central1 ...
```

## Chi phí ước tính

Với cấu hình 4 CPU, 4GB RAM:
- Min instances: 1 (luôn chạy)
- Max instances: 4
- Chi phí sẽ cao hơn cấu hình thông thường do min-instances=1

Xem thêm: https://cloud.google.com/run/pricing

## Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. [Cloud Run Documentation](https://cloud.google.com/run/docs)
2. [Next.js Deployment](https://nextjs.org/docs/deployment)
3. Logs của ứng dụng trên Cloud Run Console
