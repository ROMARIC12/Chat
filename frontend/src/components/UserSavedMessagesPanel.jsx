import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UserSavedMessagesPanel.css';

const API_URL = import.meta.env.VITE_API_URL;

const UserSavedMessagesPanel = ({ userId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [savedMessages, setSavedMessages] = useState([]);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/chatroom/saved/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavedMessages(res.data);
      } catch (err) {
        setSavedMessages([]);
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchSaved();
  }, [userId]);

  // Handler pour retirer un message des favoris
  const handleUnsave = async (msgId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/chatroom/message/${msgId}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedMessages(prev => prev.filter(m => m._id !== msgId));
    } catch (err) {}
  };

  // Séparer messages privés et groupes
  const privateMsgs = savedMessages.filter(m => m.type !== 'group');
  const groupMsgs = savedMessages.filter(m => m.type === 'group');

  return (
    <div className="user-profile-panel saved-messages-panel">
      <div className="saved-header">
        <span className="saved-title">Messages gardés</span>
        <i className="fas fa-times saved-close" onClick={onClose}></i>
      </div>
      {loading ? (
        <div className="saved-loading">Chargement...</div>
      ) : (
        <div className="saved-content">
          <div className="saved-section">
            <div className="saved-section-title">Messages privés</div>
            {privateMsgs.length === 0 ? <div className="saved-empty">Aucun message gardé</div> : (
              privateMsgs.map(msg => (
                <div key={msg._id} className="saved-message private">
                  <div className="saved-link-row">
                    <span className="saved-link">{msg.from?.username || msg.from}</span>
                    <i className="fas fa-trash-alt saved-delete" title="Retirer des favoris" onClick={() => handleUnsave(msg._id)}></i>
                  </div>
                  <div className="saved-text">{msg.message}</div>
                  <div className="saved-timestamp">{msg.timestamp}</div>
                </div>
              ))
            )}
          </div>
          <div className="saved-section">
            <div className="saved-section-title">Messages de groupe</div>
            {groupMsgs.length === 0 ? <div className="saved-empty">Aucun message gardé</div> : (
              groupMsgs.map(msg => (
                <div key={msg._id} className="saved-message group">
                  <div className="saved-link-row">
                    <span className="saved-link">{msg.roomId || msg._id}</span>
                    <i className="fas fa-trash-alt saved-delete" title="Retirer des favoris" onClick={() => handleUnsave(msg._id)}></i>
                  </div>
                  <div className="saved-text">{msg.message}</div>
                  <div className="saved-timestamp">{msg.timestamp}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSavedMessagesPanel; 