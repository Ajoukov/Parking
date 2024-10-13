// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rating: { type: Number, default: 5 },  // Initial rating is 5 stars
  level: { type: Number, default: 1 },   // Initial level is 1
  points: { type: Number, default: 0 },  // Track user points for contributions
  contributions: [                       // Array to track their parking contributions
    {
      segment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Segment' }, // Reference to the road segment
      action: String,  // Example: 'found_parking', 'left_parking'
      time: { type: Date, default: Date.now },
    }
  ],
  settings: {
    emailNotifications: { type: Boolean, default: true },
    showAccessibility: { type: Boolean, default: false },
  },
  profilePicture: { type: String, default: '' },
}, { timestamps: true });

// Encrypt the password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to match entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
