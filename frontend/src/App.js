// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Map from './components/Map';
import useLocationTracking from './useLocationTracking';
import './App.css';
import UserDashboard from './components/UserDashboard';

const BPORT = process.env.REACT_APP_BPORT;

function App() {
  const [user, setUser] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [position, setPosition] = useState(null);

  // Load user from localStorage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    try {
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Error parsing JSON from localStorage:", e);
      // Optionally, remove the corrupted entry from localStorage
      localStorage.removeItem('user');
    }
  }, []);


  // Handle location updates (if needed for your project)
  useLocationTracking(coords => {
    setPosition({ lat: coords.latitude, lng: coords.longitude });
  });

  // Handle user logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <h1>Parking Heatmap Finder</h1>
            <div className="login-info">
              {user ? (
                <>
                  <span>Welcome, {user.username}</span>
                  <button className="login-button" onClick={handleLogout}>Logout</button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <Routes>
          {/* Public routes (login and signup) */}
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp setUser={setUser} />} />
          <Route path="/user/" element={user ? <UserDashboard user={user} /> : <Login setUser={setUser} />} />

          {/* Protected route (map) */}
          <Route path="/" element={user ? <Map heatmapData={heatmapData} /> : <Navigate to="/login" />} />

          {/* Fallback route for unknown paths */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
