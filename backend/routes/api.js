// routes/api.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const Segment = require('../models/Segment');
const mongoose = require('mongoose');

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

// Snapping locations to roads
const snapToRoads = async (locations) => {
  const path = locations.map(loc => `${loc.lat},${loc.lng}`).join('|');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    return response.data.snappedPoints;
  } catch (error) {
    console.error('Error snapping points to roads:', error);
    throw new Error('Failed to snap points to roads');
  }
};

router.post('/parking', async (req, res) => {
  const { locations, action, userId } = req.body;

  if (!locations || locations.length === 0) {
    return res.status(400).send('No location data provided');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Snap locations to roads
    const snappedPoints = await snapToRoads(locations);

    // Filter out duplicates by comparing consecutive snapped road segments
    const uniqueSegments = [];
    let prevSegment = null;

    for (let i = 0; i < snappedPoints.length; i++) {
      const snappedPoint = snappedPoints[i].location;
      const segmentIdentifier = `${snappedPoint.latitude}_${snappedPoint.longitude}`;

      // If the current segment is different from the previous one, add it to uniqueSegments
      if (!prevSegment || segmentIdentifier !== prevSegment) {
        uniqueSegments.push(snappedPoint);
        prevSegment = segmentIdentifier;
      }
    }

    console.log('Unique segments:', uniqueSegments);

    // Identify the last unique location (where parking was found)
    const lastPoint = uniqueSegments[uniqueSegments.length - 1];

    // Process all points: decrease for all except the last one
    for (let i = 0; i < uniqueSegments.length; i++) {
      const snappedPoint = uniqueSegments[i];
      const isLastPoint = i === uniqueSegments.length - 1;

      // Find or create the segment
      const segment = await Segment.findOneAndUpdate(
        { lat_start: snappedPoint.latitude, lng_start: snappedPoint.longitude },
        {
          $inc: {
            parking_likelihood: isLastPoint ? 0.2 : -0.1, // Increase for the last, decrease for others
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`Segment ${isLastPoint ? 'increased' : 'decreased'} for ${snappedPoint.latitude}, ${snappedPoint.longitude}`);

      // Save contribution to the user with the segment's ID
      user.contributions.push({
        segment_id: segment._id,
        action: isLastPoint ? 'found_parking' : 'drove_by',
        time: Date.now()
      });

      await user.save();
    }

    res.status(200).send('Parking data stored and segments updated');
  } catch (error) {
    console.error('Error storing parking data:', error);
    res.status(500).send('Error processing parking data');
  }
});



// Endpoint to get heatmap data
router.get('/parking/heatmap', async (req, res) => {
  try {
    const segments = await Segment.find({});
    const heatmapData = segments.map(segment => ({
      lat: segment.lat_start,
      lng: segment.lng_start,
      weight: segment.parking_likelihood // Include parking likelihood in heatmap data
    }));
    res.json(heatmapData);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ message: 'Error fetching heatmap data' });
  }
});


router.get('/parking/predictions', async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).send('Location data required');
  }

  try {
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    // Ensure that the latitude and longitude are numbers
    if (isNaN(latNum) || isNaN(lngNum)) {
      return res.status(400).send('Invalid latitude or longitude');
    }

    // Find nearby segments based on location, using a small range (e.g., 0.01 degrees)
    const segments = await Segment.find({
      lat_start: { $lte: latNum + 0.01, $gte: latNum - 0.01 },
      lng_start: { $lte: lngNum + 0.01, $gte: lngNum - 0.01 },
    });

    // Calculate the parking likelihood based on real-time and historic data
    const predictions = segments.map(segment => {
      const currentLikelihood = segment.parking_likelihood;

      // Example logic: Combine real-time updates and historical data
      const historicalLikelihood = segment.historic_data.find(h => h.time_of_day === getCurrentTimeOfDay());

      let combinedLikelihood = currentLikelihood;
      if (historicalLikelihood) {
        combinedLikelihood = (currentLikelihood * 0.6) + (historicalLikelihood.likelihood * 0.4);
      }

      return {
        segmentId: segment._id,
        location: {
          lat_start: segment.lat_start,
          lng_start: segment.lng_start,
          lat_end: segment.lat_end,
          lng_end: segment.lng_end,
        },
        parking_likelihood: combinedLikelihood,
      };
    });

    res.status(200).json(predictions);
  } catch (error) {
    console.error('Error fetching parking predictions:', error);
    res.status(500).send('Error fetching parking predictions');
  }
});

// Utility function to get the current time of day (weekend/weekday, morning/afternoon)
function getCurrentTimeOfDay() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
  const hour = now.getHours();

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  if (isWeekend) {
    return hour < 12 ? 'weekend_morning' : 'weekend_afternoon';
  } else {
    return hour < 12 ? 'weekday_morning' : 'weekday_afternoon';
  }
}


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
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Send back the user object as the response
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


module.exports = router;
