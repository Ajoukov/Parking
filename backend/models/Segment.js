const mongoose = require('mongoose');

// Define the schema for road segments
const segmentSchema = new mongoose.Schema({
  segment_id: { type: String, required: true, unique: true },
  lat_start: { type: Number, required: true },
  lng_start: { type: Number, required: true },
  lat_end: { type: Number, required: true },
  lng_end: { type: Number, required: true },
  parking_likelihood: { type: Number, default: 0.5 }, // Baseline likelihood of 0.5
  real_time_updates: [
    {
      timestamp: { type: Date, default: Date.now },
      user_report: { type: String, enum: ['left_parking', 'found_parking'] },
    },
  ],
});

// Create the Segment model
const Segment = mongoose.model('Segment', segmentSchema);

module.exports = Segment;
