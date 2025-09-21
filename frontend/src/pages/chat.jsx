import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebare';
import ChatWindow from '../components/ChatWindow';
import UserSettingsPanel from '../components/UserSettingsPanel';
import UserProfilePanel from '../components/UserProfilePanel';
import GroupChatWindow from '../components/GroupChatWindow';
import { Home, MessageCircle, Settings, User, LogOut } from "lucide-react";
import './Chat.css';

const ChatRoom = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroupRoom, setSelectedGroupRoom] = useState(null);
  const [messages, setMessages] = useState({}); // messages par utilisateur
  const [showUserSettingsPanel, setShowUserSettingsPanel] = useState(false);
  const [showUserProfilePanel, setShowUserProfilePanel] = useState(false);
  const [profilePanelData, setProfilePanelData] = useState({ medias: [], files: [], links: [] });
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const searchInputRef = useRef(null);

  // Fermer UserSavedMessagesPanel si UserSettingsPanel s'ouvre
  React.useEffect(() => {
    if (showUserSettingsPanel && showSavedPanel) setShowSavedPanel(false);
  }, [showUserSettingsPanel]);

  // Fermer UserSettingsPanel si UserSavedMessagesPanel s'ouvre
  React.useEffect(() => {
    if (showSavedPanel && showUserSettingsPanel) setShowUserSettingsPanel(false);
  }, [showSavedPanel]);

  // Fermer UserProfilePanel si UserSavedMessagesPanel s'ouvre
  React.useEffect(() => {
    if (showSavedPanel && showUserProfilePanel) setShowUserProfilePanel(false);
  }, [showSavedPanel]);

  // Fermer UserSavedMessagesPanel si UserProfilePanel s'ouvre
  React.useEffect(() => {
    if (showUserProfilePanel && showSavedPanel) setShowSavedPanel(false);
  }, [showUserProfilePanel]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleStartDiscussion = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Fonction pour envoyer un message à l'utilisateur sélectionné
  const handleSendMessage = (messageObj) => {
    if (!selectedUser || !messageObj) return;
    const userId = selectedUser._id;
    setMessages((prev) => {
      const userMessages = prev[userId] || [];
      return {
        ...prev,
        [userId]: [...userMessages, messageObj],
      };
    });
    console.log(`[${messageObj.from}] → [${messageObj.to}] : ${messageObj.text}`);
  };

  // Gérer le départ d'une salle
  const handleLeaveRoom = (roomId) => {
    console.log('🚪 ChatRoom - Utilisateur a quitté la salle:', roomId);
    // Fermer immédiatement le chat
    setSelectedGroupRoom(null);
    // Notifier la sidebar pour supprimer la salle de la liste
    if (searchInputRef.current && searchInputRef.current.removeRoomFromList) {
      searchInputRef.current.removeRoomFromList(roomId);
    }
  };

  // Gérer la fermeture d'une salle
  const handleCloseGroupRoom = () => {
    console.log('🚪 ChatRoom - Fermeture de la salle');
    setSelectedGroupRoom(null);
    // Réinitialiser l'état de la salle ouverte dans la sidebar
    if (searchInputRef.current && searchInputRef.current.resetOpenedRoom) {
      searchInputRef.current.resetOpenedRoom();
    }
  };

  // Simuler un utilisateur connecté pour la démo UserSettingsPanel
  const currentUser = { username: 'Utilisateur', avatar: null };

  return (
    <div
      className="chat-page"
      style={{ display: "flex", height: "100vh", position: "relative" }}
    >
      <Sidebar
        ref={searchInputRef}
        onUserSelect={handleUserSelect}
        onShowSettings={() => setShowUserSettingsPanel((prev) => !prev)}
        onGroupRoomSelect={setSelectedGroupRoom}
        showSavedPanel={showSavedPanel}
        setShowSavedPanel={setShowSavedPanel}
        showSettingsPanel={showUserSettingsPanel}
      />

      {/* Zone centrale (contacts/messages OU accueil OU chat) */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          transition: "margin-right 0.3s",
          marginRight: showSavedPanel ? 400 : 0,
        }}
      >
        {selectedGroupRoom ? (
          <GroupChatWindow
            room={selectedGroupRoom}
            onClose={handleCloseGroupRoom}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : selectedUser ? (
          <ChatWindow
            user={selectedUser}
            messages={messages[selectedUser._id] || []}
            onSendMessage={handleSendMessage}
            onClose={() => setSelectedUser(null)}
            onShowUserProfile={() => setShowUserProfilePanel(true)}
            onProfileDataChange={setProfilePanelData}
            sidebarRef={searchInputRef}
          />
        ) : (
          <div className="chat-welcome-screen" style={{ width: "100%" }}>
            <div className="welcome-content">
              <h1>ChatApp</h1>
            </div>
          </div>
        )}
      </div>

      {/* Panneau latéral UserSettingsPanel (non-overlay, flex à droite) */}
      {showUserSettingsPanel && (
        <UserSettingsPanel
          user={currentUser}
          onClose={() => setShowUserSettingsPanel(false)}
          style={{
            width: "360px",
            backgroundColor: "#ffffff",
            borderLeft: "1px solid #e0e0e0",
            boxShadow: "-4px 0 12px rgba(0, 0, 0, 0.1)",
          }}
        />
      )}
      {showUserProfilePanel && selectedUser && (
        <UserProfilePanel
          user={selectedUser}
          onClose={() => setShowUserProfilePanel(false)}
          medias={profilePanelData.medias}
          files={profilePanelData.files}
          links={profilePanelData.links}
          style={{
            width: "360px",
            backgroundColor: "#ffffff",
            borderLeft: "1px solid #e0e0e0",
            boxShadow: "-4px 0 12px rgba(0, 0, 0, 0.1)",
          }}
        />
      )}
    </div>
  );
};

export default ChatRoom;