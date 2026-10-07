# 📧 Tour Reminder Email System

## Tổng quan

Hệ thống tự động gửi email nhắc nhở khách hàng trước khi chuyến tour bắt đầu. Tính năng này giúp:
- ✅ Tăng tỷ lệ khách hàng đến đúng giờ
- ✅ Giảm tỷ lệ no-show
- ✅ Cải thiện trải nghiệm khách hàng
- ✅ Tự động hóa quy trình nhắc nhở

## 🚀 Tính năng chính

### 1. **Gửi email tự động**
- Gửi email nhắc nhở tại các mốc thời gian cấu hình được
- Mặc định: 72 giờ (3 ngày), 24 giờ (1 ngày), và 3 giờ trước tour
- Chỉ gửi cho booking đã confirmed và đã thanh toán

### 2. **Email đẹp và chuyên nghiệp**
- Template HTML responsive
- Hiển thị đầy đủ thông tin tour
- Màu sắc thay đổi theo mức độ khẩn cấp:
  - 🟢 Xanh lá: 3+ ngày trước tour
  - 🟠 Cam: 1-2 ngày trước tour  
  - 🔴 Đỏ: < 12 giờ trước tour
- Danh sách chuẩn bị cho khách
- Nút CTA để xem chi tiết tour và quản lý booking

### 3. **Theo dõi và quản lý**
- Lưu lịch sử gửi email
- Tránh gửi trùng lặp
- Thống kê email đã gửi
- API để quản lý và kiểm tra

## 📋 Cấu trúc Database

### Bảng `tour_reminders`
```sql
CREATE TABLE tour_reminders (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    order_id INTEGER REFERENCES orders(id),
    reminder_type VARCHAR(50) NOT NULL, -- '72h', '24h', '3h'
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_sent_to VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'bounced'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(booking_id, reminder_type)
);
```

### System Settings
```sql
-- Bật/tắt tính năng
tour_reminder_enabled = 'true'

-- Cấu hình thời gian nhắc nhở (JSON array, đơn vị: giờ)
tour_reminder_intervals = '[72, 24, 3]'
```

## 🔧 Cài đặt

### 1. Chạy migrations
```bash
# Tạo bảng tour_reminders (tự động khi server khởi động)
# Hoặc chạy SQL thủ công nếu cần

# Thêm system settings
psql -U your_user -d your_database -f migrations/add_tour_reminder_settings.sql
```

### 2. Cấu hình môi trường
Đảm bảo file `.env` có:
```env
# Email configuration (đã có sẵn)
EMAIL_USER=omgniceten@gmail.com
EMAIL_PASS=kkptczknvlpyqism

# Frontend URL (cho links trong email)
FRONTEND_URL=http://localhost:3000
```

### 3. Khởi động server
Scheduler sẽ tự động chạy khi server khởi động:
```bash
npm run dev
```

Bạn sẽ thấy log:
```
🚀 [TourReminder] Scheduler started - Checking for tour reminders every hour
```

## 📡 API Endpoints

### 1. **Xem thống kê** (Admin only)
```http
GET /api/tour-reminders/stats?days=7
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "reminder_type": "72h",
      "status": "sent",
      "count": 15,
      "sent_date": "2026-01-30"
    }
  ],
  "period": "Last 7 days"
}
```

### 2. **Xem tour sắp tới** (Admin only)
```http
GET /api/tour-reminders/upcoming?hours=72
Authorization: Bearer <admin_token>
```

### 3. **Gửi email thủ công** (Admin only)
```http
POST /api/tour-reminders/send-now
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "interval": 72  // Optional: chỉ gửi cho interval cụ thể
}
```

### 4. **Xem lịch sử gửi email của booking**
```http
GET /api/tour-reminders/history/:bookingId
Authorization: Bearer <user_token>
```

### 5. **Xem/Cập nhật cấu hình** (Admin only)
```http
# Xem cấu hình
GET /api/tour-reminders/settings
Authorization: Bearer <admin_token>

# Cập nhật cấu hình
PUT /api/tour-reminders/settings
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "tour_reminder_enabled": true,
  "tour_reminder_intervals": [72, 48, 24, 12, 3]
}
```

## ⚙️ Cấu hình

### Thay đổi thời gian nhắc nhở

**Cách 1: Qua API** (Khuyến nghị)
```bash
curl -X PUT http://localhost:5000/api/tour-reminders/settings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tour_reminder_intervals": [168, 72, 24, 6, 1]
  }'
```

**Cách 2: Trực tiếp trong database**
```sql
UPDATE system_settings 
SET setting_value = '[168, 72, 24, 6, 1]'
WHERE setting_key = 'tour_reminder_intervals';
```

Ví dụ intervals:
- `168` = 7 ngày trước
- `72` = 3 ngày trước
- `24` = 1 ngày trước
- `6` = 6 giờ trước
- `1` = 1 giờ trước

### Tắt/Bật tính năng

```sql
-- Tắt
UPDATE system_settings 
SET setting_value = 'false'
WHERE setting_key = 'tour_reminder_enabled';

-- Bật
UPDATE system_settings 
SET setting_value = 'true'
WHERE setting_key = 'tour_reminder_enabled';
```

## 🧪 Testing

### Test gửi email thủ công
```bash
# Gửi tất cả reminders đang pending
curl -X POST http://localhost:5000/api/tour-reminders/send-now \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Chỉ gửi reminders 24h
curl -X POST http://localhost:5000/api/tour-reminders/send-now \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"interval": 24}'
```

### Kiểm tra tours sắp tới
```bash
curl http://localhost:5000/api/tour-reminders/upcoming?hours=72 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📊 Monitoring

### Xem logs
Server sẽ log mỗi khi:
- Scheduler chạy (mỗi giờ)
- Email được gửi thành công
- Email gửi thất bại

Ví dụ logs:
```
🔄 [TourReminder] Checking for tours needing reminders at intervals: 72, 24, 3 hours
📧 [TourReminder] Sending 72h reminders to 5 customers...
   ✅ Sent 72h reminder to customer@email.com for tour "Hà Nội - Sapa 3N2Đ"
   ✅ Sent 72h reminder to another@email.com for tour "Phú Quốc 4N3Đ"
```

### Xem thống kê
```bash
# Thống kê 7 ngày gần nhất
curl http://localhost:5000/api/tour-reminders/stats?days=7 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Thống kê 30 ngày
curl http://localhost:5000/api/tour-reminders/stats?days=30 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🎨 Tùy chỉnh Email Template

File: `services/email.services.js` → function `sendTourReminderEmail()`

Bạn có thể tùy chỉnh:
- Màu sắc và styling
- Nội dung text
- Logo và hình ảnh
- Thông tin liên hệ
- Danh sách chuẩn bị

## 🔒 Bảo mật

- ✅ Chỉ gửi cho bookings đã confirmed
- ✅ Chỉ gửi cho bookings đã thanh toán (PAID)
- ✅ Tránh gửi trùng lặp với UNIQUE constraint
- ✅ API endpoints được bảo vệ bởi authentication
- ✅ Lưu lịch sử để audit

## 🐛 Troubleshooting

### Email không được gửi
1. Kiểm tra system settings:
   ```sql
   SELECT * FROM system_settings 
   WHERE setting_key LIKE 'tour_reminder%';
   ```

2. Kiểm tra logs server
3. Kiểm tra email credentials trong `.env`
4. Test gửi thủ công qua API

### Gửi trùng lặp
- Hệ thống đã có UNIQUE constraint để tránh trùng lặp
- Nếu vẫn xảy ra, kiểm tra bảng `tour_reminders`

### Scheduler không chạy
- Kiểm tra server có khởi động thành công không
- Xem logs khi server start
- Restart server

## 📝 Notes

- Scheduler chạy **mỗi giờ** để kiểm tra
- Email chỉ gửi cho bookings có `status = 'confirmed'`
- Chỉ gửi cho bookings đã thanh toán (`payment_status = 'PAID'`)
- Mỗi booking chỉ nhận 1 email cho mỗi interval (tránh spam)
- Thời gian được tính dựa trên `tour_schedules.start_date`

## 🚀 Tính năng tương lai

- [ ] Gửi SMS reminder
- [ ] Push notification
- [ ] Tùy chỉnh template theo từng tour
- [ ] A/B testing email templates
- [ ] Unsubscribe option
- [ ] Multi-language support
- [ ] Weather forecast trong email
- [ ] Checklist tương tác được

## 📞 Support

Nếu cần hỗ trợ, liên hệ dev team hoặc xem logs tại:
- Server logs: Console output
- Database logs: `tour_reminders` table
- Email service logs: `email.services.js`
