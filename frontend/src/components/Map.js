import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

function Map({ heatmapData }) {
  const [locations, setLocations] = useState([]); // State to store recorded locations
  const trackingInterval = useRef(null); // Use useRef to persist interval without causing re-renders

  // Function to record user's location and keep locations from the past 10 minutes
  const recordLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;

          // Create a new location object with a timestamp
          const newLocation = { lat: latitude, lng: longitude, timestamp: Date.now() };

          // Update locations state
          setLocations((prevLocations) => {
            // Filter out locations older than 10 minutes
            const tenMinutesAgo = Date.now() - 10 * 60 * 1000; // 10 minutes in milliseconds
            const filteredLocations = prevLocations.filter(
              (location) => location.timestamp >= tenMinutesAgo
            );

            // Add the new location to the filtered list
            const updatedLocations = [...filteredLocations, newLocation];

            // Save the updated list to localStorage
            localStorage.setItem('locations', JSON.stringify(updatedLocations));

            return updatedLocations; // Update the state with the new list
          });
        },
        (err) => {
          console.error("Error getting location: ", err);
        }
      );
    }
  };

  // Send data to back-end when the user presses "I Found Parking"
  const sendParkingData = () => {
    const storedLocations = JSON.parse(localStorage.getItem('locations')) || [];

    // Send the locations to the back-end server
    axios.post('http://localhost:5000/api/parking', { locations: storedLocations })
      .then(response => {
        console.log('Parking data sent successfully:', response.data);
        alert('Parking location data sent to the server!');
      })
      .catch(error => {
        console.error('Error sending parking data:', error);
      });
  };

  // Initialize the map and set up location tracking
  useEffect(() => {
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);

    const loadGoogleMapsScript = () => {
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=visualization`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        script.onload = () => {
          initMap();
        };
      } else {
        if (window.google && window.google.maps) {
          initMap(); // Initialize the map if API is already loaded
        }
      }
    };

    const initMap = () => {
      const map = new window.google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: { lat: 42.373611, lng: -71.109733 }, // Example: Harvard location
      });

      const heatmap = new window.google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
      });
    };

    loadGoogleMapsScript();

    // Start location tracking (record location every 5 seconds) and save interval in useRef
    trackingInterval.current = setInterval(recordLocation, 5000);

    // Cleanup interval on component unmount
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
    };
  }, [heatmapData]);

  return (
    <div style={{ position: 'relative' }}>
      <div id="map" style={{ height: '500px', width: '100%' }}></div>

      {/* Button to send parking data */}
      <button
        onClick={sendParkingData} // Sends the data when the button is clicked
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
    </div>
  );
}

export default Map;
