import { useState } from "react";

const Register = () => {
    const [viewPassword, setViewPassword] = useState(false);
    const viewWritePassword = () => {
        if(!viewPassword) {
            setViewPassword;
        }
    }

    const [ message, SetMessage ] = useState({ type: "", text: "" });

    const [ formData, setFormData ] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const validateForm = () => {
        if(!formData.username || !formData.email || formData.password || formData.confirmPassword) {
            message({ type: "error", text: "Veuillez remplir tous les champs" });
            return false
        }
        return true;
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value, 
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(!validateForm) return;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "content-type" : "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            message({ type: "success", text: "Inscription réussie" });
        } catch (error) {
            message({ type: "error", text: "Une erreur est survenue lors de l'inscription !"})
        }
    }

    return(
        <form onSubmit={handleSubmit}>

            {message.text &&(
                <p className={ message.type === "error" ? "error-msg" : "success-msg" }>
                    {message.text}
                </p>
            )}

            <div>
                <label htmlFor="usernale">Nom utilisateur</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} />
            </div>
            <div>
                <label htmlFor="email">Email</label>
                <input type="text" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div>
                <label htmlFor="password">Mot de passe</label>
                <input type={ viewPassword ? "password" : "text" } name="password" value={formData.password} onChange={handleChange} />
            </div>
            <button type="submit" onClick={viewWritePassword}>je m'inscris</button>
        </form>
    )
}

export default Register;

////////////////// >>>>>>>>>>>>>>>>>>>>>>>>>>>>> <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //////////////////

import React from "react";
import { BrowserRouter } from "react-router-dom"
import { creatRoot } from "react-dom/client";

const root = creatRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);

////////////////// >>>>>>>>>>>>>>>>>>>>>>>>>>>>> <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //////////////////

import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Footer from "./components/Footer";

const App = () => {
    return(
        <>
        <Navbar />
        <Routes>
            <Route path="/" element={<Home />} />
        </Routes>
        <Footer />
    </>
    )
};


////////////////// >>>>>>>>>>>>>>>>>>>>>>>>>>>>> <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< //////////////////
import { NavLink } from "react-router-dom";

const Navbar = () => {
    return(
        <nav>
            <NavLink to="/" end className={({isAcive}) => (isAcive ? "active-link-nav" : undefined)}>home</NavLink>
        </nav>
    )
}

/////////////////////////// ------------------------ ///////////////////////////////////
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        return response.data;
    } catch (error) {
        throw error.response?.data || "Erreur inconnu";
    }
}

import { Register } from "./services/authService";

try {
    const response = Register(formData);
    response.error;
} catch (error) {
    
}

///////////////////////////////////////////////////////////////////////////////////////////////////
import { useState, useEffect } from 'react';

const useAuth = () => {
    const [ isAuth, setIsAuth ] = useState(!!localStorage.getItem("token"));

    useEffect(() => {
        const handleStorageChange = () => {
            setIsAuth(!!localstorage.getItem("token"));
        }

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    return isAuth;
}

// export default useAuth;

// RECHERCHE D'UN UTILISATEUR
const User = require("...");

exports.userSearch = async (req, res) => {
    const query = req.query.query;
    const currentUserId = req.user.id;

    try {
        const user = await User.find({
            _id: { $ne: currentUserId },
            $or: [
                { username: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" }}
            ]
        }).select("_id username avatar");

        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: "Une erreur est survenue, lors de la recherche" });
    }
}

/////////////////////////////////////////////////////////////////////////////////////////
import { useState } from "react";
import { validate } from "../../server-express/models/User";
import ChatWindow from "./components/ChatWindow";

const Registers = () => {
    const [ messages, setMessage ] = useState({ type: "", text: "" });
    const [ viewPassword, setViewPassword ] = useState(false);

    const verifyViewPassword = () => {
        setViewPassword(!viewPassword);
    }

    const [ formData, setFormData ] = useState({
        username: "",
        email: "",
        password: "",
        password_verify: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!validate()) return;

        try {
            const response = userRegister(formData);
            setMessage({ type: "success", text: "Inscription réussie veuillez vous connectez" });
            setTimeout(() => naviagte("/login"), 2000);
        } catch (error) {
            setMessage({ type: "error", text: "Erreur lors de l'inscription", error: error.message });
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="username" value={formData.username} onChange={handleChange} />
            <input type="text" name="email" value={formData.email} onChange={handleChange} />
            <input type={viewPassword ? "text" : "password" } name="password" value={formData.password} onChange={handleChange} id="" />
            <span onClick={verifyViewPassword}>Voir le mot de passe</span>
            <input type={ viewPassword ? "text" : "passwors" } name="password_verify" value={formData.password_verify} onChange={handleChange} id="" />
            <button type="submit">Envoyer</button>
        </form>
    )
}

////////////////////////////////////////////////////////////////////////////////////////////

// import { useState, useEffect } from "react";

// const userAuth = () => {
//     const [ isAuth, setIsAuth ] = useState(!!localStorage.getItem("token"));

//     useEffect(() => {
//         const handleStorageChange = () => {
//             setIsAuth(!!localStorage.getItem("token"));
//         }

//         window.addEventListener("storage", handleStorageChange);
//         return () => window.removeEventListener("storage", handleStorageChange);
//     }, []);

//     return isAuth;
// }

//////////////////////////////////////////////////////////////////////////////////////////

// const Sidebare = (onUseSelect) => {
//     const [ query, setQuery ] = useState("");
//     const [ results, setResults ] = useState([]);

//     const handleInputChange = (e) => {
//         const value = e.target.value;
//         setQuery(value);

//         if(value.trim() === "") {
//             setQuery([]);
//         }
//     }

//     const handleSearch = async (e) => {
//         e.preventDefault();
//         if(!query.trim()) return;

//         try {
//             const token = localStorage.getItem("token");
//             const response = await axios.get(`http://localhost:5000/api/users/query=${query}`, {
//                 headers: { Authorization : `Bearer ${token}`}
//             })
//             setResults(response.data);
//         } catch (error) {
//             console.error("Une erreur est survenue lors de la recherche", error);
//         }
//     }

//     return(
//         <form onSubmit={handleSearch}>
//             <input type="text" value={query} onChange={handleInputChange} />
//             <button type="submit">Rechercher</button>
//         </form>
//     )
// }

// { results.length === 0 ? (
//     <p>Aucun message pour le moment</p>
// ) : (
//     results.map((user) => {
//         <div key={ user._id }>
//             <p>{ user.username }</p>
//         </div>
//     })
// )}

//////////////////////////////////////////////////////////////////////////

const sidebar = (onUserSelect) => {
    const [ query, setQuery ] = useState("");
    const [ results, setResults ] = useState([]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);

        if(value.trim() === "") {
            setQuery([]);
        }
    }

    const handleSearchSubmit = async (e) => {
        e.preventDefault();
        if(!query.trim()) return;

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API_URL}/users/query=${query}`, {
                headers: { Authorization : `Bearer ${token}`}
            });
            setResults(response.data);
        } catch (error) {
            console.error("Erreur lors de la recherche", error);
        };
    };

    return(
        <div>
            <form onSubmit={handleSearchSubmit}>
                <input type="text" value={query} onChange={handleInputChange} />
            </form>
            
            <div>
                {results.length === 0 ? (
                    <p>Aucun discussion pour le moment</p>
                ) : (
                    results.map((user) => {
                        <div onClick={onUserSelect=(user)}>
                            <p>{user.username}</p>
                            <p>{user.avatar}</p>
                        </div>
                    })
                )}
            </div>
        </div>
    )
}

////////////////////////////////////////////////////////////////////

const chat = () => {
    const [ selectedUser, setSelectedUser ] = useState(null);
    const [ messages, setMessage ] = useState({});

    const handleSelectUser = (user) => {
        setSelectedUser(user);
    }

    const handleSendMessage = (text) => {
        if(!selectedUser || !text.trim()) return;

        setSelectedUser((pre) => {
            const userId = selectedUser._id;
            const userMessage = pre[userId] || [];

            return {
                ...pre,
                [userId]: [ ...userMessage, { text, forMe: true }]
            }
        })
    }

    return (
        <div>
            <Sidebar onUserSelect={handleSelectUser} />

            {selectedUser ? (
                <chatWindow user={selectedUser} messages={messages[ selectedUser._id || []]} onSendMessage={handleSendMessage} />
            ) : (
                <div>
                    <p><a href="#">Envoyer une message</a></p>
                </div>
            )}
        </div>
    )
}

////////////////////////////////////////////////////////////////////////////////////

const ChatWindow = ({ user, messages, onSendMessage }) => {
    const [ message, setMessage ] = useState('');

    const handleInputChange = (e) => {
        const value = e.target.value;
        setMessage(value);
    }

    const handleSend = (e) => {
        if(!message.trim()) return;
        onSendMessage(message);
        setMessage("");
    }

    return(
        <div className={user}>
            { messages.map((msg, idx) => {
              <p key={idx} className={ msg.forMe ? "blue-msg" : "black-msg"}>
                { messages.msg }
              </p>  
            })}
        </div>
    )
}

// import React, { useState } from 'react';
// import { io } from "socket.io-client";
// import './ChatWindow.css';
// import ChatBackground from '../assets/images/chat-background 1.png';

// const socket = io("http://localhost:5000", { transports: ["websocket"] });
// socket.on("connect", () => {
//   console.log("Socket connecté !", socket.id);
// });
// socket.on("connect_error", (err) => {
//   console.error("Erreur de connexion socket.io :", err);
// });

// const ChatWindow = ({ user, messages, onSendMessage }) => {
//   const [message, setMessage] = useState('');

//   const handleInputChange = (e) => {
//     setMessage(e.target.value);
//   };

//   const handleSend = (e) => {
//     e.preventDefault();
//     if (!message.trim()) return;
//     onSendMessage(message);
//     setMessage('');
//   };

//   return (
//     <div className="chat-window">
//       <header className="chat-header">
//         <div className="user-info">
//           <img src={user.avatar || '/default-avatar.png'} alt={user.username} className="user-avatar" />
//           <div className="user-details">
//             <span className="user-name">{user.username}</span>
//             <span className="user-status">
//               <i className="fas fa-circle status-icon"></i>
//               Online
//             </span>
//           </div>
//         </div>
//         <div className="action-icons">
//           <i className="fas fa-video"></i>
//           <i className="fas fa-phone"></i>
//           <i className="fas fa-sliders-h"></i>
//         </div>
//       </header>

//       <main className="chat-messages" style={{ backgroundImage: `url(${ChatBackground})` }} >
//         {messages.map((msg, idx) => (
//           <div key={idx} className={`message-bubble ${msg.fromMe ? 'from-me' : 'from-them'}`} >
//             {msg.text}
//             <span style={{fontSize: "0.8em", color: "#3D3D3D", marginLeft: "20px"}}>{msg.timestamp}</span>
//           </div>
//         ))}
//       </main>

//       <footer className="chat-footer">
//         <div className="footer-icons">
//           <i className="fas fa-image"></i>
//           <i className="far fa-smile"></i>
//         </div>
//         <form onSubmit={handleSend} className="message-form">
//           <input type="text" placeholder="Entrez un message" value={message} onChange={handleInputChange} className="message-input" />
//           <button type="submit" className="send-button">
//             <i className="fas fa-paper-plane"></i>
//           </button>
//         </form>
//       </footer>
//     </div>
//   );
// };

// export default ChatWindow;