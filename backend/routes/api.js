// routes/api.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

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
