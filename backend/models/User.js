// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rating: { type: Number, default: 5 }, // Initial rating is 5 stars
  level: { type: Number, default: 1 },  // Initial level is 1
  settings: {
    emailNotifications: { type: Boolean, default: true },
    showAccessibility: { type: Boolean, default: false },
  },
}, { timestamps: true });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
