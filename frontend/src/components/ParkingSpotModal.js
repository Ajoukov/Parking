import React, { useState } from 'react';
import './Modal.css'; // Optional: You can style the modal in this CSS file

function ParkingSpotModal({ onSubmit, onClose }) {
  const [wheelchairAccessible, setWheelchairAccessible] = useState(false);
  const [otherSpots, setOtherSpots] = useState(false);

  const handleSubmit = () => {
    onSubmit(wheelchairAccessible, otherSpots);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Parking Spot Details</h3>
        <label>
          <input
            type="checkbox"
            checked={wheelchairAccessible}
            onChange={() => setWheelchairAccessible(!wheelchairAccessible)}
          />
          Is this spot wheelchair accessible?
        </label>
        <br />
        <label>
          <input
            type="checkbox"
            checked={otherSpots}
            onChange={() => setOtherSpots(!otherSpots)}
          />
          Did you see other open spots on the way here?
        </label>
        <br />
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose} style={{ marginLeft: '10px' }}>Close</button>
      </div>
    </div>
  );
}

export default ParkingSpotModal;
