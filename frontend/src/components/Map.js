import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Added for navigation

const BPORT = process.env.REACT_APP_BPORT;

function Map({ heatmapData }) {
  const mapRef = useRef(null); // Ref to store the map object
  const mapInitialized = useRef(false); // Ref to track if the map is already initialized
  const heatmapLayerRef = useRef(null); // Ref to store heatmap layer
  const navigate = useNavigate(); // useNavigate hook for navigation
  const trackingInterval = useRef(null); // Ref to track the interval for location updates
  const [isTracking, setIsTracking] = useState(false); // State to manage tracking status
  const [showHeatmap, setShowHeatmap] = useState(false); // State to control heatmap visibility

  // Function to record the user's location
  const recordLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;

          // Store the current location with a timestamp
          const newLocation = { lat: latitude, lng: longitude, timestamp: Date.now() };

          // Get the existing locations from localStorage
          const storedLocations = JSON.parse(localStorage.getItem('locations')) || [];

          // Add the new location to the array
          const updatedLocations = [...storedLocations, newLocation];

          // Store the updated locations in localStorage
          localStorage.setItem('locations', JSON.stringify(updatedLocations));
        },
        (err) => {
          console.error("Error getting location: ", err);
        }
      );
    }
  };

  // Initialize the map once, when the component mounts
  const initMap = () => {
    if (window.google && window.google.maps && !mapInitialized.current) {
      mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: { lat: 42.373611, lng: -71.109733 }, // Example: Harvard location
      });

      mapInitialized.current = true; // Set the flag to prevent re-initialization
    }
  };

  // Load the Google Maps script once and initialize the map
  useEffect(() => {
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);

    const loadGoogleMapsScript = () => {
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=` + apiKey + `&libraries=visualization`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
          initMap(); // Initialize the map once the script is loaded
        };
      } else {
        if (window.google && window.google.maps) {
          initMap(); // Initialize the map if API is already loaded
        }
      }
    };

    loadGoogleMapsScript();

    // Cleanup on component unmount
    return () => {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null); // Remove the heatmap from the map if component unmounts
      }
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current); // Clear the tracking interval on unmount
      }
    };
  }, []);

  // Watch for changes in heatmapData and update the heatmap layer
  useEffect(() => {
    if (mapInitialized.current && heatmapData.length > 0 && showHeatmap) {
      console.log('Heatmap Data:', heatmapData);

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
  }, [heatmapData, showHeatmap]); // Re-run this effect whenever heatmapData or showHeatmap changes

  // Function to start location tracking and show heatmap
  const startTracking = () => {
    setIsTracking(true);
    setShowHeatmap(true); // Show the heatmap when tracking starts
    trackingInterval.current = setInterval(recordLocation, 5000); // Track location every 5 seconds
  };

  // Stop tracking on unmount or if tracking is disabled
  useEffect(() => {
    if (!isTracking) {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current); // Clear the interval if tracking is stopped
      }
    }
  }, [isTracking]);

  // Send parking data to the backend
  const sendParkingData = () => {
    const storedLocations = JSON.parse(localStorage.getItem('locations')) || [];
    const storedUser = JSON.parse(localStorage.getItem('user')); // Get the user object from localStorage

    if (!storedUser || !storedUser._id) {
      console.error('User not logged in or user ID missing');
      return;
    }

    axios.post(`http://localhost:${BPORT}/api/parking`, {
      locations: storedLocations,
      action: 'found_parking', // Example action
      userId: storedUser._id // Pass the correct user ID
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
