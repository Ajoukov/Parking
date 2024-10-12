// models/ParkingData.js
const mongoose = require('mongoose');

const ParkingDataSchema = new mongoose.Schema({
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [longitude, latitude]
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  user: String,
  additionalInfo: Object,
});

ParkingDataSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ParkingData', ParkingDataSchema);
