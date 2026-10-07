# Deployment Guide - API với Vertex AI

## 📋 Tổng quan

API đã được chuyển sang sử dụng **Vertex AI** thay vì Google AI Studio để:
- ✅ Sử dụng model `gemini-3-flash-preview` (giống Chatbot)
- ✅ Quota cao hơn nhiều
- ✅ Ổn định hơn cho production
- ✅ Tự động authenticate trên Cloud Run

## 🔧 Prerequisites

### 1. Google Cloud Setup

```bash
# Đảm bảo đã có:
- GCP Project: travelweb-485107
- Vertex AI API enabled
- Cloud Run API enabled
- Service account với quyền phù hợp
```

### 2. Local Development Setup

```bash
# Cài đặt gcloud CLI
# Download từ: https://cloud.google.com/sdk/docs/install

# Đăng nhập
gcloud auth login

# Set project
gcloud config set project travelweb-485107

# Authenticate cho Application Default Credentials
gcloud auth application-default login
```

### 3. Install Dependencies

```bash
cd API
pip install -r requirements.txt
```

## 🧪 Testing Trước Khi Deploy

### Test 1: Configuration Check

```bash
# Kiểm tra .env file
cat .env | grep VERTEX
```

Đảm bảo có:
```bash
USE_VERTEX_AI=true
GCP_PROJECT_ID=travelweb-485107
GCP_LOCATION=global
GEMINI_MODEL=gemini-3-flash-preview
```

### Test 2: Run Test Script

```bash
python test_vertex_ai.py
```

Output mong đợi:
```
🧪 VERTEX AI INTEGRATION TEST

TEST 1: Configuration
✅ USE_VERTEX_AI: true
✅ GCP_PROJECT_ID: travelweb-485107
✅ GCP_LOCATION: global
✅ GEMINI_MODEL: gemini-3-flash-preview

TEST 2: Authentication
✅ Authentication successful
   Project: travelweb-485107

TEST 3: Simple Trip Generation
✅ Trip plan generated successfully!

🎉 All tests passed!
```

### Test 3: Run Local Server

```bash
uvicorn main:app --reload --port 8000
```

Test endpoint:
```bash
# Lấy JWT token trước (login vào hệ thống)
TOKEN="your_jwt_token_here"

# Test generate-trip endpoint
curl -X POST "http://localhost:8000/api/v1/ai_recs/generate-trip" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "departure": "Hà Nội",
    "destination": "Đà Lạt",
    "people": 2,
    "days": 3,
    "time": "2024-02-01",
    "money": "5 - 10 triệu"
  }'
```

## 🚀 Deployment to Cloud Run

### Option 1: Deploy từ Local (Recommended cho lần đầu)

```bash
# Build và push Docker image
gcloud builds submit --tag gcr.io/travelweb-485107/ai-trip-api

# Deploy to Cloud Run
gcloud run deploy ai-trip-api \
  --image gcr.io/travelweb-485107/ai-trip-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "$(cat .env | grep -v '^#' | grep -v '^$' | tr '\n' ',' | sed 's/,$//')"
```

### Option 2: Deploy từ Source Code (Tự động build)

```bash
gcloud run deploy ai-trip-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "$(cat .env | grep -v '^#' | grep -v '^$' | tr '\n' ',' | sed 's/,$//')"
```

### Option 3: Deploy với Service Account cụ thể

```bash
# Create service account (nếu chưa có)
gcloud iam service-accounts create vertex-ai-user \
  --display-name "Vertex AI User for Trip API"

# Grant permissions
gcloud projects add-iam-policy-binding travelweb-485107 \
  --member "serviceAccount:vertex-ai-user@travelweb-485107.iam.gserviceaccount.com" \
  --role "roles/aiplatform.user"

# Deploy with service account
gcloud run deploy ai-trip-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --service-account vertex-ai-user@travelweb-485107.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --set-env-vars "$(cat .env | grep -v '^#' | grep -v '^$' | tr '\n' ',' | sed 's/,$//')"
```

## 🔒 Service Account Permissions

Service account của Cloud Run cần có quyền:

```bash
# Minimum required permissions
roles/aiplatform.user               # Gọi Vertex AI API
roles/storage.objectViewer          # Đọc models (nếu cần)

# Optional (nếu cần access Supabase, Cloud SQL, etc.)
roles/cloudsql.client               # Cloud SQL
# ... other roles as needed
```

Để grant permissions:

```bash
PROJECT_NUMBER=$(gcloud projects describe travelweb-485107 --format="value(projectNumber)")

gcloud projects add-iam-policy-binding travelweb-485107 \
  --member "serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role "roles/aiplatform.user"
```

## 📊 Monitoring & Logs

### View Logs

```bash
# Real-time logs
gcloud run services logs tail ai-trip-api --region us-central1

# View in Cloud Console
# https://console.cloud.google.com/run/detail/us-central1/ai-trip-api/logs
```

### Check Service Status

```bash
gcloud run services describe ai-trip-api --region us-central1
```

### Test Deployed API

```bash
SERVICE_URL=$(gcloud run services describe ai-trip-api --region us-central1 --format="value(status.url)")

curl -X POST "$SERVICE_URL/api/v1/ai_recs/generate-trip" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "departure": "Hà Nội",
    "destination": "Đà Lạt",
    "people": 2,
    "days": 3,
    "time": "2024-02-01",
    "money": "5 - 10 triệu"
  }'
```

## 🐛 Troubleshooting

### Error: "Could not automatically determine credentials"

**Local:**
```bash
gcloud auth application-default login
```

**Cloud Run:**
Service account không có quyền. Grant `roles/aiplatform.user`:
```bash
gcloud projects add-iam-policy-binding travelweb-485107 \
  --member "serviceAccount:YOUR_SERVICE_ACCOUNT" \
  --role "roles/aiplatform.user"
```

### Error: "Permission denied on Vertex AI API"

Check service account permissions:
```bash
gcloud projects get-iam-policy travelweb-485107 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*compute*"
```

### Error: "Model not found"

Kiểm tra model name trong .env:
```bash
GEMINI_MODEL=gemini-3-flash-preview
```

Available models:
- `gemini-1.5-flash` (stable)
- `gemini-1.5-pro` (high quality)
- `gemini-3-flash-preview` (latest, recommended)

### Error: "Timeout" hoặc "Slow response"

Tăng timeout cho Cloud Run:
```bash
gcloud run services update ai-trip-api \
  --region us-central1 \
  --timeout 300s \
  --memory 512Mi
```

### Logs không hiển thị

Đảm bảo logging được enable:
```python
# Trong code đã có logging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

## 📈 Performance Optimization

### 1. Increase Resources

```bash
gcloud run services update ai-trip-api \
  --region us-central1 \
  --memory 1Gi \
  --cpu 2 \
  --timeout 300s
```

### 2. Set Minimum Instances (tránh cold start)

```bash
gcloud run services update ai-trip-api \
  --region us-central1 \
  --min-instances 1
```

⚠️ **Warning**: Min instances sẽ tốn phí liên tục!

### 3. Connection Pooling

Đã implement trong code:
- Reuse credentials
- HTTP connection pooling với `requests`

## 🔄 Rollback

Nếu có vấn đề, rollback về version trước:

```bash
# List revisions
gcloud run revisions list --service ai-trip-api --region us-central1

# Rollback to previous revision
gcloud run services update-traffic ai-trip-api \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```

## ✅ Deployment Checklist

Trước khi deploy production:

- [ ] Test script pass (`python test_vertex_ai.py`)
- [ ] Local server hoạt động (`uvicorn main:app`)
- [ ] .env file đã cấu hình đúng
- [ ] Service account có đủ permissions
- [ ] Dockerfile build OK
- [ ] Database connection OK
- [ ] All environment variables set
- [ ] Logs được monitor
- [ ] Alert được setup (optional)

## 📞 Support

Nếu gặp vấn đề:

1. Check logs: `gcloud run services logs tail ai-trip-api`
2. Run test script: `python test_vertex_ai.py`
3. Check service account permissions
4. See [VERTEX_AI_SETUP.md](VERTEX_AI_SETUP.md) for detailed setup guide
5. See [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) for what changed

## 🔗 Useful Links

- [Cloud Run Console](https://console.cloud.google.com/run?project=travelweb-485107)
- [Vertex AI Console](https://console.cloud.google.com/vertex-ai?project=travelweb-485107)
- [IAM Console](https://console.cloud.google.com/iam-admin?project=travelweb-485107)
- [Logs Explorer](https://console.cloud.google.com/logs?project=travelweb-485107)

---

**Last Updated**: 2024-01-23
**Status**: ✅ Ready for deployment
