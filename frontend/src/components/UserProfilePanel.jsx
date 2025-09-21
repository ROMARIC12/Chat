import React, { useState, useEffect } from 'react';
import { getAvatarUrl, handleAvatarError } from '../utils/avatarUtils';
import socket from '../services/socketClient';
import axios from 'axios';
import './UserProfilePanel.css';

const PAGE_SIZE = 3;
const API_URL = import.meta.env.VITE_API_URL;

const UserProfilePanel = ({ user, onClose, medias = [], files = [], links = [] }) => {
  const [mediaPage, setMediaPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const [linkPage, setLinkPage] = useState(1);
  const [currentUser, setCurrentUser] = useState(user);
  const [isBlocked, setIsBlocked] = useState({ iBlock: false, blockedMe: false });
  const [activeTab, setActiveTab] = useState('info');
  const currentUserId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const [modalImage, setModalImage] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => { setCurrentUser(user); }, [user]);

  useEffect(() => {
    const handleAvatarUpdate = ({ userId: updatedUserId, newAvatar }) => {
      if (updatedUserId === user._id) {
        setCurrentUser(prev => ({ ...prev, avatar: newAvatar }));
      }
    };
    socket.on('userAvatarUpdated', handleAvatarUpdate);
    return () => { socket.off('userAvatarUpdated', handleAvatarUpdate); };
  }, [user._id]);

  useEffect(() => {
    const handleUserBlocked = ({ blockerId, blockedId }) => {
      if (blockedId === user._id || blockerId === user._id) {
        const fetchBlockStatus = async () => {
          if (!user?._id || !currentUserId || user._id === currentUserId) return;
          try {
            const res = await axios.get(`${API_URL}/users/${user._id}/is-blocked`, { headers: { Authorization: `Bearer ${token}` } });
            setIsBlocked(res.data);
          } catch {
            setIsBlocked({ iBlock: false, blockedMe: false });
          }
        };
        fetchBlockStatus();
      }
    };
    socket.on('userBlocked', handleUserBlocked);
    return () => { socket.off('userBlocked', handleUserBlocked); };
  }, [user._id, currentUserId, token]);

  useEffect(() => {
    const fetchBlockStatus = async () => {
      if (!user?._id || !currentUserId || user._id === currentUserId) return;
      try {
        const res = await axios.get(`${API_URL}/users/${user._id}/is-blocked`, { headers: { Authorization: `Bearer ${token}` } });
        setIsBlocked(res.data);
      } catch {
        setIsBlocked({ iBlock: false, blockedMe: false });
      }
    };
    fetchBlockStatus();
  }, [user?._id, currentUserId]);

  // Charger toutes les vraies infos de l'utilisateur dès l'ouverture
  useEffect(() => {
    const fetchFullUser = async () => {
      if (!user?._id) return;
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/users/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(res.data);
      } catch (err) {
        setCurrentUser(user); // fallback
      }
    };
    fetchFullUser();
  }, [user?._id]);

  const handleBlockToggle = async () => {
    if (!user?._id || !currentUserId || user._id === currentUserId) return;
    try {
      if (!isBlocked.iBlock) {
        await axios.post(`${API_URL}/users/${user._id}/block`, {}, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API_URL}/users/${user._id}/unblock`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
      const res = await axios.get(`${API_URL}/users/${user._id}/is-blocked`, { headers: { Authorization: `Bearer ${token}` } });
      setIsBlocked(res.data);
    } catch {
      alert('Erreur lors du blocage/déblocage');
    }
  };

  const handleReport = async () => {
    if (!reportReason && !customReason) return;
    setReportLoading(true);
    try {
      await axios.post(`${API_URL}/users/report`, {
        reportedUserId: user._id,
        reason: reportReason === 'Autre' ? customReason : reportReason,
        reporter: localStorage.getItem('userId'),
        timestamp: new Date().toISOString()
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowReportModal(false);
      setReportReason('');
      setCustomReason('');
      alert('Signalement envoyé !');
    } catch (e) {
      alert('Erreur lors de l\'envoi du signalement');
    } finally {
      setReportLoading(false);
    }
  };

  const totalMediaPages = Math.max(1, Math.ceil(medias.length / PAGE_SIZE));
  const totalFilePages = Math.max(1, Math.ceil(files.length / PAGE_SIZE));
  const totalLinkPages = Math.max(1, Math.ceil(links.length / PAGE_SIZE));
  const pagedMedias = medias.slice((mediaPage - 1) * PAGE_SIZE, mediaPage * PAGE_SIZE);
  const pagedFiles = files.slice((filePage - 1) * PAGE_SIZE, filePage * PAGE_SIZE);
  const pagedLinks = links.slice((linkPage - 1) * PAGE_SIZE, linkPage * PAGE_SIZE);
  const totalMediaItems = medias.length + files.length + links.length;

  return (
    <div className="group-info-panel">
      <div className="group-info-header">
        <h3>Informations du contact</h3>
        <button className="close-btn" onClick={onClose}><i className="fas fa-times"></i></button>
      </div>
      <div className="group-info-tabs">
        <button className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
          <i className="fas fa-info-circle"></i> Informations
        </button>
        <button className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
          <i className="fas fa-images"></i> Médias ({totalMediaItems})
        </button>
      </div>
      <div className="group-info-content">
        {activeTab === 'info' ? (
          <>
            <div className="group-avatar" style={{ marginBottom: 18 }}>
              {(isBlocked.iBlock || isBlocked.blockedMe) ? (
                <i className="fas fa-user-slash" style={{ fontSize: 32, color: '#666666' }}></i>
              ) : (
                <img src={getAvatarUrl(currentUser?.avatar)} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} onError={handleAvatarError} />
              )}
            </div>
            <div className="group-details">
              <h4 className="group-name" style={{ marginBottom: 4 }}>{currentUser?.username || 'Utilisateur'}</h4>
              <div className="group-type" style={{ marginBottom: 10, color: currentUser?.status === 'online' ? '#28a745' : '#666666' }}>
                <i className="fas fa-circle" style={{ marginRight: 6 }}></i>
                {currentUser?.status === 'online' ? 'En ligne' : 'Hors ligne'}
              </div>
              <div className="user-info-fields">
                {currentUser?.email && (
                  <div className="user-info-field"><span className="user-info-icon"><i className="fas fa-envelope"></i></span><span className="user-info-label">Email :</span> <span className="user-info-value">{currentUser.email}</span></div>
                )}
                {currentUser?.genre && (
                  <div className="user-info-field"><span className="user-info-icon"><i className="fas fa-venus-mars"></i></span><span className="user-info-label">Genre :</span> <span className="user-info-value">{currentUser.genre}</span></div>
                )}
                {currentUser?.age && (
                  <div className="user-info-field"><span className="user-info-icon"><i className="fas fa-birthday-cake"></i></span><span className="user-info-label">Âge :</span> <span className="user-info-value">{currentUser.age} ans</span></div>
                )}
                {currentUser?.localisation && (
                  <div className="user-info-field"><span className="user-info-icon"><i className="fas fa-map-marker-alt"></i></span><span className="user-info-label">Ville :</span> <span className="user-info-value">{currentUser.localisation}</span></div>
                )}
                {currentUser?.hobby && (
                  <div className="user-info-field"><span className="user-info-icon"><i className="fas fa-star"></i></span><span className="user-info-label">Centre d'intérêt :</span> <span className="user-info-value">{currentUser.hobby}</span></div>
                )}
                {currentUser?.relationship && (
                  <div className="user-info-field"><span className="user-info-icon"><i className="fas fa-heart"></i></span><span className="user-info-label">Intentions de relation :</span> <span className="user-info-value">{currentUser.relationship}</span></div>
                )}
              </div>
              {user._id !== currentUserId && (
                <>
                  <button style={{ marginBottom: 10, background: isBlocked.iBlock ? '#6c757d' : '#dc3545', color: '#ffffff', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14, width: '100%' }} onClick={handleBlockToggle}>
                    {isBlocked.iBlock ? 'Débloquer' : 'Bloquer'} cet utilisateur
                  </button>
                  <button style={{ marginBottom: 18, background: '#fd7e14', color: '#ffffff', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14, width: '100%' }} onClick={() => setShowReportModal(true)}>
                    Signaler cet utilisateur
                  </button>
                </>
              )}
              {(isBlocked.iBlock || isBlocked.blockedMe) && (
                <div style={{ color: '#dc3545', fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>
                  {isBlocked.iBlock && !isBlocked.blockedMe && 'Vous avez bloqué cet utilisateur.'}
                  {isBlocked.blockedMe && !isBlocked.iBlock && 'Cet utilisateur vous a bloqué.'}
                  {isBlocked.iBlock && isBlocked.blockedMe && 'Blocage réciproque.'}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="media-content">
            <h5>Médias partagés</h5>
            {totalMediaItems > 0 ? (
              <div className="media-list">
                {pagedMedias.length > 0 && (
                  <div className="media-section">
                    <h6>Images & Vidéos ({medias.length})</h6>
                    <div className="media-grid">
                      {pagedMedias.map(media => (
                        <div key={media.id} className="media-item">
                          <div className="media-preview">
                            <img src={media.url} alt="media" style={{ cursor: 'pointer' }} onClick={() => setModalImage(media.url)} />
                          </div>
                          <div className="media-info">
                            <span className="media-type">Image</span>
                            <span className="media-date">Récent</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {medias.length > 3 && (
                      <div className="media-pagination">
                        <button className="pagination-btn" onClick={() => setMediaPage(p => Math.max(1, p - 1))} disabled={mediaPage === 1}>&lt;</button>
                        <span className="pagination-info">{mediaPage} / {totalMediaPages}</span>
                        <button className="pagination-btn" onClick={() => setMediaPage(p => Math.min(totalMediaPages, p + 1))} disabled={mediaPage === totalMediaPages}>&gt;</button>
                      </div>
                    )}
                  </div>
                )}
                {pagedLinks.length > 0 && (
                  <div className="media-section">
                    <h6>Liens ({links.length})</h6>
                    {pagedLinks.map(link => (
                      <div key={link.id} className="media-item">
                        <div className="link-preview">
                          <i className="fas fa-link"></i>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">{link.preview}</a>
                        </div>
                        <div className="media-info">
                          <span className="media-type">Lien</span>
                          <span className="media-date">Récent</span>
                        </div>
                      </div>
                    ))}
                    {links.length > 3 && (
                      <div className="media-pagination">
                        <button className="pagination-btn" onClick={() => setLinkPage(p => Math.max(1, p - 1))} disabled={linkPage === 1}>&lt;</button>
                        <span className="pagination-info">{linkPage} / {totalLinkPages}</span>
                        <button className="pagination-btn" onClick={() => setLinkPage(p => Math.min(totalLinkPages, p + 1))} disabled={linkPage === totalLinkPages}>&gt;</button>
                      </div>
                    )}
                  </div>
                )}
                {pagedFiles.length > 0 && (
                  <div className="media-section">
                    <h6>Fichiers ({files.length})</h6>
                    {pagedFiles.map(file => (
                      <div key={file.id} className="media-item">
                        <div className="file-preview">
                          <i className="fas fa-file"></i>
                          <span>{file.name}</span>
                        </div>
                        <div className="media-info">
                          <span className="media-type">Fichier</span>
                          <span className="media-date">{file.date || 'Date inconnue'}</span>
                        </div>
                      </div>
                    ))}
                    {files.length > 3 && (
                      <div className="media-pagination">
                        <button className="pagination-btn" onClick={() => setFilePage(p => Math.max(1, p - 1))} disabled={filePage === 1}>&lt;</button>
                        <span className="pagination-info">{filePage} / {totalFilePages}</span>
                        <button className="pagination-btn" onClick={() => setFilePage(p => Math.min(totalFilePages, p + 1))} disabled={filePage === totalFilePages}>&gt;</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-media">
                <i className="fas fa-images"></i>
                <p>Aucun média partagé</p>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Modale d'agrandissement d'image */}
      {modalImage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
          onClick={() => setModalImage(null)}
        >
          <img
            src={modalImage}
            alt="Agrandissement"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 0 24px #000' }}
          />
          <span
            style={{
              position: 'fixed',
              top: 24,
              right: 36,
              fontSize: 36,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              zIndex: 10000
            }}
            onClick={e => { e.stopPropagation(); setModalImage(null); }}
          >
            ×
          </span>
        </div>
      )}
      {showReportModal && (
        <div className="report-modal-overlay">
          <div className="report-modal">
            <h4>Signaler un utilisateur</h4>
            <div style={{marginBottom:12}}>
              <label>Motif du signalement :</label>
              <select value={reportReason} onChange={e => setReportReason(e.target.value)} style={{width:'100%',marginTop:6,padding:8,borderRadius:6}}>
                <option value="">-- Choisir un motif --</option>
                <option value="Spam">Spam</option>
                <option value="Harcèlement">Harcèlement</option>
                <option value="Fake">Faux profil</option>
                <option value="Contenu inapproprié">Contenu inapproprié</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            {reportReason === 'Autre' && (
              <textarea value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Décrire le motif..." style={{width:'100%',minHeight:60,padding:8,borderRadius:6,marginBottom:10}} />
            )}
            <div style={{display:'flex',gap:10,marginTop:10}}>
              <button onClick={handleReport} disabled={reportLoading || (!reportReason && !customReason)} style={{background:'#e53935',color:'#fff',padding:'10px 18px',border:'none',borderRadius:6,fontWeight:600,cursor:'pointer'}}>
                {reportLoading ? 'Envoi...' : 'Envoyer'}
              </button>
              <button onClick={()=>setShowReportModal(false)} style={{background:'#444',color:'#fff',padding:'10px 18px',border:'none',borderRadius:6,fontWeight:600,cursor:'pointer'}}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePanel; 