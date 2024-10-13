import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useLocationTracking from '../useLocationTracking';
import ParkingSpotModal from './ParkingSpotModal'; // Import the modal

const BPORT = process.env.REACT_APP_BPORT;

function Map({ heatmapData }) {
  const mapRef = useRef(null); // Ref to store the map object
  const mapInitialized = useRef(false); // Ref to track if the map is already initialized
  const heatmapLayerRef = useRef(null); // Ref to store heatmap layer
  const currentLocationMarkerRef = useRef(null); // Ref to store the current location marker
  const [isTracking, setIsTracking] = useState(false); // Controls tracking
  const [showHeatmap, setShowHeatmap] = useState(false); // Controls whether heatmap is shown
  const [profilePicture, setProfilePicture] = useState(null); // Store the profile picture
  const [user, setUser] = useState(null); // Store the user data
  const [showModal, setShowModal] = useState(false); // Controls modal visibility
  const navigate = useNavigate();
  const [isDisabled, setIsDisabled] = useState(false);

  // Load user and profile picture from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    try {
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser); // Set the user data
        if (parsedUser.profilePicture) {
          setProfilePicture(parsedUser.profilePicture); // Load the profile picture
        }
      }
    } catch (e) {
      console.error("Error parsing JSON from localStorage:", e);
      localStorage.removeItem('user');
    }
  }, []);

  const handleLocationUpdate = (coords) => {
    const { latitude, longitude } = coords;

    const newLocation = { lat: latitude, lng: longitude, timestamp: Date.now() };
    const storedLocations = JSON.parse(localStorage.getItem('locations')) || [];
    const updatedLocations = [...storedLocations, newLocation];
    localStorage.setItem('locations', JSON.stringify(updatedLocations));

    // Update the current location marker on the map
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setPosition(new window.google.maps.LatLng(latitude, longitude));
    } else {
      // Create a new marker if it doesn't exist
      currentLocationMarkerRef.current = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: mapRef.current,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#50f',
          fillOpacity: 1,
          strokeWeight: 1,
        },
      });
    }

    // Center the map on the current location
    mapRef.current.setCenter({ lat: latitude, lng: longitude });
  };

  // Initialize the map and heatmap once, when the component mounts
  useEffect(() => {
    const initMap = () => {
      if (window.google && window.google.maps && !mapInitialized.current) {
        mapRef.current = new window.google.maps.Map(document.getElementById('map'), {
          zoom: 15,
          center: { lat: 42.373611, lng: -71.109733 }, // Example: Harvard location
        });

        // Initialize the heatmap layer
        heatmapLayerRef.current = new window.google.maps.visualization.HeatmapLayer({
          data: [],
          map: mapRef.current,
          radius: 30,
          opacity: 1,
          gradient: [
            'rgba(76, 185, 80, 0)',
            'rgba(76, 185, 80, 0.1)',
            'rgba(76, 185, 80, 0.2)',
            'rgba(76, 185, 80, 1)',
            'rgba(76, 185, 80, 1)',
            'rgba(76, 185, 80, 1)',
          ]
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

  // Update the heatmap layer whenever heatmapData or showHeatmap changes
  useEffect(() => {
    if (heatmapLayerRef.current && showHeatmap && heatmapData && heatmapData.length > 0) {
      const heatmapPoints = heatmapData.map(point => ({
        location: new window.google.maps.LatLng(point.lat, point.lng),
        weight: point.weight || 0,
      }));

      heatmapLayerRef.current.setData(heatmapPoints);
    }
  }, [heatmapData, showHeatmap]);

  useLocationTracking(handleLocationUpdate, isTracking);

  const startTracking = () => {
    localStorage.setItem('locations', JSON.stringify([])); // Reset locations
    setIsTracking(true);
    setShowHeatmap(true);
  };

  const handleParkingSpotSubmit = (wheelchairAccessible, otherSpots) => {
    const storedLocations = JSON.parse(localStorage.getItem('locations')) || [];
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!storedUser || !storedUser._id) {
      console.error('User not logged in or user ID missing');
      return;
    }

    axios.post(`http://localhost:${BPORT}/api/parking`, {
      locations: storedLocations,
      action: 'found_parking',
      userId: storedUser._id,
      wheelchairAccessible,
      otherSpots
    })
      .then(response => {
        console.log('Parking data sent successfully:', response.data);
        setShowModal(false); // Close modal after submitting
        setIsDisabled(true); // Disable the button after submitting
      })
      .catch(error => {
        console.error('Error sending parking data:', error);
      });
  };

  return (
    <div style={{ position: 'relative' }}>
      <div id="map" style={{ height: '95vh', width: '100%' }}></div>

      {!isTracking && (
        <button
          onClick={startTracking}
          style={{
            position: 'absolute',
            bottom: '100px',
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
          Begin Searching
        </button>
      )}

      {isTracking && (
        <button
          onClick={() => setShowModal(true)} // Show the modal when clicked
          disabled={isDisabled}
          style={{
            position: 'absolute',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isDisabled ? '#808080' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'background-color 0.3s ease',
          }}
        >
          I Found Parking
        </button>
      )}

      {/* Modal for additional parking information */}
      {showModal && (
        <ParkingSpotModal
          onSubmit={handleParkingSpotSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default Map;
