// src/App.js
import React, { useState, useEffect } from 'react';
import {
  GoogleMap,
  LoadScript,
  HeatmapLayer,
} from '@react-google-maps/api';
import axios from 'axios';
import useLocationTracking from './useLocationTracking';

const mapStyles = {
  height: '100vh',
  width: '100%',
};

const libraries = ['visualization'];

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
    <div style={{ position: 'relative' }}>
      <LoadScript
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={14}
          center={{ lat: 40.7128, lng: -74.0060 }} // Center on New York City
        >
          <HeatmapLayer data={heatmapData} />
        </GoogleMap>
      </LoadScript>
      <button
        onClick={reportParkingSpot}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 10,
        }}
      >
        I Found Parking
      </button>
    </div>
  );
}

export default App;
