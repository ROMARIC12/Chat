import React, {
  useState,
  useEffect,
  forwardRef,
  useRef,
  useImperativeHandle,
} from "react";
import axios from "axios";
import "./Sidebare.css";
import { getAvatarUrl, handleAvatarError } from "../utils/avatarUtils";
import socket from "../services/socketClient";
import RoomJoinModal from "./RoomJoinModal";
import RoomCreateModal from "./RoomCreateModal";
import UserSavedMessagesPanel from "./UserSavedMessagesPanel";
import {
  Home,
  MessageCircle,
  Bookmark,
  User,
  Settings,
  LogOut,
  Sun, Moon
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

// Place la fonction utilitaire ici :
function formatTimestamp(ts) {
  if (!ts) return "";
  const now = new Date();
  const date = new Date();
  if (!isNaN(Date.parse(ts))) {
    date.setTime(Date.parse(ts));
  } else {
    const [h, m, s] = ts.split(":");
    date.setHours(h, m, s || 0, 0);
  }
  const isToday = now.toDateString() === date.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();
  if (isToday) {
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  } else if (isYesterday) {
    return `Hier ${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  }
}

// Fonction pour tronquer le texte avec des points de suspension
function truncateText(text, maxLength = 30) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + " ...";
}

const Sidebar = forwardRef(
  (
    {
      onUserSelect = () => {},
      onShowSettings,
      onGroupRoomSelect,
      showSavedPanel,
      setShowSavedPanel,
      showSettingsPanel,
    },
    ref
  ) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [onlineIds, setOnlineIds] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeIcon, setActiveIcon] = useState("home");
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [myRooms, setMyRooms] = useState([]);
    const [roomUnread, setRoomUnread] = useState({});
    const [roomLastMsg, setRoomLastMsg] = useState({});
    const selectedUserIdRef = useRef(selectedUserId);
    selectedUserIdRef.current = selectedUserId;

    const contactsRef = useRef(contacts);
    contactsRef.current = contacts;

    const [openedGroupRoomId, setOpenedGroupRoomId] = useState(null);
    const openedGroupRoomIdRef = useRef(openedGroupRoomId);
    useEffect(() => {
      openedGroupRoomIdRef.current = openedGroupRoomId;
    }, [openedGroupRoomId]);

    const myRoomsRef = useRef(myRooms);
    const roomUnreadRef = useRef(roomUnread);

    useEffect(() => {
      myRoomsRef.current = myRooms;
    }, [myRooms]);

    useEffect(() => {
      roomUnreadRef.current = roomUnread;
    }, [roomUnread]);

    useImperativeHandle(ref, () => ({
      focus: () => {},
      removeRoomFromList: (roomId) => {
        console.log("🗑️ SIDEBAR - Suppression immédiate de la salle:", roomId);
        setMyRooms((prev) => prev.filter((room) => room._id !== roomId));
        setRoomUnread((prev) => {
          const newUnread = { ...prev };
          delete newUnread[roomId];
          return newUnread;
        });
        setRoomLastMsg((prev) => {
          const newLastMsg = { ...prev };
          delete newLastMsg[roomId];
          return newLastMsg;
        });
        if (openedGroupRoomId === roomId) {
          setOpenedGroupRoomId(null);
        }
        setTimeout(() => {
          forceReloadRooms();
        }, 1000);
      },
      resetOpenedRoom: () => {
        console.log("SIDEBAR - Réinitialisation de la salle ouverte");
        setOpenedGroupRoomId(null);
      },
      addContact: async (contactId, lastMessage, lastMessageTimestamp) => {
        if (!contactsRef.current.some((c) => c._id === contactId)) {
          try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/users/${contactId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setContacts((prev) => [
              {
                ...res.data,
                lastMessage,
                lastMessageTimestamp,
                hasUnreadMessage: false,
              },
              ...prev,
            ]);
          } catch (err) {
            setContacts((prev) => [
              {
                _id: contactId,
                username: "Utilisateur",
                avatar: "",
                lastMessage,
                lastMessageTimestamp,
                hasUnreadMessage: false,
              },
              ...prev,
            ]);
          }
        }
      },
    }));

    const [allUsers, setAllUsers] = useState([]);
    const [loadingAllUsers, setLoadingAllUsers] = useState(false);

    const handleIconClick = async (iconName) => {
      setActiveIcon(iconName);
      if (activeIcon === "messages" && iconName !== "messages") {
        setOpenedGroupRoomId(null);
      }
      switch (iconName) {
        case "settings":
          onShowSettings();
          break;
        case "messages":
          loadRooms();
          loadMyRooms();
          break;
        case "user":
          setLoadingAllUsers(true);
          try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/users/all`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setAllUsers(res.data);
          } catch (err) {
            setAllUsers([]);
          } finally {
            setLoadingAllUsers(false);
          }
          break;
        default:
          break;
      }
    };

    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      if (socket) {
        socket.disconnect();
      }
      window.location.href = "/";
    };

    useEffect(() => {
      const fetchCurrentUser = async () => {
        try {
          const userId = localStorage.getItem("userId");
          const token = localStorage.getItem("token");
          if (!userId || !token) {
            console.error("Utilisateur non connecté");
            return;
          }
          const response = await axios.get(`${API_URL}/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCurrentUser(response.data);
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des informations utilisateur:",
            error
          );
        }
      };
      fetchCurrentUser();
    }, []);

    useEffect(() => {
      const fetchContacts = async () => {
        try {
          const userId = localStorage.getItem("userId");
          if (!userId) return;
          console.log("🔄 SIDEBAR - Chargement des contacts...");
          const res = await axios.get(
            `${API_URL}/chatroom/contacts?userId=${userId}`
          );
          const contactsWithUnreadStatus = res.data.map((contact) => ({
            ...contact,
            hasUnreadMessage: false,
          }));
          console.log(
            "📋 SIDEBAR - Contacts chargés:",
            contactsWithUnreadStatus.map((c) => ({
              id: c._id,
              name: c.username,
              lastMsg: c.lastMessage,
            }))
          );
          setContacts(contactsWithUnreadStatus);
        } catch (err) {
          console.error(" SIDEBAR - Erreur chargement contacts:", err);
        }
      };
      fetchContacts();
    }, []);

    useEffect(() => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      console.log(
        "SIDEBAR - Reconnexion au socket pour l'utilisateur:",
        userId
      );

      if (!socket.connected) {
        console.log(
          "🔌 SIDEBAR - Socket non connecté, tentative de connexion..."
        );
        socket.connect();
      }

      socket.emit("join", userId);
      console.log("SIDEBAR - Utilisateur a rejoint sa room:", userId);
      loadMyRooms();

      const handleAvatarUpdate = ({
        userId: updatedUserId,
        newAvatar,
        user,
      }) => {
        console.log(
          "SIDEBAR - Avatar mis à jour pour:",
          updatedUserId,
          newAvatar
        );

        if (updatedUserId === userId) {
          setCurrentUser((prev) =>
            prev ? { ...prev, avatar: newAvatar } : null
          );
        }

        setContacts((prev) =>
          prev.map((contact) =>
            contact._id === updatedUserId
              ? { ...contact, avatar: newAvatar }
              : contact
          )
        );

        setResults((prev) =>
          prev.map((user) =>
            user._id === updatedUserId ? { ...user, avatar: newAvatar } : user
          )
        );
      };

      socket.on("userAvatarUpdated", handleAvatarUpdate);

      return () => {
        console.log("🔌 SIDEBAR - Nettoyage de la connexion socket");
        socket.off("userAvatarUpdated", handleAvatarUpdate);
      };
    }, []);

    const fetchAllOnlineUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/online`);
        setOnlineIds(Array.from(new Set(res.data.map((u) => u._id))));
      } catch (err) {
        console.error(
          "Erreur lors de la récupération des utilisateurs en ligne:",
          err
        );
      }
    };

    useEffect(() => {
      fetchAllOnlineUsers();
      const interval = setInterval(fetchAllOnlineUsers, 30000);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      const handleUserOnline = () => {
        console.log("🟢 SIDEBAR - Utilisateur en ligne détecté");
        fetchAllOnlineUsers();
      };
      const handleUserOffline = () => {
        console.log("🔴 SIDEBAR - Utilisateur hors ligne détecté");
        fetchAllOnlineUsers();
      };

      socket.on("userOnline", handleUserOnline);
      socket.on("userOffline", handleUserOffline);

      return () => {
        socket.off("userOnline", handleUserOnline);
        socket.off("userOffline", handleUserOffline);
      };
    }, []);

    useEffect(() => {
      const handleNewMessage = async ({ from, to, message, timestamp }) => {
        const userId = localStorage.getItem("userId");
        const isContact = contactsRef.current.some(
          (contact) => contact._id === from
        );
        if (!isContact && from !== userId) {
          try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/users/${from}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setContacts((prev) => {
              if (prev.some((c) => c._id === from)) return prev;
              return [
                {
                  ...res.data,
                  lastMessage: message,
                  lastMessageTimestamp: timestamp,
                  hasUnreadMessage: true,
                },
                ...prev,
              ];
            });
          } catch (err) {
            setContacts((prev) => {
              if (prev.some((c) => c._id === from)) return prev;
              return [
                {
                  _id: from,
                  username: "Utilisateur",
                  avatar: "",
                  lastMessage: message,
                  lastMessageTimestamp: timestamp,
                  hasUnreadMessage: true,
                },
                ...prev,
              ];
            });
          }
        } else {
          setContacts((prev) =>
            prev.map((contact) => {
              if (contact._id === from || contact._id === to) {
                const isSentByMe = from === userId;
                return {
                  ...contact,
                  lastMessage: message,
                  lastMessageTimestamp: timestamp,
                  hasUnreadMessage: isSentByMe ? false : true,
                };
              }
              return contact;
            })
          );
        }
        if (from !== userId) {
          const otherUserId = from === selectedUserIdRef.current ? to : from;
          setUnreadCounts((prev) => ({
            ...prev,
            [otherUserId]: (prev[otherUserId] || 0) + 1,
          }));
        }
      };
      socket.on("receiveMessage", handleNewMessage);
      return () => {
        socket.off("receiveMessage", handleNewMessage);
      };
    }, []);

    useEffect(() => {
      if (currentUser) {
        loadRooms();
        loadMyRooms();
      }
    }, [currentUser]);

    useEffect(() => {
      console.log("🔍 SIDEBAR - État roomUnread mis à jour:", roomUnread);
    }, [roomUnread]);

    useEffect(() => {
      if (myRooms.length > 0) {
        console.log(
          "👥 SIDEBAR - Rejoindre automatiquement les rooms:",
          myRooms.map((r) => r._id)
        );
        myRooms.forEach((room) => {
          socket.emit("joinRoom", room._id);
        });
      }
    }, [myRooms]);

    useEffect(() => {
      const handler = (msg) => {
        console.log("📢 SIDEBAR - Message de groupe reçu:", msg);
        console.log("📊 SIDEBAR - État actuel:", {
          openedGroupRoomId: openedGroupRoomIdRef.current,
          myRooms: myRoomsRef.current.map((r) => r._id),
          roomUnread: roomUnreadRef.current,
          totalRooms: myRoomsRef.current.length,
        });

        const isStillMember = myRoomsRef.current.some(
          (room) => room._id === msg.roomId
        );
        console.log(
          `🔍 SIDEBAR - Vérification membre salle ${msg.roomId}:`,
          isStillMember
        );

        if (!isStillMember) {
          console.log(
            "🚫 SIDEBAR - Utilisateur n'est plus membre de la salle, message ignoré"
          );
          return;
        }

        setRoomLastMsg((prev) => ({
          ...prev,
          [msg.roomId]: {
            text: msg.text,
            from: msg.from,
            timestamp: msg.timestamp,
          },
        }));

        if (openedGroupRoomIdRef.current !== msg.roomId) {
          setRoomUnread((prev) => {
            const newCount = (prev[msg.roomId] || 0) + 1;
            console.log(
              `📈 SIDEBAR - Compteur incrémenté pour la salle ${msg.roomId}: ${newCount}`
            );
            console.log(`🔴 SIDEBAR - Nouveau total roomUnread:`, {
              ...prev,
              [msg.roomId]: newCount,
            });
            return {
              ...prev,
              [msg.roomId]: newCount,
            };
          });
        } else {
          console.log(
            `👁️ SIDEBAR - Salle ${msg.roomId} est ouverte, compteur non incrémenté`
          );
        }
      };

      console.log("🎧 SIDEBAR - Handler receiveGroupMessage monté");
      socket.on("receiveGroupMessage", handler);
      return () => {
        console.log("🎧 SIDEBAR - Handler receiveGroupMessage démonté");
        socket.off("receiveGroupMessage", handler);
      };
    }, []);

    const handleSearch = async (e) => {
      e.preventDefault();
      if (!query.trim()) return;

      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users/search?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(res.data);
      } catch (err) {
        console.error("Erreur recherche:", err);
      }
    };

    const handleInputChange = (e) => {
      const value = e.target.value;
      setQuery(value);
      if (value.trim() === "") {
        setResults([]);
      }
    };

    const usersToShow = query.trim() ? results : contacts;

    function getLastMsgInfo(userId) {
      const contact = contacts.find((c) => c._id === userId);
      return contact
        ? {
            lastMessage: contact.lastMessage,
            lastMessageTimestamp: contact.lastMessageTimestamp,
          }
        : {};
    }

    const onlineContacts = contacts.filter((user) =>
      onlineIds.includes(user._id)
    );

    const handleUserSelect = (user) => {
      setSelectedUserId(user._id);
      setUnreadCounts((prev) => ({
        ...prev,
        [user._id]: 0,
      }));
      setContacts((prev) =>
        prev.map((contact) =>
          contact._id === user._id
            ? { ...contact, hasUnreadMessage: false }
            : contact
        )
      );
      onUserSelect(user);
    };

    const loadRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_URL}/rooms/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des salles:", error);
      }
    };

    const loadMyRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        const response = await axios.get(`${API_URL}/rooms/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyRooms(response.data);

        if (response.data.length > 0) {
          console.log(
            "👥 SIDEBAR - Rejoindre automatiquement les rooms:",
            response.data.map((r) => r._id)
          );
          response.data.forEach((room) => {
            socket.emit("joinRoom", room._id);
          });
        }

        for (const room of response.data) {
          try {
            const historyRes = await axios.get(
              `${API_URL}/chatroom/group-history/${room._id}`
            );
            const history = historyRes.data;
            if (history.length > 0) {
              const lastMsg = history[history.length - 1];
              setRoomLastMsg((prev) => ({
                ...prev,
                [room._id]: {
                  text: lastMsg.text || lastMsg.message,
                  from: lastMsg.from,
                  timestamp: lastMsg.timestamp,
                },
              }));
            }
          } catch (err) {
            console.error(
              `Erreur chargement historique salle ${room._id}:`,
              err
            );
          }
        }
      } catch (error) {
        setMyRooms([]);
      }
    };

    useEffect(() => {
      if (activeIcon === "messages") {
        loadRooms();
      }
    }, [activeIcon]);

    useEffect(() => {
      if (activeIcon === "messages") {
        const interval = setInterval(() => {
          loadRooms();
          loadMyRooms();
        }, 10000);
        return () => clearInterval(interval);
      }
    }, [activeIcon]);

    const handleRoomClick = (room) => {
      setSelectedRoom(room);
      setShowRoomModal(true);
    };

    const forceReloadRooms = async () => {
      console.log("🔄 SIDEBAR - Forçage du rechargement des salles");
      await loadMyRooms();
    };

    const handleJoinRoom = async () => {
      if (!selectedRoom) return;

      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${API_URL}/rooms/${selectedRoom._id/join`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        alert("Vous avez intégré la salle avec succès !");
        setShowRoomModal(false);
        setSelectedRoom(null);
        await forceReloadRooms();
      } catch (error) {
        console.error("Erreur lors de l'intégration à la salle:", error);
        alert(
          error.response?.data?.message ||
            "Erreur lors de l'intégration à la salle"
        );
      }
    };

    const handleCancelJoin = () => {
      setShowRoomModal(false);
      setSelectedRoom(null);
    };

    const handleGroupRoomSelect = (room) => {
      console.log(
        `👁️ SIDEBAR - Ouverture de la salle ${room._id}, réinitialisation du compteur`
      );

      if (openedGroupRoomId) {
        console.log(
          `🚪 SIDEBAR - Quitter la room précédente: ${openedGroupRoomId}`
        );
        socket.emit("leaveRoom", openedGroupRoomId);
      }

      setRoomUnread((prev) => ({ ...prev, [room._id]: 0 }));
      setOpenedGroupRoomId(room._id);
      onGroupRoomSelect && onGroupRoomSelect(room);
    };

    const totalRoomUnread = Object.values(roomUnread).reduce(
      (sum, count) => sum + count,
      0
    );
    const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) + totalRoomUnread;

    useEffect(() => {
      console.log(
        "🔴 SIDEBAR - Total messages non lus dans les salles:",
        totalRoomUnread,
        "Détail:",
        roomUnread
      );
      console.log(
        "🔴 SIDEBAR - Badge rouge devrait être affiché:",
        totalRoomUnread > 0
      );

      if (totalRoomUnread > 0) {
        setTimeout(() => {
          const badge = document.querySelector(
            '[title*="message(s) non lu(s)"]'
          );
          console.log("🔍 SIDEBAR - Badge trouvé dans le DOM:", badge);
          if (badge) {
            console.log("🔍 SIDEBAR - Style du badge:", badge.style);
            console.log(
              "🔍 SIDEBAR - Position du badge:",
              badge.getBoundingClientRect()
            );
          }
        }, 100);
      }
    }, [totalRoomUnread, roomUnread]);

    const [blockedUsers, setBlockedUsers] = useState({});

    const checkBlockStatus = async (userId) => {
      if (!userId || !currentUser?._id || userId === currentUser._id) return;
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/users/${userId}/is-blocked`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBlockedUsers((prev) => ({
          ...prev,
          [userId]: res.data,
        }));
      } catch (err) {
        setBlockedUsers((prev) => ({
          ...prev,
          [userId]: { iBlock: false, blockedMe: false },
        }));
      }
    };

    useEffect(() => {
      contacts.forEach((contact) => {
        checkBlockStatus(contact._id);
      });
    }, [contacts]);

    useEffect(() => {
      const handleUserBlocked = ({ blockerId, blockedId, action }) => {
        console.log("🚫 SIDEBAR - Changement de blocage détecté:", {
          blockerId,
          blockedId,
          action,
        });

        if (blockerId === currentUser?._id || blockedId === currentUser?._id) {
          checkBlockStatus(
            blockerId === currentUser?._id ? blockedId : blockerId
          );
        }
      };

      socket.on("userBlocked", handleUserBlocked);

      return () => {
        socket.off("userBlocked", handleUserBlocked);
      };
    }, [currentUser?._id]);

    const renderAvatar = (user, size = 48) => {
      const blockStatus = blockedUsers[user._id];
      const isBlocked =
        blockStatus && (blockStatus.iBlock || blockStatus.blockedMe);

      if (isBlocked) {
        return (
          <div
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              background: "#f8f9fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #e0e0e0",
              color: "#666666",
              fontSize: size * 0.4,
            }}
          >
            <i className="fas fa-user-slash"></i>
          </div>
        );
      }

      return (
        <img
          src={getAvatarUrl(user.avatar)}
          alt={user.username}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #e0e0e0",
          }}
          onError={handleAvatarError}
        />
      );
    };

    return (
      <aside
        className="sidebar-container"
        style={
          showSavedPanel
            ? {
                maxWidth: "360px",
                minWidth: "360px",
                flexShrink: 0,
                zIndex: 1001,
              }
            : {}
        }
      >
        <div className="sidebar-nav">
          <div className="sidebar-avatar">
            <img
              src={getAvatarUrl(currentUser?.avatar)}
              alt="avatar"
              onError={handleAvatarError}
            />
          </div>
          <div className="sidebar-icons">
            <div
              className={`sidebar-icon ${
                activeIcon === "home" ? "active" : ""
              }`}
              onClick={() => handleIconClick("home")}
            >
              <Home size={20} />
            </div>
            <div
              className={`sidebar-icon ${
                activeIcon === "messages" ? "active" : ""
              }`}
              onClick={() => handleIconClick("messages")}
              style={{ position: "relative" }}
            >
              <MessageCircle size={20} />
              {totalUnreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    background: "#ff4757",
                    color: "white",
                    borderRadius: "50%",
                    minWidth: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7em",
                    fontWeight: "bold",
                    zIndex: 1000,
                    boxShadow: "0 0 8px rgba(255, 0, 0, 0.8)",
                    animation: "pulse 2s infinite",
                  }}
                  title={`${totalUnreadCount} message(s) non lu(s)`}
                >
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </div>
            <div
              className={`sidebar-icon ${showSavedPanel ? "active" : ""}`}
              onClick={() => setShowSavedPanel && setShowSavedPanel((v) => !v)}
            >
              <Bookmark size={20} />
            </div>
            <div
              className={`sidebar-icon ${
                activeIcon === "user" ? "active" : ""
              }`}
              onClick={() => handleIconClick("user")}
            >
              <User size={20} />
            </div>
            <div
              className={`sidebar-icon ${showSettingsPanel ? "active" : ""}`}
              onClick={() => handleIconClick("settings")}
            >
              <Settings size={20} />
            </div>
          </div>
          <div className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={20} />
          </div>
        </div>

        <div className="sidebar-main">
          <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: "1.45em",
                color: "#2196f3",
                letterSpacing: 1,
                marginRight: 16,
              }}
            >
              ChatApp
            </span>
          </div>
          <form
            className="sidebar-search"
            onSubmit={handleSearch}
            style={{ marginBottom: 12 }}
          >
            <div className="search-input-wrapper">
              <i className="fas fa-search search-input-icon"></i>
              <input
                ref={ref}
                type="text"
                className="search-input"
                placeholder="Tapez un nom utilisateur"
                value={query}
                onChange={handleInputChange}
              />
            </div>
          </form>

          <div className="sidebar-section">
            {activeIcon === "messages" && (
              <button
                className="create-room-btn"
                onClick={() => setShowCreateRoomModal(true)}
              >
                + Créer une salle
              </button>
            )}
            <h3 className="sidebar-title">
              {activeIcon === "messages" ? "Salles disponibles" : "Online"}
            </h3>
            {activeIcon === "messages" ? (
              rooms.length === 0 ? (
                <p className="sidebar-empty">Aucune salle disponible</p>
              ) : (
                <div className="rooms-list">
                  {rooms.map((room) => (
                    <div
                      key={room._id}
                      className="room-item"
                      onClick={() => handleRoomClick(room)}
                    >
                      <div className="room-avatar">
                        {room.type === "Rencontres" ||
                        room.type === "Rencontre" ? (
                          <i
                            className="fas fa-heart"
                            style={{ fontSize: "1.5em", color: "#333333" }}
                          ></i>
                        ) : room.type === "Mariage" ? (
                          <i
                            className="fas fa-ring"
                            style={{ fontSize: "1.5em", color: "#333333" }}
                          ></i>
                        ) : room.type === "Amis" ? (
                          <i
                            className="fas fa-user-friends"
                            style={{ fontSize: "1.5em", color: "