// routes/api.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const Segment = require('../models/Segment');



// Endpoint to get user data (rating, level, settings)
router.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      rating: user.rating,
      level: user.level,
      settings: user.settings,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to update user settings
router.post('/users/:userId/settings', async (req, res) => {
  const { userId } = req.params;
  const { emailNotifications, showAccessibility } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user settings
    user.settings = { emailNotifications, showAccessibility };
    await user.save();

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Function to use Google Roads API to snap to nearest road
const snapToRoads = async (locations) => {
  const path = locations.map(loc => `${loc.lat},${loc.lng}`).join('|'); // Format locations as path
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Your Google Maps API key
  const url = `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    return response.data.snappedPoints; // Returns an array of snapped points
  } catch (error) {
    console.error('Error snapping points to roads:', error);
    throw new Error('Failed to snap points to roads');
  }
};

// Endpoint to store the user's location data when they find parking
router.post('/parking', async (req, res) => {
  const { locations } = req.body; // The array of location data sent by the front-end
  if (!locations || locations.length === 0) {
    return res.status(400).send('No location data provided');
  }

  try {
    // Snap recorded points to nearest roads
    const snappedPoints = await snapToRoads(locations);

    console.log(snappedPoints);

    // Loop through snapped points and associate them with road segments
    for (let snappedPoint of snappedPoints) {
      const { latitude, longitude } = snappedPoint.location;
      
      // Example: Find a road segment that matches the snapped location
      const segment = await Segment.findOne({
        lat_start: { $lte: latitude },
        lng_start: { $lte: longitude },
        lat_end: { $gte: latitude },
        lng_end: { $gte: longitude },
      });

      if (segment) {
        // Update real-time parking likelihood for the segment
        segment.real_time_updates.push({ user_report: 'left_parking' });
        segment.parking_likelihood = Math.min(1, segment.parking_likelihood + 0.1); // Increase likelihood
        await segment.save();
      }
    }

    res.status(200).send('Parking data stored and segments updated');
  } catch (error) {
    console.error('Error storing parking data:', error);
    res.status(500).send('Error processing parking data');
  }
});


router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the email is already in use
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Create new user
    const newUser = new User({ username, email, password });
    await newUser.save();
    
    // Send back the new user as the response
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Send back the user object as the response
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


module.exports = router;
