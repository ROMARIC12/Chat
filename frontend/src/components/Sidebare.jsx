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
    const [activeIcon, setActiveIcon] = useState("home"); // État pour l'icône active
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [myRooms, setMyRooms] = useState([]);
    const [roomUnread, setRoomUnread] = useState({}); // { roomId: count }
    const [roomLastMsg, setRoomLastMsg] = useState({}); // { roomId: {text, from, timestamp} }
    const selectedUserIdRef = useRef(selectedUserId);
    selectedUserIdRef.current = selectedUserId;

    // Référence pour accéder aux contacts actuels dans les event listeners
    const contactsRef = useRef(contacts);
    contactsRef.current = contacts;

    // Ajoute un état pour la salle de groupe actuellement ouverte
    const [openedGroupRoomId, setOpenedGroupRoomId] = useState(null);

    // Ajoute une ref pour la salle de groupe ouverte
    const openedGroupRoomIdRef = useRef(openedGroupRoomId);
    useEffect(() => {
      openedGroupRoomIdRef.current = openedGroupRoomId;
    }, [openedGroupRoomId]);

    // Ajoute des refs pour accéder aux valeurs actuelles dans les event listeners
    const myRoomsRef = useRef(myRooms);
    const roomUnreadRef = useRef(roomUnread);

    // Synchroniser les refs avec les états
    useEffect(() => {
      myRoomsRef.current = myRooms;
    }, [myRooms]);

    useEffect(() => {
      roomUnreadRef.current = roomUnread;
    }, [roomUnread]);

    // Exposer la fonction removeRoomFromList via la ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        // Fonction focus existante
      },
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
        // Réinitialiser l'état de la salle ouverte si c'était cette salle
        if (openedGroupRoomId === roomId) {
          setOpenedGroupRoomId(null);
        }
        // Forcer le rechargement des salles pour s'assurer que tout est à jour
        setTimeout(() => {
          forceReloadRooms();
        }, 1000);
      },
      resetOpenedRoom: () => {
        console.log("🔄 SIDEBAR - Réinitialisation de la salle ouverte");
        setOpenedGroupRoomId(null);
      },
      addContact: async (contactId, lastMessage, lastMessageTimestamp) => {
        // Ajoute un contact à la sidebar si non présent
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

    // Nouvel état pour tous les utilisateurs
    const [allUsers, setAllUsers] = useState([]);
    const [loadingAllUsers, setLoadingAllUsers] = useState(false);

    // Fonction pour gérer le clic sur une icône
    const handleIconClick = async (iconName) => {
      setActiveIcon(iconName);
      if (activeIcon === "messages" && iconName !== "messages") {
        setOpenedGroupRoomId(null);
      }
      switch (iconName) {
        case "settings":
          if (activeIcon === "settings") {
            onShowSettings();
          } else {
            onShowSettings();
          }
          break;
        case "home":
          break;
        case "messages":
          loadRooms();
          loadMyRooms();
          break;
        case "bookmark":
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

    // Fonction de déconnexion
    const handleLogout = () => {
      // Nettoyer le localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");

      // Déconnecter du socket
      if (socket) {
        socket.disconnect();
      }

      // Rediriger vers la page d'accueil
      window.location.href = "/";
    };

    // Récupérer les informations de l'utilisateur connecté
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

    // Charger les contacts (utilisateurs avec qui il y a eu une discussion)
    useEffect(() => {
      const fetchContacts = async () => {
        try {
          const userId = localStorage.getItem("userId");
          if (!userId) return;
          console.log("🔄 SIDEBAR - Chargement des contacts...");
          const res = await axios.get(
            `${API_URL}/chatroom/contacts?userId=${userId}`
          );
          // S'assurer que hasUnreadMessage est initialisé à false pour tous les contacts existants
          const contactsWithUnreadStatus = res.data.map((contact) => ({
            ...contact,
            hasUnreadMessage: false, // Par défaut, les messages existants sont considérés comme lus
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
          console.error("❌ SIDEBAR - Erreur chargement contacts:", err);
        }
      };
      fetchContacts();
    }, []);

    // Charger les salles de l'utilisateur dès le montage du composant
    // useEffect(() => {
    //   loadMyRooms();
    // }, []);

    // Se reconnecter au socket et rejoindre la room utilisateur
    useEffect(() => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      console.log(
        "🔌 SIDEBAR - Reconnexion au socket pour l'utilisateur:",
        userId
      );

      // S'assurer que le socket est connecté
      if (!socket.connected) {
        console.log(
          "🔌 SIDEBAR - Socket non connecté, tentative de connexion..."
        );
        socket.connect();
      }

      // Rejoindre la room de l'utilisateur
      socket.emit("join", userId);
      console.log("✅ SIDEBAR - Utilisateur a rejoint sa room:", userId);

      // Charger les rooms de groupe dès que le socket est prêt
      loadMyRooms();

      // Écouter les mises à jour d'avatar
      const handleAvatarUpdate = ({
        userId: updatedUserId,
        newAvatar,
        user,
      }) => {
        console.log(
          "🖼️ SIDEBAR - Avatar mis à jour pour:",
          updatedUserId,
          newAvatar
        );

        // Si c'est l'utilisateur connecté, mettre à jour son avatar
        if (updatedUserId === userId) {
          setCurrentUser((prev) =>
            prev ? { ...prev, avatar: newAvatar } : null
          );
        }

        // Mettre à jour l'avatar dans les contacts si présent
        setContacts((prev) =>
          prev.map((contact) =>
            contact._id === updatedUserId
              ? { ...contact, avatar: newAvatar }
              : contact
          )
        );

        // Mettre à jour l'avatar dans les résultats de recherche si présent
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

    // Charger la liste de tous les utilisateurs online
    const fetchAllOnlineUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/online`);
        // Utiliser Set pour éviter les doublons
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
      const interval = setInterval(fetchAllOnlineUsers, 30000); // Mise à jour toutes les 30 secondes
      return () => clearInterval(interval);
    }, []);

    // Écouter les événements de statut utilisateur
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

    // Écouter les nouveaux messages privés
    useEffect(() => {
      const handleNewMessage = async ({ from, to, message, timestamp }) => {
        const userId = localStorage.getItem("userId");
        const isContact = contactsRef.current.some(
          (contact) => contact._id === from
        );
        if (!isContact && from !== userId) {
          // Aller chercher les infos de l'expéditeur
          try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/users/${from}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setContacts((prev) => {
              // Évite les doublons
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
            // fallback si l'API échoue
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
              // Si c'est moi qui envoie le message, ne pas mettre hasUnreadMessage à true
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
        // Incrémenter le compteur de messages non lus uniquement si ce n'est pas moi qui envoie
        // Incrémenter le compteur de messages non lus uniquement si ce n'est pas moi qui envoie
          if (from !== userId) {
            const otherUserId = from === userId ? to : from;
            setUnreadCounts((prev) => ({
              ...prev,
              [otherUserId]: (prev[otherUserId] || 0) + 1,
            }));
            
            // Mettre à jour également le statut hasUnreadMessage
            setContacts((prev) =>
              prev.map((contact) =>
                contact._id === otherUserId
                  ? { ...contact, hasUnreadMessage: true }
                  : contact
              )
            );
          }
          }
      socket.on("receiveMessage", handleNewMessage);
      return () => {
        socket.off("receiveMessage", handleNewMessage);
      };
    }, []);

    // Charger les salles dès que l'utilisateur courant est récupéré
    useEffect(() => {
      if (currentUser) {
        loadRooms();
        loadMyRooms();
      }
    }, [currentUser]);

    // Debug: Logger les changements de roomUnread
    useEffect(() => {
      console.log("🔍 SIDEBAR - État roomUnread mis à jour:", roomUnread);
    }, [roomUnread]);

    // Rejoindre automatiquement toutes les rooms de l'utilisateur
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

    // Écouter les messages de groupe (monté une seule fois)
    useEffect(() => {
      const handler = (msg) => {
        console.log("📢 SIDEBAR - Message de groupe reçu:", msg);
        console.log("📊 SIDEBAR - État actuel:", {
          openedGroupRoomId: openedGroupRoomIdRef.current,
          myRooms: myRoomsRef.current.map((r) => r._id),
          roomUnread: roomUnreadRef.current,
          totalRooms: myRoomsRef.current.length,
        });

        // Vérifier que l'utilisateur est encore membre de cette salle
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

        // Mettre à jour le dernier message de la salle
        setRoomLastMsg((prev) => ({
          ...prev,
          [msg.roomId]: {
            text: msg.text,
            from: msg.from,
            timestamp: msg.timestamp,
          },
        }));

        // Incrémenter le compteur de messages non lus si la salle n'est pas ouverte
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

    // Quand l'input change, si vide, on vide aussi les résultats
    const handleInputChange = (e) => {
      const value = e.target.value;
      setQuery(value);

      if (value.trim() === "") {
        setResults([]);
      }
    };

    // Afficher les résultats de recherche si recherche, sinon les contacts
    const usersToShow = query.trim() ? results : contacts;

    // Fonction utilitaire pour trouver le dernier message d'un user dans les contacts (si on a déjà discuté)
    function getLastMsgInfo(userId) {
      const contact = contacts.find((c) => c._id === userId);
      return contact
        ? {
            lastMessage: contact.lastMessage,
            lastMessageTimestamp: contact.lastMessageTimestamp,
          }
        : {};
    }

    // Croiser contacts et onlineIds pour la section Online
    const onlineContacts = contacts.filter((user) =>
      onlineIds.includes(user._id)
    );

    // Réinitialiser le compteur et marquer comme lu quand on clique sur un contact
    const handleUserSelect = (user) => {
      setSelectedUserId(user._id);
      setUnreadCounts((prev) => ({
        ...prev,
        [user._id]: 0,
      }));
      // Marquer comme lu
      setContacts((prev) =>
        prev.map((contact) =>
          contact._id === user._id
            ? { ...contact, hasUnreadMessage: false }
            : contact
        )
      );
      onUserSelect(user);
    };

    // Charger les salles disponibles
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

    // Charger les salles de l'utilisateur
    const loadMyRooms = async () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");
        if (!userId) return;
        const response = await axios.get(`${API_URL}/rooms/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMyRooms(response.data);

        // Rejoindre automatiquement toutes les rooms
        if (response.data.length > 0) {
          console.log(
            "👥 SIDEBAR - Rejoindre automatiquement les rooms:",
            response.data.map((r) => r._id)
          );
          response.data.forEach((room) => {
            socket.emit("joinRoom", room._id);
          });
        }

        // Charger les derniers messages pour chaque salle
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

    // Charger les salles disponibles à chaque affichage de l'onglet messages
    useEffect(() => {
      if (activeIcon === "messages") {
        loadRooms();
      }
    }, [activeIcon]);

    // Recharger les salles périodiquement
    useEffect(() => {
      if (activeIcon === "messages") {
        const interval = setInterval(() => {
          loadRooms();
          loadMyRooms();
        }, 10000); // Recharger toutes les 10 secondes
        return () => clearInterval(interval);
      }
    }, [activeIcon]);

    // Gérer le clic sur une salle
    const handleRoomClick = (room) => {
      setSelectedRoom(room);
      setShowRoomModal(true);
    };

    // Fonction pour forcer le rechargement des salles et rejoindre les rooms
    const forceReloadRooms = async () => {
      console.log("🔄 SIDEBAR - Forçage du rechargement des salles");
      await loadMyRooms();
    };

    // Confirmer l'intégration à une salle
    const handleJoinRoom = async () => {
      if (!selectedRoom) return;

      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${API_URL}/rooms/${selectedRoom._id}/join`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        alert("Vous avez intégré la salle avec succès !");
        setShowRoomModal(false);
        setSelectedRoom(null);

        // Forcer le rechargement des salles pour s'assurer que tout est à jour
        await forceReloadRooms();
      } catch (error) {
        console.error("Erreur lors de l'intégration à la salle:", error);
        alert(
          error.response?.data?.message ||
            "Erreur lors de l'intégration à la salle"
        );
      }
    };

    // Annuler l'intégration à une salle
    const handleCancelJoin = () => {
      setShowRoomModal(false);
      setSelectedRoom(null);
    };

    // Quand on ouvre une salle, reset le compteur de non lus
    const handleGroupRoomSelect = (room) => {
      console.log(
        `👁️ SIDEBAR - Ouverture de la salle ${room._id}, réinitialisation du compteur`
      );

      // Quitter la room précédente si elle existe
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

    // Calculer le total des messages non lus dans les salles
    const totalRoomUnread = Object.values(roomUnread).reduce(
      (sum, count) => sum + count,
      0
    );

    // Debug: Logger le total des messages non lus
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

      // Test pour vérifier si le badge est dans le DOM
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

    const [blockedUsers, setBlockedUsers] = useState({}); // { userId: { iBlock: boolean, blockedMe: boolean } }

    // Fonction pour vérifier le statut de blocage d'un utilisateur
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

    // Vérifier le statut de blocage pour tous les contacts
    useEffect(() => {
      contacts.forEach((contact) => {
        checkBlockStatus(contact._id);
      });
    }, [contacts]);

    // Écouter les changements de blocage en temps réel
    useEffect(() => {
      const handleUserBlocked = ({ blockerId, blockedId, action }) => {
        console.log("🚫 SIDEBAR - Changement de blocage détecté:", {
          blockerId,
          blockedId,
          action,
        });

        // Recharger le statut de blocage pour les utilisateurs concernés
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

    // Fonction pour afficher l'avatar avec gestion du blocage
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
        {/* Colonne de navigation */}
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
              {totalRoomUnread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 16,
                    height: 16,
                    background: "#ff0000",
                    borderRadius: "50%",
                    border: "3px solid #ffffff",
                    display: "block",
                    zIndex: 1000,
                    boxShadow: "0 0 8px rgba(255, 0, 0, 0.8)",
                    animation: "pulse 1s infinite",
                  }}
                  title={`${totalRoomUnread} message(s) non lu(s) dans les salles`}
                ></span>
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

        {/* Contenu principal */}
        <div className="sidebar-main">
                          {/* Nom de l'app Iss'Chat en haut */}
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 10 }}
          >
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
          {/* 🔍 Barre de recherche */}
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
              // Affichage des salles
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
                        {/* Icône noire selon le type de salle */}
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
                            style={{ fontSize: "1.5em", color: "#333333" }}
                          ></i>
                        ) : (
                          <i
                            className="fas fa-users"
                            style={{ fontSize: "1.5em", color: "#333333" }}
                          ></i>
                        )}
                      </div>
                      <div className="room-info">
                        <div className="room-name">{room.name}</div>
                        <div className="room-type">{room.type}</div>
                        <div className="room-members">
                          {room.members?.length || 0} membres
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : // Affichage des contacts (comportement original)
            contacts.length === 0 ? (
              <p className="sidebar-empty">Aucun ami(e)s en ligne</p>
            ) : (
              <div style={{ display: "flex", gap: 24 }}>
                {contacts.map((user) => {
                  const isOnline = onlineIds.includes(user._id);
                  return (
                    <div
                      key={user._id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{ position: "relative", width: 64, height: 64 }}
                      >
                        {renderAvatar(
                          { ...user, status: isOnline ? "online" : "offline" },
                          64
                        )}
                        <span
                          style={{
                            position: "absolute",
                            bottom: 4,
                            right: 4,
                            width: 16,
                            height: 16,
                            background: isOnline ? "#28a745" : "#6c757d",
                            borderRadius: "50%",
                            border: "2px solid #ffffff",
                            display: "block",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.9em",
                          color: "#333333",
                          marginTop: 4,
                          textAlign: "center",
                        }}
                      >
                        {user.username}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">
              {activeIcon === "messages" ? "Mes salles" : "Messages"}
            </h3>
            <hr className="sidebar-separator" />
            <div className="results">
              {activeIcon === "messages" ? (
                myRooms.length === 0 ? (
                  <p className="sidebar-empty">Aucune salle rejointe</p>
                ) : (
                  myRooms.map((room) => (
                    <div
                      key={room._id}
                      className={`my-room-item ${roomUnread[room._id] > 0 ? 'has-unread' : ''}`}
                      onClick={() => handleGroupRoomSelect(room)}
                    >
                      <div className="my-room-avatar">
                        {/* Icône noire selon le type de salle */}
                        {room.type === "Rencontres" ||
                        room.type === "Rencontre" ? (
                          <i
                            className="fas fa-heart"
                            style={{
                              fontSize: "1.5em",
                              color: "#333333",
                              marginTop: 2,
                            }}
                          ></i>
                        ) : room.type === "Mariage" ? (
                          <i
                            className="fas fa-ring"
                            style={{
                              fontSize: "1.5em",
                              color: "#333333",
                              marginTop: 2,
                            }}
                          ></i>
                        ) : room.type === "Amis" ? (
                          <i
                            className="fas fa-user-friends"
                            style={{
                              fontSize: "1.5em",
                              color: "#333333",
                              marginTop: 2,
                            }}
                          ></i>
                        ) : (
                          <i
                            className="fas fa-users"
                            style={{
                              fontSize: "1.5em",
                              color: "#333333",
                              marginTop: 2,
                            }}
                          ></i>
                        )}
                      </div>
                      <div className="my-room-info">
                        <div className="my-room-header-row">
                          <div className="my-room-name">{room.name}</div>
                          <span className="my-room-lastmsg-time">
                            {roomLastMsg[room._id]?.timestamp
                              ? formatTimestamp(roomLastMsg[room._id].timestamp)
                              : ""}
                          </span>
                        </div>
                        <div className="my-room-lastmsg">
                          {roomLastMsg[room._id]?.from ? (
                            <>
                              <span className="sender">
                                {room.members?.find(
                                  (m) => m._id === roomLastMsg[room._id].from
                                )?.username || roomLastMsg[room._id].from}
                              </span>
                              <span
                                className="msg-text"
                                style={{
                                  color:
                                    roomUnread[room._id] > 0
                                      ? "#333333"
                                      : "#666666",
                                  fontWeight:
                                    roomUnread[room._id] > 0
                                      ? "bold"
                                      : "normal",
                                }}
                              >
                                {roomLastMsg[room._id].text}
                              </span>
                            </>
                          ) : (
                            <span style={{ color: "#666666" }}>Aucun message</span>
                          )}
                        </div>
                      </div>
                      {roomUnread[room._id] > 0 && (
                        <span className="my-room-badge">
                          {roomUnread[room._id]}
                        </span>
                      )}
                    </div>
                  ))
                )
              ) : // Affichage des messages (comportement original)
              usersToShow.length === 0 ? (
                <p className="sidebar-empty">
                  Aucune discussion pour le moment
                </p>
              ) : (
                usersToShow.map((user) => {
                  const { lastMessage, lastMessageTimestamp } = getLastMsgInfo(
                    user._id
                  );
                  let hasUnreadMessage = user.hasUnreadMessage || false;
                  const currentUserId =
                    currentUser?._id || localStorage.getItem("userId");
                  const isLastMsgFromMe =
                    user.lastMessage && user.lastMessage.from === currentUserId;
                  if (isLastMsgFromMe) hasUnreadMessage = false;
                  const isOnline = onlineIds.includes(user._id);
                  return (
                    <div
                      key={user._id}
                      className="user-result"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div
                        style={{ position: "relative", width: 48, height: 48 }}
                      >
                        {renderAvatar(
                          { ...user, status: isOnline ? "online" : "offline" },
                          48
                        )}
                        <span
                          style={{
                            position: "absolute",
                            bottom: 2,
                            right: 2,
                            width: 12,
                            height: 12,
                            background: isOnline ? "#28a745" : "#6c757d",
                            borderRadius: "50%",
                            border: "2px solid #ffffff",
                            display: "block",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                          marginLeft: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: "1.05em" }}>
                            {user.username}
                          </span>
                          {(user.lastMessageTimestamp ||
                            lastMessageTimestamp) && (
                            <span
                              className="last-message-timestamp"
                              style={{
                                fontSize: "0.85em",
                                color: "#666666",
                                marginLeft: 8,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatTimestamp(
                                user.lastMessageTimestamp ||
                                  lastMessageTimestamp
                              )}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            margin: "2px 0 0 0",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.97em",
                              color: hasUnreadMessage ? "#333333" : "#666666",
                              fontWeight: hasUnreadMessage ? "bold" : "normal",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 140,
                            }}
                          >
                            {truncateText(
                              user.lastMessage ||
                                lastMessage ||
                                "Aucun message récent"
                            )}
                          </span>
                          {/* Afficher le badge uniquement si le dernier message n'est PAS de moi et qu'il y a des non lus */}
                          {!isLastMsgFromMe && unreadCounts[user._id] > 0 && (
                            <span className="notification-badge">
                              {unreadCounts[user._id]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Affichage des utilisateurs inscrits si l'icône user est active */}
          {activeIcon === "user" && (
            <div className="sidebar-section">
              <h3 className="sidebar-title">Utilisateurs inscrits</h3>
              {loadingAllUsers ? (
                <p className="sidebar-empty">Chargement...</p>
              ) : allUsers.length === 0 ? (
                <p className="sidebar-empty">Aucun utilisateur trouvé</p>
              ) : (
                <div className="users-list">
                  {allUsers.map((user) => {
                    const isOnline = onlineIds.includes(user._id);
                    return (
                      <div
                        key={user._id}
                        className="user-result"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: 48,
                            height: 48,
                          }}
                        >
                          {renderAvatar(
                            {
                              ...user,
                              status: isOnline ? "online" : "offline",
                            },
                            48
                          )}
                          <span
                            style={{
                              position: "absolute",
                              bottom: 2,
                              right: 2,
                              width: 12,
                              height: 12,
                              background: isOnline ? "#19d219" : "#888",
                              borderRadius: "50%",
                              border: "2px solid #222",
                              display: "block",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            marginLeft: 12,
                          }}
                        >
                          <span style={{ fontWeight: 600, fontSize: "1.05em" }}>
                            {user.username}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de confirmation d'intégration à une salle */}
        <RoomJoinModal
          room={selectedRoom}
          onConfirm={handleJoinRoom}
          onCancel={handleCancelJoin}
          isVisible={showRoomModal}
        />

        <RoomCreateModal
          isVisible={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          onCreated={loadRooms}
        />

        {showSavedPanel && (
          <UserSavedMessagesPanel
            userId={currentUser?._id}
            onClose={() => setShowSavedPanel && setShowSavedPanel(false)}
          />
        )}
      </aside>
    );
  }
);

export default Sidebar;

