import React, { useState } from 'react';
import './RoomJoinModal.css'; // Réutilise le style modal

const API_URL = import.meta.env.VITE_API_URL;

const RoomCreateModal = ({ isVisible, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Amis');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, type, description }),
      });
      if (!res.ok) throw new Error('Erreur création salle');
      setName('');
      setType('Amis');
      setDescription('');
      onCreated && onCreated();
      onClose();
    } catch (err) {
      alert('Erreur lors de la création de la salle');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;
  return (
    <div className="room-join-modal-overlay">
      <div className="room-join-modal">
        <div className="room-join-modal-header">
          <h3>Créer une salle</h3>
          <button className="room-join-modal-close" onClick={onClose}>&times;</button>
        </div>
        <form className="room-join-modal-content" onSubmit={handleSubmit}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la salle" required />
          <select value={type} onChange={e => setType(e.target.value)}>
            <option>Amis</option>
            <option>Rencontres</option>
            <option>Connaissances</option>
            <option>Mariage</option>
          </select>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
          <div className="room-join-modal-actions">
            <button type="button" className="room-join-btn-cancel" onClick={onClose}>Annuler</button>
            <button type="submit" className="room-join-btn-confirm" disabled={loading}>{loading ? 'Création...' : 'Créer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomCreateModal;
