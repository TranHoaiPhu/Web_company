# Rebuild Checklist - API to Cloud Run with Vertex AI

## ✅ Pre-Rebuild Checklist

Trước khi rebuild và deploy lên Cloud Run, kiểm tra các bước sau:

### 1. Code Changes Verified ✓

- [x] `gemini_client.py` đã chuyển sang Vertex AI
- [x] `requirements.txt` đã cập nhật (`google-auth` thay `google-genai`)
- [x] `.env` đã cấu hình Vertex AI
- [x] Error handling và logging đã được improve
- [x] Test script đã được tạo (`test_vertex_ai.py`)

### 2. Local Testing

```bash
# Step 1: Authenticate
gcloud auth application-default login

# Step 2: Install dependencies
cd API
pip install -r requirements.txt

# Step 3: Run test script
python test_vertex_ai.py

# Expected output:
# ✅ Configuration: PASS
# ✅ Authentication: PASS
# ✅ API Call: PASS
# 🎉 All tests passed!
```

### 3. Configuration Check

```bash
# Verify .env has correct settings
cat .env | grep -E "(USE_VERTEX_AI|GCP_PROJECT_ID|GEMINI_MODEL)"

# Should show:
USE_VERTEX_AI=true
GCP_PROJECT_ID=travelweb-485107
GEMINI_MODEL=gemini-3-flash-preview
```

### 4. Dependencies Check

```bash
# Verify requirements.txt
cat requirements.txt | grep google

# Should include:
google-auth

# Should NOT include:
# google-genai (removed)
```

## 🚀 Rebuild & Deploy Steps

### Step 1: Commit Changes

```bash
cd API

# Check what changed
git status

# Review changes
git diff

# Commit
git add .
git commit -m "Migrate to Vertex AI for trip generation API

- Replace Google AI Studio with Vertex AI
- Use gemini-3-flash-preview model
- Add better error handling and logging
- Update requirements.txt
- Add test script and deployment guides"

# Push
git push origin main
```

### Step 2: Build Docker Image Locally (Optional, để test)

```bash
# Build
docker build -t ai-trip-api-test .

# Run locally
docker run -p 8080:8080 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_KEY="$SUPABASE_KEY" \
  -e SECRET_KEY="$SECRET_KEY" \
  -e USE_VERTEX_AI=true \
  -e GCP_PROJECT_ID=travelweb-485107 \
  -e GCP_LOCATION=global \
  -e GEMINI_MODEL=gemini-3-flash-preview \
  -e GOOGLE_PLACES_API_KEY="$GOOGLE_PLACES_API_KEY" \
  ai-trip-api-test

# Test
curl http://localhost:8080/api/v1/ai_recs/
```

### Step 3: Deploy to Cloud Run

**Option A: Quick Deploy (Recommended)**

```bash
cd API

# Deploy from source (Cloud Build tự động build)
gcloud run deploy ai-trip-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --timeout 300s \
  --memory 1Gi \
  --cpu 1 \
  --set-env-vars "USE_VERTEX_AI=true,GCP_PROJECT_ID=travelweb-485107,GCP_LOCATION=global,GEMINI_MODEL=gemini-3-flash-preview"

# Set other env vars from .env file
# (DATABASE_URL, SUPABASE_URL, etc.)
```

**Option B: Build Then Deploy**

```bash
# Step 1: Build image with Cloud Build
gcloud builds submit --tag gcr.io/travelweb-485107/ai-trip-api

# Step 2: Deploy the image
gcloud run deploy ai-trip-api \
  --image gcr.io/travelweb-485107/ai-trip-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --timeout 300s \
  --memory 1Gi
```

**Option C: Deploy với Environment Variables từ file**

```bash
# Create env vars from .env (exclude comments and empty lines)
ENV_VARS=$(cat .env | grep -v '^#' | grep -v '^$' | tr '\n' ',' | sed 's/,$//')

# Deploy
gcloud run deploy ai-trip-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --timeout 300s \
  --memory 1Gi \
  --set-env-vars "$ENV_VARS"
```

### Step 4: Verify Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe ai-trip-api \
  --region us-central1 \
  --format="value(status.url)")

echo "Service URL: $SERVICE_URL"

# Health check
curl "$SERVICE_URL/api/v1/ai_recs/"

# Should return list or 200 OK
```

### Step 5: Test Production Endpoint

```bash
# Get JWT token from your app
TOKEN="your_jwt_token_here"

# Test generate-trip endpoint
curl -X POST "$SERVICE_URL/api/v1/ai_recs/generate-trip" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "departure": "Hà Nội",
    "destination": "Đà Lạt",
    "people": 2,
    "days": 2,
    "time": "2024-02-01",
    "money": "5 - 10 triệu"
  }'

# Should return trip plan JSON
```

### Step 6: Monitor Logs

```bash
# Real-time logs
gcloud run services logs tail ai-trip-api --region us-central1

# Look for:
# ✅ "Vertex AI Config: USE_VERTEX_AI=true..."
# ✅ "Starting trip plan generation with Vertex AI"
# ✅ "Trip plan generated successfully"
```

## 🔍 Post-Deployment Verification

### 1. Service Account Permissions

```bash
# Check service account
gcloud run services describe ai-trip-api \
  --region us-central1 \
  --format="value(spec.template.spec.serviceAccountName)"

# Check IAM permissions
PROJECT_NUMBER=$(gcloud projects describe travelweb-485107 --format="value(projectNumber)")

gcloud projects get-iam-policy travelweb-485107 \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --format="table(bindings.role)"

# Should include: roles/aiplatform.user
```

### 2. API Endpoint Tests

```bash
# Test all critical endpoints
SERVICE_URL=$(gcloud run services describe ai-trip-api --region us-central1 --format="value(status.url)")

# 1. Health check
curl "$SERVICE_URL/api/v1/ai_recs/"

# 2. Generate trip (với valid JWT token)
curl -X POST "$SERVICE_URL/api/v1/ai_recs/generate-trip" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"departure":"Hà Nội","destination":"Đà Lạt","people":2,"days":2,"time":"2024-02-01","money":"5 - 10 triệu"}'
```

### 3. Performance Check

```bash
# Check response time
time curl "$SERVICE_URL/api/v1/ai_recs/"

# Should be < 2 seconds for cold start
# Should be < 500ms for warm requests
```

### 4. Error Handling Test

```bash
# Test with invalid input
curl -X POST "$SERVICE_URL/api/v1/ai_recs/generate-trip" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"invalid":"data"}'

# Should return proper error message
```

## 🐛 Common Issues & Solutions

### Issue 1: "Permission denied on Vertex AI"

**Solution:**
```bash
PROJECT_NUMBER=$(gcloud projects describe travelweb-485107 --format="value(projectNumber)")

gcloud projects add-iam-policy-binding travelweb-485107 \
  --member "serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role "roles/aiplatform.user"
```

### Issue 2: "Module not found: google.auth"

**Solution:**
```bash
# Rebuild với requirements.txt mới
gcloud builds submit --tag gcr.io/travelweb-485107/ai-trip-api
gcloud run deploy ai-trip-api --image gcr.io/travelweb-485107/ai-trip-api --region us-central1
```

### Issue 3: "Timeout" khi generate trip

**Solution:**
```bash
# Tăng timeout và memory
gcloud run services update ai-trip-api \
  --region us-central1 \
  --timeout 300s \
  --memory 1Gi \
  --cpu 2
```

### Issue 4: Environment variables không load

**Solution:**
```bash
# Set lại env vars
gcloud run services update ai-trip-api \
  --region us-central1 \
  --set-env-vars "USE_VERTEX_AI=true,GCP_PROJECT_ID=travelweb-485107,GCP_LOCATION=global,GEMINI_MODEL=gemini-3-flash-preview"
```

### Issue 5: Cold start chậm

**Solution:**
```bash
# Set minimum instances (tốn phí nhưng không cold start)
gcloud run services update ai-trip-api \
  --region us-central1 \
  --min-instances 1

# Hoặc tăng CPU allocation
gcloud run services update ai-trip-api \
  --region us-central1 \
  --cpu-boost
```

## 📊 Monitoring Setup

### Enable Logging

Logs đã được enable trong code với `logging` module.

### View Logs in Console

1. Go to: https://console.cloud.google.com/run/detail/us-central1/ai-trip-api/logs
2. Filter by severity: INFO, WARNING, ERROR
3. Search for: "Vertex AI", "trip plan", "error"

### Set Up Alerts (Optional)

```bash
# Create alert policy for errors
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="API Error Rate Alert" \
  --condition-display-name="High error rate" \
  --condition-expression='
    resource.type="cloud_run_revision"
    AND resource.labels.service_name="ai-trip-api"
    AND severity="ERROR"
  '
```

## ✅ Final Checklist

Sau khi deploy, verify:

- [ ] Service đang chạy (status: READY)
- [ ] Health check endpoint OK
- [ ] Generate trip endpoint trả về valid trip plan
- [ ] Logs hiển thị Vertex AI messages
- [ ] No authentication errors
- [ ] Response time < 30s
- [ ] Frontend connect được với API mới
- [ ] Database integration OK
- [ ] Background tasks (save_place) OK

## 🔄 Rollback Plan

Nếu có vấn đề nghiêm trọng:

```bash
# List revisions
gcloud run revisions list \
  --service ai-trip-api \
  --region us-central1

# Rollback to previous revision
gcloud run services update-traffic ai-trip-api \
  --region us-central1 \
  --to-revisions PREVIOUS_REVISION=100
```

## 📞 Next Steps

Sau khi deploy thành công:

1. ✅ Update frontend với new API URL (nếu có thay đổi)
2. ✅ Notify team về migration
3. ✅ Monitor logs trong 24h đầu
4. ✅ Collect feedback từ users
5. ✅ Document any issues found

## 🎉 Success Criteria

Deployment thành công khi:

- ✅ Service chạy ổn định > 24h
- ✅ Không có authentication errors
- ✅ Trip generation hoạt động bình thường
- ✅ Response time acceptable
- ✅ No increase in error rate
- ✅ Frontend integration OK

---

**Date**: 2024-01-23
**Status**: Ready for rebuild
**Deployment Target**: Cloud Run (us-central1)
**Service Name**: ai-trip-api
