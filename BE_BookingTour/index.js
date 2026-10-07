const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { startOrderScheduler } = require('./services/orderScheduler');
const { startTourReminderScheduler } = require('./services/tourReminderScheduler');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
/* app.use(helmet()); */
/* app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
})); */
// Cho phép tất cả origin (không an toàn cho production)
app.use(cors({
  origin: "*",
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tours', require('./routes/tour'));
app.use('/api/tour-images', require('./routes/tour-image'));
app.use('/api/tour-schedules', require('./routes/tour-schedule'));
app.use('/api/tour-destinations', require('./routes/tour-destination'));
app.use('/api/destinations', require('./routes/destination'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/promotions', require('./routes/promotion'));
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/banners/', require('./routes/banners'))
app.use('/api/categories/', require('./routes/tour-category')); 
app.use('/api/bookings/', require('./routes/booking'))
app.use('/api/coupons', require('./routes/coupon'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/places', require('./routes/places'));
app.use('/api/search', require('./routes/search'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/orders', require('./routes/order'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/tour-days', require('./routes/tour-days'));
app.use('/api/users', require('./routes/user'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/support', require('./routes/support'));
app.use('/api/system-settings', require('./routes/system-settings'));
app.use('/api/tour-reminders', require('./routes/tour-reminders'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});


app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
}); 
app.listen(PORT, "0.0.0.0", () => {
  console.log("API running on 0.0.0.0:5000");
  
  // Start order auto-cancellation scheduler
  startOrderScheduler();
  
  // Start tour reminder scheduler
  startTourReminderScheduler();
});
