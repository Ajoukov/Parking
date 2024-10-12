// src/components/Map.js
import React from 'react';
import { GoogleMap, LoadScript, HeatmapLayer } from '@react-google-maps/api';

const mapStyles = {
  height: '100vh',
  width: '100%',
};

const libraries = ['visualization'];

const Map = ({ heatmapData, apiKey }) => {
  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <GoogleMap
        mapContainerStyle={mapStyles}
        zoom={14}
        center={{ lat: 40.7128, lng: -74.0060 }} // Center on New York City
      >
        <HeatmapLayer data={heatmapData} />
      </GoogleMap>
    </LoadScript>
  );
};

export default Map;
