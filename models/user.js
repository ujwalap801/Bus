const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['driver', 'student'], required: true },
});

module.exports = mongoose.model('User', userSchema);