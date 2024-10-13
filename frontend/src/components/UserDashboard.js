import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './UserDashboard.css';
import axios from 'axios';

const BPORT = process.env.REACT_APP_BPORT;

function UserDashboard({ user, handleLogout, setUser }) {
  const [rating, setRating] = useState(5);
  const [level, setLevel] = useState(1);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    showAccessibility: false,
  });
  const [selectedFile, setSelectedFile] = useState(null); // For profile picture upload
  const fileInputRef = useRef(null); // Reference to file input

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:${BPORT}/api/users/${user._id}`);
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
      const response = await fetch(`http://localhost:${BPORT}/api/users/${user._id}/settings`, {
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

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handle profile picture upload
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      const response = await axios.post(`http://localhost:${BPORT}/api/users/${user._id}/upload-profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedUser = { ...user, profilePicture: response.data.profilePicture };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      alert('Profile picture uploaded successfully');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
    }
  };

  // Trigger the file input on avatar click
  const handleAvatarClick = () => {
    fileInputRef.current.click(); // Trigger file input click
  };

  return (
    <div style={{ marginTop: '20px' }} className={`user-dashboard`}>
      <h2>{user.username}</h2>
      <p>☆ {level}</p>

      <div className="avatar-container" onClick={handleAvatarClick}>
        {/* < onClick={handleUpload}>Upload</button> */}
        <button className="edit-overlay">Select profile picture</button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }} // Hide the input
      />
      <button onClick={handleUpload}>Upload</button>

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

      <button className="back-button" onClick={() => window.location.href = "/"}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </button>
      
      <button className="save-button" onClick={handleSaveSettings}>
        <FontAwesomeIcon icon={faSave} /> Save Settings
      </button>

      <button className="logout-button" onClick={handleLogout}>
        <FontAwesomeIcon icon={faSignOutAlt} /> Logout
      </button>
    </div>
  );
}

export default UserDashboard;
