import React from 'react';
import './UserCard.css';

const API_URL = import.meta.env.VITE_API_URL;

const UserDetailModal = ({ user, onClose }) => {
  if (!user) return null;
  const defaultAvatar = '/default-avatar.png';
  return (
    <div className="user-detail-modal-overlay">
      <div className="user-detail-modal">
        <button className="user-detail-close" onClick={onClose}>×</button>
        <div className="user-detail-header">
          <div className="user-avatar-modern" style={{width:90, height:90}}>
            <img src={user.avatar ? `${API_URL}/uploads/${user.avatar}` : defaultAvatar} alt={user.username} onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }} />
          </div>
          <div className="user-detail-info">
            <div className="user-card-title-row">
              <span className="user-card-name" style={{fontSize:'1.3em'}}>{user.username}</span>
              {user.isAdmin && <span className="user-card-badge">✔</span>}
            </div>
            <div className="user-card-role">{user.email}</div>
            <div className="user-card-status-row">
              <span className="user-card-status-label" style={{color: user.status === 'online' ? '#4ade80' : '#dc2626', fontWeight: 600}}>
                {user.status === 'online' ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
            <div style={{marginTop:10, color:'#b0b3b8', fontSize:'1em'}}>
              Statut : <b style={{color:user.status==='online'?'#4ade80':'#f87171'}}>{user.status || 'offline'}</b>
            </div>
          </div>
        </div>
        <div className="user-detail-body">
          {user.age !== undefined && <div><b>Age :</b> {user.age}</div>}
          {user.genre && <div><b>Genre :</b> {user.genre}</div>}
          {user.hobby && <div><b>Hobby :</b> {user.hobby}</div>}
          {user.localisation && <div><b>Localisation :</b> {user.localisation}</div>}
          {user.relationship && <div><b>Relationship :</b> {user.relationship}</div>}
          {user.createdAt && <div><b>Créé le :</b> {new Date(user.createdAt).toLocaleString()}</div>}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal; 