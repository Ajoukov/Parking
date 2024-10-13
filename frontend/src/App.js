import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Map from './components/Map';
import useLocationTracking from './useLocationTracking';
import UserDashboard from './components/UserDashboard';
import './App.css';

const BPORT = process.env.REACT_APP_BPORT;

function App() {
  const [user, setUser] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    try {
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Error parsing JSON from localStorage:", e);
      localStorage.removeItem('user');
    }
  }, []);

  // Function to refetch user data from the backend
  const refetchUser = async () => {
    try {
      if (user && user._id) {
        const response = await axios.get(`http://localhost:${BPORT}/api/users/${user._id}`);
        const updatedUser = response.data;
        setUser(updatedUser);
        // Update localStorage with the latest user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error refetching user data:', error);
    }
  };

  useLocationTracking(coords => {
    setPosition({ lat: coords.latitude, lng: coords.longitude });
  });

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const response = await axios.get(`http://localhost:${BPORT}/api/parking/heatmap`);
        setHeatmapData(response.data);
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
      }
    };
    fetchHeatmapData();
  }, [BPORT]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <div className="login-info">
              {user ? (
                <div className="user-info">
                  <img
                    className="user-avatar"
                    src={user.profilePicture ? `http://localhost:${BPORT}${user.profilePicture}` : 'default-avatar.png'}
                    alt="User Avatar"
                    onClick={() => window.location.href = "/user"}
                  />
                  <span style={{marginLeft:`20px`}}>{user.username}</span>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp setUser={setUser} />} />
          <Route
            path="/user"
            element={user ? <UserDashboard user={user} handleLogout={handleLogout} refetchUser={refetchUser} /> : <Login setUser={setUser} />}
          />
          <Route path="/" element={user ? <Map heatmapData={heatmapData} /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
