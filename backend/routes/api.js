// routes/api.js
const express = require('express');
const router = express.Router();
const ParkingData = require('../models/ParkingData');

// Endpoint to submit parking data
router.post('/parking-data', async (req, res) => {
  try {
    const data = new ParkingData(req.body);
    await data.save();
    res.status(201).json({ message: 'Data saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get parking data
router.get('/parking-data', async (req, res) => {
  try {
    const data = await ParkingData.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
