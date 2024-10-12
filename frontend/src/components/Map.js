import React, { useEffect } from 'react';

function Map({ heatmapData }) {
  useEffect(() => {
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);

    const loadGoogleMapsScript = () => {
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=visualization`;
        script.async = true; // Ensuring async loading
        script.defer = true; // Ensuring the script is deferred
        document.head.appendChild(script);

        script.onload = () => {
          initMap(); // Initialize the map after the script has loaded
        };
      } else {
        if (window.google && window.google.maps) {
          initMap(); // Initialize the map if the API is already loaded
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

    return () => {
      // No cleanup needed for Google Maps script
    };
  }, [heatmapData]);

  return <div id="map" style={{ height: '500px', width: '100%' }}></div>;
}

export default Map;
