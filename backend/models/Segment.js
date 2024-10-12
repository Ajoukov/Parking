// models/Segment.js
const mongoose = require('mongoose');

const SegmentSchema = new mongoose.Schema({
  lat_start: { type: Number, required: true },
  lng_start: { type: Number, required: true },
  lat_end: { type: Number },
  lng_end: { type: Number },
  parking_likelihood: { type: Number, default: 0 },
  real_time_updates: [
    {
      user_report: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  historic_data: [
    {
      time_of_day: String,
      likelihood: Number
    }
  ]
});

const Segment = mongoose.model('Segment', SegmentSchema);
module.exports = Segment;
