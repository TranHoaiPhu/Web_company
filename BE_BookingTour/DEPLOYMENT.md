# Deployment Guide - New Features

## 🚨 Quan Trọng

Bạn đang gặp lỗi **"Route not found"** vì:
1. ✅ Code mới chỉ có ở **local** (máy tính của bạn)
2. ❌ Code chưa được **deploy lên production** (Google Cloud Run)
3. ❌ Database production **chưa có bảng `reviews`**

## 📋 Checklist Deploy

### Bước 1: Chạy Migration Database

**Trên Local:**
```bash
# Connect to local database
psql -U postgres -d booking_tour

# Run migration
\i migrations/complete_migration.sql

# Verify
SELECT * FROM reviews LIMIT 1;
```

**Trên Production (Google Cloud SQL):**
```bash
# Option 1: Using Cloud SQL Proxy
cloud_sql_proxy -instances=YOUR_INSTANCE_CONNECTION_NAME=tcp:5432

# Then connect
psql -h 127.0.0.1 -U postgres -d booking_tour

# Run migration
\i migrations/complete_migration.sql
```

**Option 2: Using Cloud Console**
1. Vào Google Cloud Console
2. Chọn SQL → Your Instance → Import
3. Upload file `migrations/complete_migration.sql`
4. Click Import

### Bước 2: Test Local Trước

```bash
# Start local server
npm run dev

# Test reviews API
curl http://localhost:5000/api/reviews/tour/1

# Test search API
curl "http://localhost:5000/api/search?q=ha%20long"

# Test amenities API
curl http://localhost:5000/api/amenities

# Test statistics (cần admin token)
curl http://localhost:5000/api/statistics/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Bước 3: Deploy lên Google Cloud Run

**Option 1: Using gcloud CLI**
```bash
# Build and deploy
gcloud run deploy booking-tour-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "$(cat .env | grep -v '^#' | xargs)"

# Or if using Dockerfile
docker build -t gcr.io/YOUR_PROJECT_ID/booking-tour-api .
docker push gcr.io/YOUR_PROJECT_ID/booking-tour-api
gcloud run deploy booking-tour-api \
  --image gcr.io/YOUR_PROJECT_ID/booking-tour-api \
  --region us-central1
```

**Option 2: Using Cloud Console**
1. Vào Cloud Run Console
2. Chọn service "booking-tour-api"
3. Click "Edit & Deploy New Revision"
4. Chọn "Deploy from source repository" hoặc upload code
5. Click Deploy

**Option 3: Using GitHub Actions (Recommended)**
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v0
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy booking-tour-api \
            --source . \
            --region us-central1 \
            --allow-unauthenticated
```

### Bước 4: Update Environment Variables

**Trên Cloud Run:**
1. Vào Cloud Run Console
2. Chọn service
3. Click "Edit & Deploy New Revision"
4. Scroll xuống "Variables & Secrets"
5. Thêm các biến mới:

```
VNP_TMN_CODE=your_vnpay_code
VNP_HASH_SECRET=your_secret
MOMO_PARTNER_CODE=your_code
MOMO_ACCESS_KEY=your_key
MOMO_SECRET_KEY=your_secret
ZALOPAY_APP_ID=your_app_id
ZALOPAY_KEY1=your_key1
ZALOPAY_KEY2=your_key2
```

### Bước 5: Verify Production

```bash
# Test production API
curl https://booking-tour-api-40205731279.us-central1.run.app/api/reviews/tour/1

# Should return reviews or empty array, NOT "Route not found"
```

## 🔧 Troubleshooting

### Lỗi: "Route not found"
**Nguyên nhân:** Code chưa deploy
**Giải pháp:** Deploy code lên Cloud Run (Bước 3)

### Lỗi: "table reviews does not exist"
**Nguyên nhân:** Chưa chạy migration
**Giải pháp:** Chạy migration SQL (Bước 1)

### Lỗi: "authenticateToken is not a function"
**Nguyên nhân:** File authJwt.js có duplicate exports
**Giải pháp:** ✅ Đã fix trong commit mới nhất

### Lỗi: "Invalid signature" (VNPay/MoMo)
**Nguyên nhân:** Environment variables chưa đúng
**Giải pháp:** Check lại credentials trong Cloud Run settings

## 📊 Database Schema Check

Chạy query này để verify database:

```sql
-- Check all required tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'reviews', 'payments', 'amenities', 'places', 
    'tours', 'orders', 'users', 'locations'
  )
ORDER BY table_name;

-- Should return 8 tables
```

## 🚀 Quick Deploy Commands

```bash
# 1. Run migration locally first
psql -U postgres -d booking_tour -f migrations/complete_migration.sql

# 2. Test locally
npm run dev
# In another terminal:
curl http://localhost:5000/api/reviews/tour/1

# 3. Commit and push
git add .
git commit -m "Add new API features: reviews, statistics, payments, search"
git push origin main

# 4. Deploy to Cloud Run
gcloud run deploy booking-tour-api \
  --source . \
  --region us-central1

# 5. Run migration on production database
# (Use Cloud SQL Proxy or Cloud Console)

# 6. Test production
curl https://booking-tour-api-40205731279.us-central1.run.app/api/reviews/tour/1
```

## 📝 Files to Deploy

Đảm bảo các files này có trong repository:

```
✅ routes/review.js
✅ routes/statistics.js
✅ routes/amenities.js
✅ routes/places.js
✅ routes/search.js
✅ routes/payments.js
✅ middleware/authJwt.js (đã fix)
✅ index.js (đã update routes)
✅ migrations/complete_migration.sql
✅ .env.example
✅ package.json (check dependencies)
```

## 🔐 Security Checklist

- [ ] Update `.gitignore` để không commit `.env`
- [ ] Sử dụng Secret Manager cho production credentials
- [ ] Enable Cloud SQL SSL connection
- [ ] Set up Cloud Armor for DDoS protection
- [ ] Configure CORS properly cho production domain
- [ ] Enable Cloud Logging & Monitoring

## 📞 Next Steps

1. ✅ Fix authJwt.js (Done)
2. 🔄 Run database migration
3. 🔄 Deploy to Cloud Run
4. 🔄 Test production endpoints
5. 🔜 Setup monitoring & alerts
6. 🔜 Configure payment gateway webhooks

---

**Lưu ý:** Sau khi deploy, có thể mất 1-2 phút để service khởi động. Nếu vẫn gặp lỗi, check Cloud Run logs:

```bash
gcloud run services logs read booking-tour-api --region us-central1
```
