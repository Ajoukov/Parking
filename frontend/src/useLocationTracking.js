// src/useLocationTracking.js
import { useEffect } from 'react';

function useLocationTracking(onLocationUpdate) {
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          onLocationUpdate(position.coords);
        },
        (error) => console.error(error),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, [onLocationUpdate]);
}

export default useLocationTracking;
