import React from 'react';
import './RoomJoinModal.css';

const RoomJoinModal = ({ room, onConfirm, onCancel, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="room-join-modal-overlay">
      <div className="room-join-modal">
        <div className="room-join-modal-header">
          <h3>Intégrer la salle</h3>
          <button className="room-join-modal-close" onClick={onCancel}>×</button>
        </div>
        
        <div className="room-join-modal-content">
          <div className="room-info">
            <div className="room-type-badge">{room.type}</div>
            <h4>{room.name}</h4>
            {room.description && (
              <p className="room-description">{room.description}</p>
            )}
            <div className="room-stats">
              <span>{room.members?.length || 0} membres</span>
              <span>Admin: {room.admin?.username}</span>
            </div>
          </div>
          
          <div className="room-join-modal-actions">
            <button className="room-join-btn-cancel" onClick={onCancel}>
              Annuler
            </button>
            <button className="room-join-btn-confirm" onClick={onConfirm}>
              Intégrer la salle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomJoinModal; 