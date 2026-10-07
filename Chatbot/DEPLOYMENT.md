# Hướng dẫn Deploy Chatbot lên Google Cloud Run

## Yêu cầu
- Google Cloud SDK đã cài đặt
- Đã đăng nhập vào GCP: `gcloud auth login`
- Project GCP đã được tạo

## Bước 1: Chuẩn bị Environment Variables

Trước khi deploy, cần set các environment variables cho Cloud Run:

```bash
# Set GEMINI_API_KEY
gcloud run services update travel-chatbot --set-env-vars GEMINI_API_KEY=your_actual_api_key --region us-central1

# Set TAVILY_API_KEY
gcloud run services update travel-chatbot --set-env-vars TAVILY_API_KEY=your_actual_api_key --region us-central1
```

Hoặc tạo file `.env.yaml` với nội dung:
```yaml
GEMINI_API_KEY: "your_actual_gemini_api_key"
TAVILY_API_KEY: "your_actual_tavily_api_key"
GEMINI_MODEL: "gemini-1.5-flash"
TEMPERATURE: "0.7"
NODE_ENV: "production"
```

## Bước 2: Deploy với một lệnh duy nhất

Chạy lệnh sau từ folder Chatbot (tất cả trên 1 dòng):

```bash
gcloud run deploy travel-chatbot --source . --region us-central1 --platform managed --allow-unauthenticated --memory 2Gi --cpu 2 --max-instances 10 --port 8080 --set-env-vars GEMINI_API_KEY=YOUR_GEMINI_KEY,TAVILY_API_KEY=YOUR_TAVILY_KEY,NODE_ENV=production
```

**Lưu ý**: Thay `YOUR_GEMINI_KEY` và `YOUR_TAVILY_KEY` bằng API keys thật của bạn.

## Bước 3: Kiểm tra Deployment

Sau khi deploy thành công, bạn sẽ nhận được URL. Kiểm tra:

```bash
# Health check
curl https://your-service-url/api/health

# Test chat
curl -X POST https://your-service-url/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Gợi ý du lịch Đà Lạt"}'
```

## Cấu hình CORS cho Frontend

Nếu bạn cần frontend gọi API này, thêm biến môi trường:

```bash
gcloud run services update travel-chatbot \
  --set-env-vars FRONTEND_URL=https://your-frontend-domain.com \
  --region us-central1
```

## Xem Logs

```bash
gcloud run services logs read travel-chatbot --region us-central1
```

## Update Service (sau khi thay đổi code)

```bash
gcloud run deploy travel-chatbot --source . --region us-central1
```

## Chi phí ước tính

Với cấu hình 2GB RAM, 2 CPU:
- Có thể handle ~100-500 requests/phút
- Chi phí: ~$0.12/giờ khi chạy liên tục
- Cloud Run chỉ tính phí khi có request (pay-per-use)

## Troubleshooting

1. **Nếu container không start**: Kiểm tra logs
2. **Nếu thiếu API keys**: Set env vars qua gcloud
3. **Nếu CORS errors**: Thêm FRONTEND_URL vào env vars
