const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const authRoutes = require('./routes/auth'); // استيراد ملف الـ routes

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// التحقق من وجود متغير MONGO_URL
const mongoURL = process.env.DATABASE_URL || process.env.MONGO_URL;

if (!mongoURL) {
  console.error('❌ خطأ: متغير MONGO_URL أو DATABASE_URL غير موجود.');
  console.error('تأكد من إضافته في إعدادات Variables على Railway.');
  process.exit(1);
}

// الاتصال بقاعدة بيانات MongoDB
mongoose.connect(mongoURL)
  .then(() => {
    console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح!');
    startServer();
  })
  .catch(err => {
    console.error('❌ خطأ في الاتصال بقاعدة بيانات MongoDB:', err.message);
    process.exit(1);
  });

// استخدام ملف الـ routes
app.use('/api', authRoutes);

// خدمة الملفات الثابتة (مثل ملفات HTML)
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'loginn.html'));
});

function startServer() {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}