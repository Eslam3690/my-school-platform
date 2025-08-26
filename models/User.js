const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  student_phone: { type: String, required: true, unique: true },
  parent_phone: { type: String, required: true },
  governorate: { type: String, required: true },
  grade_level: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

module.exports = User;