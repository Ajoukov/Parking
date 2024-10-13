import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useLocationTracking from '../useLocationTracking'; // Ensure this is the correct path to the hook

const BPORT = process.env.REACT_APP_BPORT;

function Map({ heatmapData }) {
  const mapRef = useRef(null); // Ref to store the map object
  const mapInitialized = useRef(false); // Ref to track if the map is already initialized
  const heatmapLayerRef = useRef(null); // Ref to store heatmap layer
  const [isTracking, setIsTracking] = useState(false); // Controls tracking
  const [showHeatmap, setShowHeatmap] = useState(false); // Controls whether heatmap is shown
  const navigate = useNavigate();

  // Function to record the user's location
  const handleLocationUpdate = (coords) => {
    console.log('New position:', coords);
    const { latitude, longitude } = coords;

    const newLocation = { lat: latitude, lng: longitude, timestamp: Date.now() };

    const storedLocations = JSON.parse(localStorage.getItem('locations')) || [];
    const updatedLocations = [...storedLocations, newLocation];
    localStorage.setItem('locations', JSON.stringify(updatedLocations));
  };

  // Initialize the map once, when the component mounts
  useEffect(() => {
    const initMap = () => {
      if (window.google && window.google.maps && !mapInitialized.current) {
        mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
          zoom: 12,
          center: { lat: 42.373611, lng: -71.109733 }, // Example: Harvard location
        });

        mapInitialized.current = true;
      }
    };

    const loadGoogleMapsScript = () => {
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
          initMap();
        };
      } else if (window.google && window.google.maps) {
        initMap();
      }
    };

    loadGoogleMapsScript();
  }, []);

  // Use the location tracking hook when tracking is active
  useLocationTracking(handleLocationUpdate, isTracking);

  // Function to start location tracking and show heatmap
  const startTracking = () => {
    localStorage.setItem('locations', JSON.stringify([])); // Reset locations
    setIsTracking(true);
    setShowHeatmap(true);
  };

  // Update the heatmap layer whenever heatmapData or showHeatmap changes
  useEffect(() => {
    if (mapInitialized.current && showHeatmap && heatmapData.length > 0) {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null); // Clear the existing heatmap
      }

      const gradient = [
        'rgba(255, 0, 0, 0)',  // Transparent (no weight)
        'rgba(255, 0, 0, 1)',  // Red (bad spots, low weight)
        'rgba(255, 165, 0, 1)', // Orange
        'rgba(255, 255, 0, 1)', // Yellow
        'rgba(0, 255, 0, 1)',  // Green (good spots, high weight)
      ];

      heatmapLayerRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData.map(coord => ({
          location: new window.google.maps.LatLng(coord.lat, coord.lng),
          weight: coord.weight || 1, // Use the weight for intensity, default to 1
        })),
        map: mapRef.current,
        radius: 20,
        opacity: 0.8,
        gradient: gradient,  // Apply the custom gradient
      });
    }
  }, [heatmapData, showHeatmap]); // Re-run this effect when heatmapData or showHeatmap changes

  const sendParkingData = () => {
    const storedLocations = JSON.parse(localStorage.getItem('locations')) || [];
    localStorage.setItem('locations', JSON.stringify([])); // Reset locations
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!storedUser || !storedUser._id) {
      console.error('User not logged in or user ID missing');
      return;
    }

    axios.post(`http://localhost:${BPORT}/api/parking`, {
      locations: storedLocations,
      action: 'found_parking',
      userId: storedUser._id
    })
      .then(response => {
        console.log('Parking data sent successfully:', response.data);
        alert('Parking location data sent to the server!');
      })
      .catch(error => {
        console.error('Error sending parking data:', error);
      });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div id="map" style={{ height: '500px', width: '100%' }}></div>

      {/* Show Start Tracking button only if tracking hasn't started */}
      {!isTracking && (
        <button
          onClick={startTracking}
          style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#FF5722',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'background-color 0.3s ease',
          }}
        >
          Start Tracking
        </button>
      )}

      {/* Show I Found Parking button only if tracking has started */}
      {isTracking && (
        <button
          onClick={sendParkingData}
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = '#45a049')}
          onMouseOut={(e) => (e.target.style.backgroundColor = '#4CAF50')}
        >
          I Found Parking
        </button>
      )}

      {/* Button to navigate to user dashboard */}
      <button
        onClick={() => navigate('/user')}
        style={{
          position: 'absolute',
          bottom: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#008CBA',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'background-color 0.3s ease',
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#007BB5')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#008CBA')}
      >
        Go to Dashboard
      </button>
    </div>
  );
}

export default Map;
