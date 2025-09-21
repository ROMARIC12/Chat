import React from 'react';
import './UserCard.css';
import defaultAvatar from '../assets/images/default-avatar-icon-of-social-media-user-vector.jpg';

const API_URL = import.meta.env.VITE_API_URL;

const UserCard = ({ user, onClick, onBan, onUnban, onDelete, onPromote, currentAdminEmail }) => {
  // Statut : vert si online, rouge sinon
  const statusDot = (
    <span
      className="user-card-status-dot"
      style={{ background: user.status === 'online' ? '#4ade80' : '#dc2626' }}
      title={user.status === 'online' ? 'En ligne' : 'Hors ligne'}
    />
  );

  return (
    <div className="user-card-modern" onClick={onClick}>
      <div className="user-card-header">
        <div className="user-avatar-modern">
          <img src={user.avatar ? `${API_URL}/uploads/${user.avatar}` : defaultAvatar} alt={user.username} onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }} />
        </div>
        <div className="user-card-info">
          <div className="user-card-title-row">
            <span className="user-card-name">{user.username}</span>
            {user.isAdmin && <span className="user-card-badge">✔</span>}
            {statusDot}
          </div>
          <div className="user-card-role">{user.email}</div>
          <div className="user-card-status-row" style={{justifyContent:'flex-start', marginTop:10}}>
            <span className="user-card-status-dot-large" style={{background: user.status === 'online' ? '#4ade80' : '#dc2626'}} title={user.status === 'online' ? 'En ligne' : 'Hors ligne'}></span>
          </div>
        </div>
      </div>
      <div className="user-card-actions-row">
        {/* Actions selon l'état de l'utilisateur */}
        {user.isBanned ? (
          <button className="user-card-action" title="Débannir" onClick={e => { e.stopPropagation(); onUnban(user._id); }}>
            <i className="fas fa-unlock"></i>
          </button>
        ) : (
          <>
            <button className="user-card-action" title="Bannir" onClick={e => { e.stopPropagation(); onBan(user._id); }}>
              <i className="fas fa-ban"></i>
            </button>
            <button className="user-card-action" title="Bannir 24h" onClick={e => { e.stopPropagation(); onBan(user._id, 24); }}>
              <i className="fas fa-clock"></i>
            </button>
          </>
        )}
        <button className="user-card-action" title="Supprimer" onClick={e => { e.stopPropagation(); onDelete(user._id); }}>
          <i className="fas fa-trash"></i>
        </button>
        {user.email !== currentAdminEmail && (
          user.isAdmin ? (
            <button className="user-card-action" title="Retirer admin" style={{color:'#6366f1'}} onClick={e => { e.stopPropagation(); onPromote(user._id, false); }}>
              <i className="fas fa-user-shield"></i>
            </button>
          ) : (
            <button className="user-card-action" title="Promouvoir admin" style={{color:'#059669'}} onClick={e => { e.stopPropagation(); onPromote(user._id, true); }}>
              <i className="fas fa-user-plus"></i>
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default UserCard; 