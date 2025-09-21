import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getAvatarUrl, handleAvatarError } from '../utils/avatarUtils';
import { X } from "lucide-react";
import { Camera } from "lucide-react";
import photoDefault from '../assets/images/default-avatar-icon-of-social-media-user-vector.jpg';
import './UserSettingsPanel.css';

const API_URL = import.meta.env.VITE_API_URL;

const UserSettingsPanel = ({ onClose, onSave }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [hobby, setHobby] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [relationship, setRelationship] = useState('');
  const fileInputRef = useRef();

  // Récupérer les informations de l'utilisateur connecté
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const token = localStorage.getItem('token');
        
        if (!userId || !token) {
          console.error('Utilisateur non connecté');
          return;
        }

        const response = await axios.get(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const user = response.data;
        setCurrentUser(user);
        setUsername(user.username || '');
        setAge(user.age || '');
        setHobby(user.hobby || '');
        setLocalisation(user.localisation || '');
        setRelationship(user.relationship || '');
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Gérer le changement de photo de profil
  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('avatar', file);
      
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      // Upload de l'avatar via le nouvel endpoint spécifique
      const response = await axios.post(`${API_URL}/users/${userId}/avatar`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });

      // Mettre à jour l'état local avec les nouvelles données utilisateur
      setCurrentUser(response.data.user);
      alert('Photo de profil mise à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors du changement d\'avatar:', error);
      console.error("Erreur lors du changement d'avatar:", error.response?.data);
      alert('Erreur lors du changement de photo de profil');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${API_URL}/users/${userId}`, {
        username,
        age: age ? parseInt(age) : null,
        hobby,
        localisation,
        relationship
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentUser(response.data);
      
      if (onSave) {
        onSave(response.data);
      }
      
      // Optionnel : afficher un message de succès
      alert('Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="user-settings-panel">
        <div className="user-settings-content">
          <div style={{ color: '#333333', textAlign: 'center' }}>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-settings-panel">
      <button className="user-settings-close" onClick={onClose} title="Fermer">
        <X size={20} />
      </button>
      <div className="user-settings-content">
        <div style={{ position: "relative" }}>
          <img
            src={getAvatarUrl(currentUser?.avatar)}
            alt="avatar"
            className="user-settings-avatar"
            onClick={handleAvatarClick}
            style={{ cursor: "pointer" }}
            onError={handleAvatarError}
          />
          <div
            style={{
              position: "absolute",
              bottom: 5,
              right: 5,
              background: "rgba(0, 0, 0, 0.7)",
              color: "#ffffff",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <Camera size={16} />
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleAvatarChange}
        />
        <div
          style={{
            color: "#666666",
            fontSize: "0.9em",
            textAlign: "center",
            marginBottom: "16px",
            fontStyle: "italic",
          }}
        >
          modifier votre photo de profil en cliquant sur l'image
        </div>
        <div className="user-settings-title">
          {currentUser?.username || "Nom Utilisateur"}
        </div>
        <form className="user-settings-form" onSubmit={handleSubmit}>
          <label>Nom d'utilisateur</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Votre nom d'utilisateur"
          />

          <label>Âge</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Votre âge"
            min="1"
            max="120"
          />

          <label>Centre d'intérêt</label>
          <input
            type="text"
            value={hobby}
            onChange={(e) => setHobby(e.target.value)}
            placeholder="Vos centres d'intérêt"
          />

          <label>Pays / Ville</label>
          <input
            type="text"
            value={localisation}
            onChange={(e) => setLocalisation(e.target.value)}
            placeholder="Votre pays / ville"
          />

          <label>Type de relation</label>
          <input
            type="text"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="type de relation"
          />

          <button
            type="submit"
            className="user-settings-save"
            disabled={saving}
          >
            {saving ? "Chargement en cour..." : "Appliquer les modifications"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserSettingsPanel; 