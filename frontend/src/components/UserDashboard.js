// src/components/UserDashboard.js
import React, { useState, useEffect } from 'react';

const BPORT = process.env.REACT_APP_BPORT;

function UserDashboard({ user }) {
  const [rating, setRating] = useState(5); // Initial rating of 5 stars for all users
  const [level, setLevel] = useState(1); // Initial level 1 for all users
  const [settings, setSettings] = useState({
    emailNotifications: true,
    showAccessibility: false,
  });

  // Load user settings and level from backend when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log(`http://localhost:` + BPORT + `/api/users/${user._id}`);
        const response = await fetch(`http://localhost:` + BPORT + `/api/users/${user._id}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setRating(data.rating);
        setLevel(data.level);
        setSettings(data.settings);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };    
    fetchUserData();
  }, [user._id]);

  const handleSettingChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.checked });
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch(`http://localhost:` + BPORT + `/api/users/${user._id}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div>
      <h2>User Dashboard</h2>
      <p>Username: {user.username}</p>
      <p>Rating: {rating} stars</p>
      <p>Level: {level}</p>

      <h3>User Settings</h3>
      <div>
        <label>
          Email Notifications:
          <input
            type="checkbox"
            name="emailNotifications"
            checked={settings.emailNotifications}
            onChange={handleSettingChange}
          />
        </label>
      </div>
      <div>
        <label>
          Show Accessibility Information:
          <input
            type="checkbox"
            name="showAccessibility"
            checked={settings.showAccessibility}
            onChange={handleSettingChange}
          />
        </label>
      </div>

      <button onClick={handleSaveSettings}>Save Settings</button>
    </div>
  );
}

export default UserDashboard;
