// src/components/Map.js
import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, HeatmapLayer } from '@react-google-maps/api';

// Use the environment variable for the API key
const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const Map = () => {
  // Heatmap data with parking spot latitudes, longitudes, and weights
  const [heatmapData, setHeatmapData] = useState([
    { lat: 42.3736, lng: -71.1097, weight: 3 },  // Harvard Square
    { lat: 42.3746, lng: -71.1043, weight: 2 },
    // Additional points can be added here
  ]);

  const mapStyles = {
    height: '100vh',  // Full viewport height
    width: '100%',    // Full width
  };

  const defaultCenter = {
    lat: 42.3736,  // Harvard Square Latitude
    lng: -71.1097, // Harvard Square Longitude
  };

  // Callback to ensure the Google Maps API is loaded properly
  const handleLoad = useCallback(() => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API failed to load.");
    } else {
      console.log("Google Maps API loaded successfully.");
    }
  }, []);

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyDbEzHIOlS1IRVmtFVIK6bqLspnnwt1xeM"
      libraries={['visualization']}  // Ensure HeatmapLayer works
      onLoad={handleLoad}
    >
      {window.google && window.google.maps && (
        <GoogleMap
          mapContainerStyle={mapStyles}
          zoom={14}
          center={defaultCenter}
        >
          <HeatmapLayer
            data={heatmapData.map(
              point => new window.google.maps.LatLng(point.lat, point.lng)
            )}
            options={{
              radius: 20,  // Radius of heatmap points
              opacity: 0.6,  // Opacity of heatmap
            }}
          />
        </GoogleMap>
      )}
    </LoadScript>
  );
};

export default Map;