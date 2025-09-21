import React, { useEffect, useRef, useState } from 'react';
import './GroupChatWindow.css';
import socket from '../services/socketClient';
import { getAvatarUrl, handleAvatarError } from '../utils/avatarUtils';
import GroupInfoPanel from './GroupInfoPanel';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const GroupChatWindow = ({ room, onClose, onLeaveRoom }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = localStorage.getItem('userId');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef();
  const popularEmojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙌','👍','👋','🤷‍♀️',
    '🙂','🙃','😉','😌','😍','🥰','😘','👏','😙','😚','💑','👫','👌','🤦‍♀️',
    '😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🍔','🍗','🙏','🧏‍♀️',
    '🥳','😏','😒','😞','😔','😟','💔','💖','❤','🙁', '☹️','😣','📙','🤦‍♂️',
    '🤦‍♂️','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🌧','🌤','🎁','🧏‍♂️',
    '🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤐','✝','⚽','🤷‍♂️',
    '🤔','🤭','🤫','🤥','🧠','😐','😑','😯','😦','😧','🌈','🌊','🌾','🍏',
    '😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🕒','❌','🍉','🏄‍♂️',
    '🤮','🤧','😷','🤒','🤕','🤑','🤠','💩','👻','💀','🎉','📞','💡','🚗',
    '☠️','🦾','👀','🤖','😺','😸','😹','😻','😼','😽','🌬','🚀','✈','©','🏳'
  ];
  const [modalImage, setModalImage] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msg: null });
  const messageRefs = useRef({});
  const contextMenuRef = useRef();
  const [hoveredMenuIdx, setHoveredMenuIdx] = useState(null);

  // Rejoindre la room socket.io
  useEffect(() => {
    if (room && room._id) {
      socket.emit('joinRoom', room._id);
    }
    return () => {
      if (room && room._id) {
        socket.emit('leaveRoom', room._id);
      }
    };
  }, [room?._id]);

  // Charger l'historique des messages du groupe à chaque ouverture
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setHistoryLoaded(false);
        const res = await fetch(`${API_URL}/chatroom/group-history/${room._id}`);
        if (!res.ok) {
          throw new Error('Erreur lors du chargement de l\'historique');
        }
        const data = await res.json();
        console.log('📚 GroupChatWindow - Historique chargé:', data.length, 'messages');
        setMessages(data.map(msg => ({ ...msg, _id: msg._id })));
        setHistoryLoaded(true);
      } catch (err) {
        console.error('❌ GroupChatWindow - Erreur chargement historique:', err);
        setMessages([]);
        setHistoryLoaded(true);
      }
    };
    if (room && room._id) {
      fetchHistory();
    }
  }, [room?._id]);

  // Réception des messages en temps réel (évite les doublons)
  useEffect(() => {
    const handleReceiveGroupMessage = (msg) => {
      console.log('📨 GroupChatWindow - Message reçu:', msg);
      // Si le message existe déjà (même timestamp et from), on ne l'ajoute pas
      if (!messages.some(m => m.timestamp === msg.timestamp && m.from === msg.from && (m.text === msg.text || m.message === msg.text))) {
        setMessages(prev => [...prev, msg]);
      }
    };
    socket.on('receiveGroupMessage', handleReceiveGroupMessage);
    return () => {
      socket.off('receiveGroupMessage', handleReceiveGroupMessage);
    };
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Vérifier si l'utilisateur est encore membre de la salle
    const isStillMember = room.members?.some(member => 
      (member._id || member) === currentUserId
    );
    
    if (!isStillMember) {
      alert('Vous n\'êtes plus membre de cette salle. Veuillez la fermer.');
      onClose();
      return;
    }
    
    const msg = {
      roomId: room._id,
      from: currentUserId,
      text: message,
      timestamp: new Date().toLocaleTimeString(),
    };
    socket.emit('sendGroupMessage', msg);
    setMessage('');
  };

  // Ajoute une fonction utilitaire pour trouver le nom d'un membre (compatibilité string/_id)
  function getUserName(userId) {
    if (!room.members) return userId;
    const member = room.members.find(m => (m._id || m) === userId);
    return member?.username || userId;
  }

  // Fonction pour générer une couleur à partir d'un userId, en évitant le bleu (hue 200-260)
  function getUserColor(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    let hue = Math.abs(hash % 360);
    // Évite le bleu (200-260)
    if (hue >= 200 && hue <= 260) hue = (hue + 70) % 360;
    return `hsl(${hue}, 70%, 55%)`;
  }

  // Emoji picker
  const handleEmojiClick = () => setShowEmojiPicker(!showEmojiPicker);
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker') && !event.target.closest('.emoji-icon')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Gestion de l'upload de fichier (image/vidéo)
  const handleGalleryClick = () => {
    fileInputRef.current.click();
  };
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier si l'utilisateur est encore membre de la salle
    const isStillMember = room.members?.some(member => 
      (member._id || member) === currentUserId
    );
    
    if (!isStillMember) {
      alert('Vous n\'êtes plus membre de cette salle. Veuillez la fermer.');
      onClose();
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('from', currentUserId);
    formData.append('to', room._id);
    formData.append('timestamp', new Date().toLocaleTimeString());
    formData.append('type', 'group');
    try {
      const res = await fetch(`${API_URL}/chatroom/upload`, {
        method: 'POST',
        body: formData
      });
      const msg = await res.json();
      socket.emit('sendGroupMessage', {
        roomId: room._id,
        from: msg.from,
        text: msg.message,
        timestamp: msg.timestamp,
        type: 'media',
        mediaType: msg.mediaType
      });
    } catch (err) {
      alert("Erreur lors de l'upload du fichier");
    }
  };

  const handleLeaveRoom = (roomId) => {
    onLeaveRoom && onLeaveRoom(roomId);
    onClose();
  };

  // Handler suppression message (optimistic + socket)
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    setMessages(prev => prev.filter(m => m._id !== messageToDelete._id));
    setShowDeletePopup(false);
    setMessageToDelete(null);
    setContextMenu({ visible: false, x: 0, y: 0, msg: null });
    socket.emit('deleteGroupMessage', { messageId: messageToDelete._id, roomId: room._id });
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/chatroom/message/${messageToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {}
  };

  // Handler favoris (optimistic)
  const handleToggleSave = async (msg) => {
    // Optimistic update
    const alreadySaved = msg.savedBy && msg.savedBy.includes(currentUserId);
    setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, savedBy: alreadySaved ? (m.savedBy||[]).filter(id => id !== currentUserId) : [...(m.savedBy||[]), currentUserId] } : m));
    setContextMenu({ visible: false, x: 0, y: 0, msg: null });
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/chatroom/message/${msg._id}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      // Optionnel : rollback si erreur
    }
  };

  // Réception suppression temps réel
  useEffect(() => {
    const handleGroupMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };
    socket.on('groupMessageDeleted', handleGroupMessageDeleted);
    return () => {
      socket.off('groupMessageDeleted', handleGroupMessageDeleted);
    };
  }, []);

  // Handler pour ouvrir le menu contextuel avec positionnement intelligent
  const openContextMenu = (msg, idx) => {
    const ref = messageRefs.current[msg._id || idx];
    if (ref) {
      const rect = ref.getBoundingClientRect();
      const menuHeight = 90; // hauteur estimée du menu
      const menuWidth = 200;
      let x = rect.right + 8;
      let y = rect.top;
      // Si le menu sort de l'écran à droite, le coller à droite de la fenêtre
      if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 12;
      // Si le menu sort en bas, l'afficher au-dessus du message
      if (y + menuHeight > window.innerHeight) y = rect.bottom - menuHeight;
      setContextMenu({ visible: true, x, y, msg });
    }
  };

  // Fermer le menu contextuel au clic ailleurs
  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu({ visible: false, x: 0, y: 0, msg: null });
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [contextMenu.visible]);

  return (
    <div className="chat-window">
      <header className="group-chat-header">
        <div className="group-info" onClick={() => setShowGroupInfo(true)}>
          <div className="group-avatar">
            {room.avatar ? (
              <img
                src={`${API_URL}/uploads/${room.avatar}`}
                alt="Group Avatar"
                onError={handleAvatarError}
              />
            ) : (
              room.name?.charAt(0)?.toUpperCase() || 'G'
            )}
          </div>
          <div className="group-details">
            <div className="group-name">{room.name}</div>
            <div className="group-members">
              <span className="group-members-count">{room.members?.length || 0}</span>
              membres
            </div>
          </div>
        </div>
        <div className="group-action-icons">
          <i className="fas fa-times" onClick={onClose}></i>
        </div>
      </header>
      <main className="group-chat-messages">
        {!historyLoaded ? (
          <div className="loading-message">Chargement des messages...</div>
        ) : messages.length === 0 ? (
          <div className="empty-message">Aucun message dans cette salle</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg._id || idx}
              className={`group-message-bubble ${msg.from === currentUserId ? 'from-me' : 'from-them'}`}
              ref={el => messageRefs.current[msg._id || idx] = el}
            >
              <div className="group-message-header">
                <span className="group-message-sender">
                  {getUserName(msg.from)}
                </span>
                <span className="group-message-time">{msg.timestamp}</span>
              </div>
              <div className="group-message-content">
                {msg.type === 'media' ? (
                  <div className="group-message-media">
                    {msg.mediaType === 'image' ? (
                      <img
                        src={`${API_URL.replace("/api", "")}/uploads/${msg.text}`}
                        alt="media"
                        onClick={() => setModalImage(`${API_URL.replace("/api", "")}/uploads/${msg.text}`)}
                      />
                    ) : (
                      <video controls src={`${API_URL.replace("/api", "")}/uploads/${msg.text}`} />
                    )}
                  </div>
                ) : (
                  <span>{msg.text || msg.message}</span>
                )}
              </div>
              {/* Icône options */}
              <div className="message-options">
                <i
                  className="fas fa-ellipsis-v"
                  title="Options"
                  onClick={e => {
                    e.stopPropagation();
                    openContextMenu(msg, idx);
                  }}
                  onMouseEnter={() => setHoveredMenuIdx(idx)}
                  onMouseLeave={() => setHoveredMenuIdx(null)}
                ></i>
              </div>
            </div>
          ))
        )}
        {/* Menu contextuel */}
        {contextMenu.visible && contextMenu.msg && (
          <div ref={contextMenuRef} className="group-context-menu" style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}>
            <div
              className="group-context-menu-item"
              onClick={() => handleToggleSave(contextMenu.msg)}
            >
              <i className={contextMenu.msg.savedBy && contextMenu.msg.savedBy.includes(currentUserId) ? 'fas fa-bookmark' : 'far fa-bookmark'} style={{ color: contextMenu.msg.savedBy && contextMenu.msg.savedBy.includes(currentUserId) ? '#ffc107' : '#666666' }}></i>
              {contextMenu.msg.savedBy && contextMenu.msg.savedBy.includes(currentUserId) ? 'Retirer des messages gardés' : 'Garder ce message'}
            </div>
            {contextMenu.msg.from === currentUserId && (
              <div
                className="group-context-menu-item"
                onClick={() => { setShowDeletePopup(true); setMessageToDelete(contextMenu.msg); setContextMenu({ visible: false, x: 0, y: 0, msg: null }); }}
              >
                <i className="fas fa-trash-alt"></i>
                Supprimer
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>
      <footer className="group-chat-footer">
        <div className="group-footer-icons">
          <i className="fas fa-image" onClick={handleGalleryClick}></i>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          <i className="far fa-smile" onClick={handleEmojiClick}></i>
        </div>
        <form onSubmit={handleSend} className="group-message-form">
          <input
            type="text"
            placeholder="Entrez un message pour le groupe"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="group-message-input"
          />
          <button type="submit" className="group-send-button">
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </footer>
      {showEmojiPicker && (
        <div className="group-emoji-picker">
          <div className="emoji-picker-header">
            <span>Emojis</span>
            <button className="emoji-picker-close" onClick={() => setShowEmojiPicker(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="emoji-grid">
            {popularEmojis.map((emoji, index) => (
              <button 
                key={index} 
                className="emoji-button"
                onClick={() => handleEmojiSelect(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      {modalImage && (
        <div className="image-modal-overlay" onClick={() => setModalImage(null)}>
          <img
            src={modalImage}
            alt="Agrandissement"
            className="image-modal-content"
          />
          <span
            className="image-modal-close"
            onClick={e => { e.stopPropagation(); setModalImage(null); }}
          >
            ×
          </span>
        </div>
      )}
      {showGroupInfo && (
        <GroupInfoPanel
          room={room}
          onClose={() => setShowGroupInfo(false)}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
      {/* Popup de confirmation suppression */}
      {showDeletePopup && (
        <div className="group-leave-modal-overlay">
          <div className="group-leave-modal">
            <h4>Supprimer ce message ?</h4>
            <p>Cette action est irréversible.</p>
            <div className="group-leave-modal-buttons">
              <button className="group-leave-modal-btn cancel" onClick={() => setShowDeletePopup(false)}>
                Annuler
              </button>
              <button className="group-leave-modal-btn confirm" onClick={handleDeleteMessage} disabled={saving}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatWindow; 