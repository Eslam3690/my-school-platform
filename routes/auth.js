const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // استيراد نموذج المستخدم

const router = express.Router();

// نقطة النهاية للتسجيل
router.post('/signup', async (req, res) => {
  const { username, student_phone, parent_phone, governorate, grade_level, password, role } = req.body;

  try {
    const userExists = await User.findOne({ student_phone });

    if (userExists) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف موجود بالفعل.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      student_phone,
      parent_phone,
      governorate,
      grade_level,
      password: hashedPassword,
      role
    });

    await newUser.save();
    res.status(201).json({ success: true, message: 'تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول.' });
  } catch (error) {
    console.error('Error during signup:', error.message);
    res.status(500).json({ success: false, error: 'حدث خطأ في السيرفر.' });
  }
});

// نقطة النهاية لتسجيل الدخول
router.post('/login', async (req, res) => {
  const { student_phone, password } = req.body;

  try {
    const user = await User.findOne({ student_phone });

    if (!user) {
      return res.status(401).json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحين.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return res.json({ success: true, message: 'تم تسجيل الدخول بنجاح!', role: user.role });
    } else {
      return res.status(401).json({ success: false, message: 'رقم الهاتف أو كلمة المرور غير صحيحين.' });
    }

  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ success: false, message: 'خطأ في السيرفر.' });
  }
});

module.exports = router;