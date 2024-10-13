import { useEffect } from 'react';

function useLocationTracking(onLocationUpdate, startTracking) {
  useEffect(() => {
    let watchId = null;

    if (startTracking && navigator.geolocation) {
      // Start tracking the user's location
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          onLocationUpdate(position.coords);
        },
        (error) => console.error(error),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }

    return () => {
      if (watchId !== null) {
        // Stop tracking when the component is unmounted or tracking is stopped
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [onLocationUpdate, startTracking]);

}

export default useLocationTracking;
