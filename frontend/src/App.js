// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useLocationTracking from './useLocationTracking';
import Map from './components/Map';
import ParkingButton from './components/ParkingButton';
import './App.css';  // Import the CSS file

function App() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [position, setPosition] = useState(null);

  // Fetch parking data from the backend
  useEffect(() => {
    axios
      .get('http://localhost:5000/api/parking-data')
      .then((response) => {
        const data = response.data.map((item) => {
          return {
            location: new window.google.maps.LatLng(
              item.location.coordinates[1], // latitude
              item.location.coordinates[0]  // longitude
            ),
            weight: 1,
          };
        });
        setHeatmapData(data);
      })
      .catch((error) => {
        console.error('Error fetching parking data:', error);
      });
  }, []);

  // Handle location updates
  const handleLocationUpdate = (coords) => {
    setPosition({
      lat: coords.latitude,
      lng: coords.longitude,
    });

    // Optionally send the user's current location to the backend
    axios
      .post('http://localhost:5000/api/parking-data', {
        location: {
          type: 'Point',
          coordinates: [coords.longitude, coords.latitude],
        },
        user: 'Anonymous',
      })
      .catch((error) => {
        console.error('Error sending location data:', error);
      });
  };

  // Use the custom hook to track location
  useLocationTracking(handleLocationUpdate);

  // Report that the user has found a parking spot
  const reportParkingSpot = () => {
    if (position) {
      axios
        .post('http://localhost:5000/api/parking-data', {
          location: {
            type: 'Point',
            coordinates: [position.lng, position.lat],
          },
          user: 'Anonymous',
          additionalInfo: {
            reportType: 'found_parking',
          },
        })
        .then(() => {
          alert('Thank you for reporting the parking spot!');
        })
        .catch((error) => {
          console.error('Error reporting parking spot:', error);
        });
    } else {
      alert('Unable to get your current location.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Parking Heatmap Finder</h1>
        <p>Find available parking spots with real-time heatmaps</p>
      </header>
      <div className="map-container">
        <Map heatmapData={heatmapData} apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} />
        <ParkingButton onClick={reportParkingSpot} />
      </div>
    </div>
  );
}

export default App;
