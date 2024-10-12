// src/components/ParkingButton.js
import React from 'react';

const ParkingButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 10,
      }}
    >
      I Found Parking
    </button>
  );
};

export default ParkingButton;
