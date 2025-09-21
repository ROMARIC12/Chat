import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './GroupInfoPanel.css';

const API_URL = import.meta.env.VITE_API_URL;

const GroupInfoPanel = ({ room, onClose, onLeaveRoom }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' ou 'media'
  const [mediaItems, setMediaItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const itemsPerPage = 3;

  // Charger les médias de la salle
  useEffect(() => {
    if (activeTab === 'media' && room._id) {
      loadRoomMedia();
    }
  }, [activeTab, room._id]);

  const loadRoomMedia = async () => {
    setIsLoadingMedia(true);
    try {
      const response = await axios.get(`${API_URL}/chatroom/group-history/${room._id}`);
      const messages = response.data;
      
      // Filtrer les messages avec médias, fichiers et liens
      const mediaMessages = messages.filter(msg => 
        msg.type === 'media' || 
        msg.mediaType || 
        (msg.text && (msg.text.includes('http://') || msg.text.includes('https://')))
      ).map(msg => ({
        ...msg,
        type: msg.type === 'media' ? 'media' : 
              (msg.text && (msg.text.includes('http://') || msg.text.includes('https://'))) ? 'link' : 'file'
      }));
      
      setMediaItems(mediaMessages);
    } catch (error) {
      console.error('Erreur lors du chargement des médias:', error);
      setMediaItems([]);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      // Mettre à jour immédiatement l'interface avant l'appel API
      onLeaveRoom && onLeaveRoom(room._id);
      
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/rooms/${room._id}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowLeavePopup(false);
      onClose();
    } catch (error) {
      console.error('Erreur lors du départ de la salle:', error);
      alert(error.response?.data?.message || 'Erreur lors du départ de la salle');
      // En cas d'erreur, on pourrait remettre la salle dans la liste
    } finally {
      setIsLeaving(false);
    }
  };

  const getCurrentPageItems = () => {
    const startIndex = currentPage * itemsPerPage;
    return mediaItems.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(mediaItems.length / itemsPerPage);

  const renderMediaItem = (item, index) => {
    if (item.type === 'media' || item.mediaType) {
      const isImage = item.mediaType === 'image';
      const fileUrl = `${API_URL}/uploads/${item.text || item.message}`;
      
      return (
        <div key={index} className="media-item">
          <div className="media-preview">
            {isImage ? (
              <img src={fileUrl} alt="media" />
            ) : (
              <video src={fileUrl} controls />
            )}
          </div>
          <div className="media-info">
            <span className="media-type">{isImage ? 'Image' : 'Vidéo'}</span>
            <span className="media-date">{item.timestamp}</span>
          </div>
        </div>
      );
    } else if (item.type === 'link') {
      const url = item.text || item.message;
      return (
        <div key={index} className="media-item">
          <div className="link-preview">
            <i className="fas fa-link"></i>
            <a href={url} target="_blank" rel="noopener noreferrer">
              {url.length > 30 ? url.substring(0, 30) + '...' : url}
            </a>
          </div>
          <div className="media-info">
            <span className="media-type">Lien</span>
            <span className="media-date">{item.timestamp}</span>
          </div>
        </div>
      );
    } else {
      return (
        <div key={index} className="media-item">
          <div className="file-preview">
            <i className="fas fa-file"></i>
            <span>{item.text || item.message}</span>
          </div>
          <div className="media-info">
            <span className="media-type">Fichier</span>
            <span className="media-date">{item.timestamp}</span>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <div className="group-info-panel">
        <div className="group-info-header">
          <h3>Informations du groupe</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Onglets */}
        <div className="group-info-tabs">
          <button 
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <i className="fas fa-info-circle"></i>
            Informations
          </button>
          <button 
            className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <i className="fas fa-images"></i>
            Médias ({mediaItems.length})
          </button>
        </div>
        
        <div className="group-info-content">
          {activeTab === 'info' ? (
            <>
              <div className="group-avatar">
                <i className="fas fa-users"></i>
              </div>
              
              <div className="group-details">
                <h4 className="group-name">{room.name}</h4>
                <p className="group-type">{room.type}</p>
                {room.description && (
                  <p className="group-description">{room.description}</p>
                )}
              </div>
              
              <div className="group-stats">
                <div className="stat-item">
                  <span className="stat-label">Membres</span>
                  <span className="stat-value">{room.members?.length || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Créé le</span>
                  <span className="stat-value">
                    {new Date(room.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
              
              <div className="group-members">
                <h5>Membres du groupe</h5>
                <div className="members-list">
                  {room.members?.map((member) => (
                    <div key={member._id} className="member-item">
                      <div className="member-avatar">
                        {member.avatar ? (
                          <img 
                            src={`${API_URL}/uploads/${member.avatar}`} 
                            alt={member.username}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="member-avatar-fallback" style={{ display: member.avatar ? 'none' : 'flex' }}>
                          {member.username?.charAt(0)?.toUpperCase()}
                        </div>
                      </div>
                      <span className="member-name">{member.username}</span>
                      {room.admin === member._id && (
                        <span className="admin-badge">Admin</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="group-actions">
                <button 
                  className="leave-room-btn" 
                  onClick={() => setShowLeavePopup(true)}
                  disabled={isLeaving}
                >
                  Quitter la salle
                </button>
              </div>
            </>
          ) : (
            <div className="media-content">
              <h5>Médias partagés</h5>
              
              {isLoadingMedia ? (
                <div className="loading-media">
                  <i className="fas fa-spinner fa-spin"></i>
                  Chargement des médias...
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="no-media">
                  <i className="fas fa-images"></i>
                  <p>Aucun média partagé dans cette salle</p>
                </div>
              ) : (
                <>
                  <div className="media-list">
                    {getCurrentPageItems().map((item, index) => 
                      renderMediaItem(item, currentPage * itemsPerPage + index)
                    )}
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="media-pagination">
                      <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={currentPage === 0}
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <span className="pagination-info">
                        {currentPage + 1} / {totalPages}
                      </span>
                      <button 
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={currentPage === totalPages - 1}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Popup de confirmation pour quitter la salle */}
      {showLeavePopup && (
        <div className="leave-popup-overlay">
          <div className="leave-popup">
            <div className="leave-popup-header">
              <h4>Quitter la salle</h4>
              <button 
                className="close-btn" 
                onClick={() => setShowLeavePopup(false)}
                disabled={isLeaving}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="leave-popup-content">
              <div className="leave-popup-icon">
                <i className="fas fa-sign-out-alt"></i>
              </div>
              <p>Êtes-vous sûr de vouloir quitter la salle <strong>"{room.name}"</strong> ?</p>
              <p className="leave-popup-warning">
                Vous ne pourrez plus voir les messages de cette salle tant que vous ne l'aurez pas réintégrée.
              </p>
            </div>
            <div className="leave-popup-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowLeavePopup(false)}
                disabled={isLeaving}
              >
                Annuler
              </button>
              <button 
                className="confirm-leave-btn" 
                onClick={handleLeaveRoom}
                disabled={isLeaving}
              >
                {isLeaving ? 'Quittant...' : 'Quitter la salle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupInfoPanel; 