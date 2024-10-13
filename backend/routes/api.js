// routes/api.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
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
    return res.status(200).send('No location data provided');
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    const contributionPoints = 5;  // Define points for each contribution
    const pointsToLevelUp = 1;     // Points threshold to level up

    // Snap locations to roads
    const snappedPoints = await snapToRoads(locations);
    if (!snappedPoints) return;

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

    // Process all points: after processing the points, award contribution points
    for (let i = 0; i < uniqueSegments.length; i++) {
      const snappedPoint = uniqueSegments[i];
      const isLastPoint = i === uniqueSegments.length - 1;

      // Find or create the segment
      let segment = await Segment.findOne({ lat_start: snappedPoint.latitude, lng_start: snappedPoint.longitude });

      // Handle new segments (no historic data)
      if (!segment) {
        const newSegment = new Segment({
          lat_start: snappedPoint.latitude,
          lng_start: snappedPoint.longitude,
          parking_likelihood: isLastPoint ? 1 : 0,  // New segments get 0.3 if parked, otherwise 0
          historic_data: Array(14).fill(0),  // Initialize historic_data with 0 for 14 slots
        });

        await newSegment.save();
        segment = newSegment;

        console.log(`New segment created for ${snappedPoint.latitude}, ${snappedPoint.longitude}`);
      } else {
        // Update existing segments with weighted historical data
        const currentDay = new Date().getDay(); // 0 is Sunday, 6 is Saturday
        const isMorning = new Date().getHours() < 12; // Morning (true) or afternoon (false)
        const timeSlotIndex = currentDay * 2 + (isMorning ? 0 : 1); // Calculate index for the time slot

        const recentWeight = 0.7;  // Recent events weight
        const historicWeight = 0.3;  // Historic weight
        const recentEventScore = isLastPoint ? 0.3 : 0;  // Recent event score

        const newLikelihood = recentWeight * recentEventScore + historicWeight * segment.historic_data[timeSlotIndex];
        if (isNaN(newLikelihood)) {
          console.error('Calculated likelihood is NaN');
          continue; // Skip this iteration if likelihood is NaN
        }

        // Update the segment with new likelihood and historic data
        await Segment.findByIdAndUpdate(segment._id, {
          parking_likelihood: newLikelihood,
          $set: { [`historic_data.${timeSlotIndex}`]: newLikelihood },  // Update the specific time slot
        });

        console.log(`Segment updated for ${snappedPoint.latitude}, ${snappedPoint.longitude}`);
      }

      // Save contribution to the user with the segment's ID
      user.contributions.push({
        segment_id: segment ? segment._id : newSegment._id,
        action: isLastPoint ? 'found_parking' : 'drove_by',
        time: Date.now(),
      });

      // Increment user points for each contribution
      user.points += contributionPoints;
    }

    // Check if user should level up
    if (user.points >= pointsToLevelUp) {
      user.level += 1;  // Increment user level
      user.points = 0;   // Reset points after leveling up
      console.log(`User ${user.username} leveled up to level ${user.level}`);
    }

    await user.save();

    res.status(200).send('Parking data stored, segments updated, and user level adjusted if applicable');
  } catch (error) {
    console.error('Error storing parking data:', error);
    res.status(500).send('Error processing parking data');
  }
});

// Endpoint to get heatmap data
router.get('/parking/heatmap', async (req, res) => {
  try {
    // Get the current time of day
    const currentDay = new Date().getDay(); // 0 is Sunday, 6 is Saturday
    const isMorning = new Date().getHours() < 12; // Morning or afternoon
    const timeSlotIndex = currentDay * 2 + (isMorning ? 0 : 1); // Calculate index for the time slot

    // Fetch all segments
    const segments = await Segment.find({});

    // Prepare heatmap data
    const heatmapData = segments.map(segment => {
      // Get the historic likelihood for the current time slot
      const historicalLikelihood = segment.historic_data[timeSlotIndex] || 0;

      // Combine real-time parking likelihood and historical likelihood
      const combinedLikelihood = (segment.parking_likelihood * 0.6) + (historicalLikelihood * 0.4);

      // Return the lat, lng, and calculated weight for heatmap
      return {
        lat: segment.lat_start,
        lng: segment.lng_start,
        weight: combinedLikelihood // Combined likelihood used for the heatmap weight
      };
    });

    res.json(heatmapData);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ message: 'Error fetching heatmap data' });
  }
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, `${req.params.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Upload profile picture route
router.post('/users/:userId/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Save the image path in the user's profile
    user.profilePicture = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({ message: 'Profile picture uploaded successfully' });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture route
router.post('/users/:userId/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Save the image path in the user's profile
    user.profilePicture = `/uploads/${req.file.filename}`;
    await user.save();

    // Respond with the updated profile picture URL
    res.status(200).json({ profilePicture: user.profilePicture });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
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
