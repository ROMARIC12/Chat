import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../services/socketClient';
import './AdminDashboard.css';
import UserCard from '../components/UserCard';
import UserDetailModal from '../components/UserDetailModal';
import defaultAvatar from '../assets/images/default-avatar-icon-of-social-media-user-vector.jpg';

const ADMIN_EMAIL = "issawebdev@gmail.com"; 
const API_URL = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomStats, setRoomStats] = useState({});
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    description: '',
    type: 'Amis'
  });
  const [editRoom, setEditRoom] = useState(null);
  const [editRoomData, setEditRoomData] = useState({ name: '', description: '' });
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserFull, setSelectedUserFull] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (email !== ADMIN_EMAIL) {
      navigate('/');
      return;
    }

    loadData();
    setupSocketListeners();
  }, [navigate]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [usersRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/users/all`, { headers }),
        axios.get(`${API_URL}/rooms/all`, { headers })
      ]);

      setUsers(usersRes.data);
      setRooms(roomsRes.data);
      setLoading(false);
      setError(null);
    } catch (error) {
      let msg = 'Erreur chargement données';
      if (error.response && error.response.data && error.response.data.message) {
        msg = error.response.data.message;
      } else if (error.message) {
        msg = error.message;
      }
      setError(msg);
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socket.on('roomStatsUpdate', (stats) => {
      setRoomStats(stats);
    });

    socket.on('userReported', (report) => {
      setReports(prev => [...prev, report]);
    });

    return () => {
      socket.off('roomStatsUpdate');
      socket.off('userReported');
    };
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(prev => prev.filter(user => user._id !== userId));
      alert('Utilisateur supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error.response?.data || error.message);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const banUser = async (userId, duration = null) => {
    const durationText = duration ? ` pour ${duration}h` : '';
    if (!window.confirm(`Êtes-vous sûr de vouloir bannir cet utilisateur${durationText} ?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/${userId}/ban`, {
        duration: duration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, isBanned: true, banExpiresAt: response.data.banExpiresAt }
          : user
      ));
      
      const successMsg = duration 
        ? `Utilisateur banni pour ${duration}h avec succès`
        : 'Utilisateur banni définitivement avec succès';
      alert(successMsg);
    } catch (error) {
      console.error('Erreur bannissement utilisateur:', error.response?.data || error.message);
      alert('Erreur lors du bannissement de l\'utilisateur');
    }
  };

  const unbanUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir débannir cet utilisateur ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/${userId}/unban`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, isBanned: false, banExpiresAt: null }
          : user
      ));
      
      alert('Utilisateur débanni avec succès');
    } catch (error) {
      console.error('Erreur débannissement utilisateur:', error.response?.data || error.message);
      alert('Erreur lors du débannissement de l\'utilisateur');
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRooms(prev => prev.filter(room => room._id !== roomId));
      alert('Salle supprimée avec succès');
    } catch (error) {
      console.error('Erreur suppression salle:', error.response?.data || error.message);
      alert('Erreur lors de la suppression de la salle');
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    if (!newRoomData.name.trim()) {
      alert('Le nom de la salle est requis');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/rooms`, newRoomData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRooms(prev => [...prev, response.data]);
      setNewRoomData({ name: '', description: '', type: 'Amis' });
      setShowCreateRoom(false);
      alert('Salle créée avec succès');
    } catch (error) {
      console.error('Erreur création salle:', error.response?.data || error.message);
      alert('Erreur lors de la création de la salle');
    }
  };

  const updateRoom = async (roomId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/rooms/${roomId}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRooms(prev => prev.map(room => 
        room._id === roomId ? { ...room, ...updatedData } : room
      ));
      
      setEditRoom(null);
      alert('Salle mise à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour salle:', error.response?.data || error.message);
      alert('Erreur lors de la mise à jour de la salle');
    }
  };

  const dismissReport = (reportId) => {
    setReports(prev => prev.filter(report => report._id !== reportId));
  };

  const handleEditRoom = (room) => {
    setEditRoom(room);
    setEditRoomData({ name: room.name, description: room.description });
  };

  const handleEditRoomChange = (e) => {
    setEditRoomData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEditRoomSubmit = async (e) => {
    e.preventDefault();
    if (!editRoomData.name.trim()) {
      alert('Le nom de la salle est requis');
      return;
    }
    await updateRoom(editRoom._id, editRoomData);
  };

  const handlePromoteAdmin = async () => {
    if (!selectedNewAdmin) {
      alert('Veuillez sélectionner un utilisateur');
      return;
    }

    setPromoteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/${selectedNewAdmin}/promote`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(prev => prev.map(user => 
        user._id === selectedNewAdmin 
          ? { ...user, isAdmin: true }
          : user
      ));
      
      setSelectedNewAdmin('');
      setPromoteLoading(false);
      alert('Administrateur promu avec succès');
    } catch (error) {
      console.error('Erreur promotion admin:', error.response?.data || error.message);
      alert('Erreur lors de la promotion de l\'administrateur');
      setPromoteLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    navigate('/login');
  };

  const handleSetAdmin = async (userId, isAdmin) => {
    const action = isAdmin ? 'promouvoir admin' : 'retirer admin';
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/users/${userId}/admin`, {
        isAdmin: isAdmin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(prev => prev.map(user => 
        user._id === userId 
          ? { ...user, isAdmin: isAdmin }
          : user
      ));
      
      const successMsg = isAdmin ? 'Utilisateur promu admin avec succès' : 'Admin retiré avec succès';
      alert(successMsg);
    } catch (error) {
      console.error('Erreur changement admin:', error.response?.data || error.message);
      alert('Erreur lors du changement de statut admin');
    }
  };

  const handleUserCardClick = async (user) => {
    setSelectedUser(user);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUserFull(response.data);
    } catch (error) {
      console.error('Erreur récupération détails utilisateur:', error);
      setSelectedUserFull(user);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Erreur récupération signalements:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/users/online`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOnlineUsers(response.data);
      } catch (error) {
        console.error('Erreur récupération utilisateurs en ligne:', error);
      }
    };

    fetchOnlineUsers();
    const interval = setInterval(fetchOnlineUsers, 30000); // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
            <div>Chargement du dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-message" style={{ 
          color: '#e53e3e', 
          background: 'rgba(254, 242, 242, 0.9)', 
          padding: '2rem', 
          borderRadius: '1rem', 
          margin: '2rem', 
          fontWeight: 'bold',
          textAlign: 'center',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(229, 62, 62, 0.3)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <div>Erreur : {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🚀 Dashboard Administrateur</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="admin-stats">
            <div className="stat-item">
              <span className="stat-number">👥 {users.length}</span>
              <span className="stat-label">Utilisateurs</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">🏠 {rooms.length}</span>
              <span className="stat-label">Salles</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">🚨 {reports.length}</span>
              <span className="stat-label">Signalements</span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={{
              marginLeft: 32, 
              padding: '12px 24px', 
              background: 'linear-gradient(135deg, #e53e3e, #c53030)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '0.75rem', 
              fontWeight: '600', 
              cursor: 'pointer', 
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(229, 62, 62, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 25px rgba(229, 62, 62, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(229, 62, 62, 0.4)';
            }}
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Utilisateurs
        </button>
        <button 
          className={`tab-button ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          🏠 Salles
        </button>
        <button 
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          🚨 Signalements
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' && (
          <div className="users-section">
            <h2>👥 Gestion des Utilisateurs</h2>
            <div className="users-grid">
              {users.map(user => (
                <UserCard
                  key={user._id}
                  user={user}
                  onClick={() => handleUserCardClick(user)}
                  onBan={banUser}
                  onUnban={unbanUser}
                  onDelete={deleteUser}
                  onPromote={handleSetAdmin}
                  currentAdminEmail={localStorage.getItem('email')}
                />
              ))}
            </div>
          </div>
        )}

        {selectedUserFull && (
          <UserDetailModal
            user={selectedUserFull}
            onClose={() => { setSelectedUser(null); setSelectedUserFull(null); }}
            onBan={banUser}
            onUnban={unbanUser}
            onDelete={deleteUser}
            onPromote={handleSetAdmin}
            currentAdminEmail={localStorage.getItem('email')}
          />
        )}

        {activeTab === 'rooms' && (
          <div className="rooms-section">
            <div className="rooms-header">
              <h2>🏠 Gestion des Salles</h2>
              <button 
                className="create-room-btn"
                onClick={() => setShowCreateRoom(true)}
              >
                ➕ Créer une Salle
              </button>
            </div>

            {showCreateRoom && (
              <div className="create-room-modal">
                <div className="modal-content">
                  <h3>Créer une Nouvelle Salle</h3>
                  <form onSubmit={createRoom}>
                    <div className="form-group">
                      <label>Nom de la salle</label>
                      <input
                        type="text"
                        value={newRoomData.name}
                        onChange={(e) => setNewRoomData({...newRoomData, name: e.target.value})}
                        placeholder="Nom de la salle"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        value={newRoomData.description}
                        onChange={(e) => setNewRoomData({...newRoomData, description: e.target.value})}
                        placeholder="Description de la salle"
                      />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={newRoomData.type}
                        onChange={(e) => setNewRoomData({...newRoomData, type: e.target.value})}
                      >
                        <option value="Amis">Amis</option>
                        <option value="Rencontres">Rencontres</option>
                        <option value="Connaissances">Connaissances</option>
                        <option value="Mariage">Mariage</option>
                      </select>
                    </div>
                    <div className="modal-actions">
                      <button type="submit" className="submit-btn">Créer</button>
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => setShowCreateRoom(false)}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal d'édition de salle */}
            {editRoom && (
              <div className="create-room-modal">
                <div className="modal-content">
                  <h3>Modifier la Salle</h3>
                  <form onSubmit={handleEditRoomSubmit}>
                    <div className="form-group">
                      <label>Nom de la salle</label>
                      <input
                        type="text"
                        name="name"
                        value={editRoomData.name}
                        onChange={handleEditRoomChange}
                        placeholder="Nom de la salle"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={editRoomData.description}
                        onChange={handleEditRoomChange}
                        placeholder="Description de la salle"
                      />
                    </div>
                    {/* Liste des membres avec indication admin mais sans promotion */}
                    <div className="form-group">
                      <label>Membres de la salle</label>
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {editRoom.members && editRoom.members.map(m => (
                          <li key={m._id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ flex: 1 }}>{m.username} {editRoom.admin && m._id === editRoom.admin._id && <span style={{ color: '#059669', fontWeight: 'bold', marginLeft: 8 }}>(Admin)</span>}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="modal-actions">
                      <button type="submit" className="submit-btn">Enregistrer</button>
                      <button 
                        type="button" 
                        className="cancel-btn"
                        onClick={() => setEditRoom(null)}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="rooms-grid">
              {rooms.map(room => {
                const onlineCount = room.members ? room.members.filter(m => onlineUsers.some(u => u._id === (m._id || m))).length : 0;
                return (
                  <div key={room._id} className="room-card">
                    {/* Avatars des membres qui se chevauchent */}
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, marginTop: -8 }}>
                      {room.members && room.members.slice(0, 5).map((m, idx) => (
                        <img
                          key={m._id || m}
                          src={m.avatar ? `${API_URL}uploads/${m.avatar}` : defaultAvatar}
                          alt={m.username || ''}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #fff',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                            marginLeft: idx === 0 ? 0 : -12,
                            zIndex: 10 - idx
                          }}
                          onError={e => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                        />
                      ))}
                      {room.members && room.members.length > 5 && (
                        <span style={{
                          marginLeft: 6,
                          fontSize: 14,
                          background: '#eee',
                          borderRadius: '50%',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #fff',
                          fontWeight: 'bold',
                          color: '#333',
                          zIndex: 0
                        }}>+{room.members.length - 5}</span>
                      )}
                    </div>
                    <div className="room-info">
                      <h3>{room.name}</h3>
                      <p>{room.description}</p>
                      <div className="room-stats">
                        <span className="room-type">{room.type}</span>
                        <span className="room-members">
                          {onlineCount} en ligne / {room.members?.length || 0} membres
                        </span>
                      </div>
                    </div>
                    <div className="room-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleEditRoom(room)}
                      >
                        Modifier
                      </button>
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => deleteRoom(room._id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <h2>Signalements</h2>
            {reports.length === 0 ? (
              <p className="no-reports">Aucun signalement en attente</p>
            ) : (
              <div className="reports-list">
                {reports.map(report => (
                  <div key={report._id} className="report-card">
                    <div className="report-info">
                      <h4>Signalement contre {report.reportedUserId?.username || report.reportedUserId?.email || report.reportedUserId || 'Utilisateur inconnu'}</h4>
                      <p><strong>Par :</strong> {report.reporter?.username || report.reporter?.email || report.reporter || 'Inconnu'}</p>
                      <p><strong>Raison :</strong> {report.reason}</p>
                      <p><strong>Date :</strong> {new Date(report.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="report-actions">
                      <button 
                        className="action-btn ban-btn"
                        onClick={() => banUser(report.reportedUserId?._id)}
                      >
                        Bannir
                      </button>
                      <button 
                        className="action-btn dismiss-btn"
                        onClick={() => dismissReport(report._id)}
                      >
                        Ignorer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;