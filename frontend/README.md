# Iss'Chat - Frontend React

## 📋 Description

Interface utilisateur moderne et responsive pour l'application de chat en temps réel **Iss'Chat**. Développée avec React et Vite, cette application offre une expérience utilisateur fluide et intuitive.

## 🚀 Technologies utilisées

- **React 19** - Bibliothèque JavaScript pour l'interface utilisateur
- **Vite** - Outil de build rapide
- **React Router DOM** - Navigation entre les pages
- **Socket.io Client** - Communication en temps réel avec le serveur
- **Axios** - Client HTTP pour les requêtes API
- **React Icons** - Icônes modernes
- **Lucide React** - Icônes supplémentaires
- **CSS3** - Styles personnalisés avec animations

## 📁 Structure du projet

```
frontend/
├── public/
│   ├── fav.png              # Favicon
│   ├── manifest.json        # Manifest PWA
│   └── robots.txt           # Configuration SEO
├── src/
│   ├── assets/
│   │   └── images/          # Images et ressources
│   ├── components/
│   │   ├── ChatWindow.jsx   # Composant fenêtre de chat
│   │   ├── Footer.jsx       # Pied de page
│   │   ├── GroupChatWindow.jsx # Chat de groupe
│   │   ├── GroupInfoPanel.jsx  # Panneau info groupe
│   │   ├── Navbar.jsx       # Barre de navigation
│   │   ├── RoomCreateModal.jsx # Modal création room
│   │   ├── RoomJoinModal.jsx    # Modal rejoindre room
│   │   ├── Sidebare.jsx     # Barre latérale
│   │   ├── UserCard.jsx     # Carte utilisateur
│   │   ├── UserDetailModal.jsx # Modal détails utilisateur
│   │   ├── UserProfilePanel.jsx # Panneau profil
│   │   ├── UserSavedMessagesPanel.jsx # Messages sauvegardés
│   │   └── UserSettingsPanel.jsx # Panneau paramètres
│   ├── hooks/
│   │   └── useAuth.js       # Hook d'authentification
│   ├── pages/
│   │   ├── AdminDashboard.jsx # Tableau de bord admin
│   │   ├── chat.jsx         # Page de chat
│   │   ├── Home.jsx         # Page d'accueil
│   │   ├── Login.jsx        # Page de connexion
│   │   ├── NotFound.jsx     # Page 404
│   │   └── Register.jsx     # Page d'inscription
│   ├── services/
│   │   ├── authService.js   # Service d'authentification
│   │   └── socketClient.js  # Client Socket.io
│   ├── utils/
│   │   └── avatarUtils.js   # Utilitaires pour les avatars
│   ├── App.jsx              # Composant principal
│   ├── index.css            # Styles globaux
│   └── main.jsx             # Point d'entrée
├── index.html               # Template HTML
├── package.json             # Dépendances
├── vite.config.js           # Configuration Vite
└── eslint.config.js         # Configuration ESLint
```

## 🛠️ Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration de l'environnement**
   Créer un fichier `.env` à la racine du projet :
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Lancer l'application**
   ```bash
   # Mode développement
   npm run dev
   
   # Build pour production
   npm run build
   
   # Prévisualiser le build
   npm run preview
   ```

## 🎨 Fonctionnalités

### 🔐 Authentification
- **Inscription** - Création de compte avec validation
- **Connexion** - Authentification sécurisée avec JWT
- **Profil utilisateur** - Gestion des informations personnelles
- **Déconnexion** - Sécurisation de la session

### 💬 Chat en temps réel
- **Messages instantanés** - Communication en temps réel
- **Indicateur de frappe** - Voir quand quelqu'un tape
- **Historique des messages** - Conservation des conversations
- **Notifications** - Alertes pour nouveaux messages

### 👥 Gestion des utilisateurs
- **Liste des utilisateurs** - Voir tous les membres
- **Profil détaillé** - Informations complètes des utilisateurs
- **Statut en ligne** - Voir qui est connecté
- **Recherche d'utilisateurs** - Trouver des contacts

### 🏠 Salles de chat (Rooms)
- **Création de rooms** - Créer des espaces de discussion
- **Rejoindre des rooms** - Participer aux conversations
- **Gestion des membres** - Inviter/exclure des utilisateurs
- **Rooms privées/publiques** - Contrôle d'accès

### 🎛️ Administration
- **Tableau de bord admin** - Interface d'administration
- **Gestion des utilisateurs** - Modérer les comptes
- **Statistiques** - Données d'utilisation
- **Signalements** - Gestion des abus

### 📱 Interface responsive
- **Design mobile-first** - Optimisé pour tous les écrans
- **Navigation intuitive** - Interface utilisateur claire
- **Animations fluides** - Expérience utilisateur moderne
- **Thème cohérent** - Design uniforme

## 🎯 Pages principales

### 🏠 Page d'accueil (`/`)
- Présentation de l'application
- Fonctionnalités principales
- Call-to-action pour l'inscription
- Design moderne avec animations

### 🔐 Pages d'authentification
- **Login** (`/login`) - Connexion utilisateur
- **Register** (`/register`) - Inscription nouveau compte

### 💬 Chat (`/chat`)
- Interface de messagerie complète
- Liste des conversations
- Fenêtre de chat en temps réel
- Gestion des rooms

### 👨‍💼 Administration (`/admin`)
- Tableau de bord administrateur
- Gestion des utilisateurs
- Statistiques et rapports

## 🔌 Intégration API

### Services principaux
- **authService.js** - Gestion de l'authentification
- **socketClient.js** - Communication WebSocket

### Endpoints utilisés
- `/api/auth/*` - Authentification
- `/api/users/*` - Gestion des utilisateurs
- `/api/rooms/*` - Gestion des rooms
- `/api/chatroom/*` - Messages de chat

## 🎨 Design System

### Couleurs principales
- **Bleu primaire** - `#3b82f6`
- **Bleu foncé** - `#1d4ed8`
- **Gris clair** - `#f8fafc`
- **Gris moyen** - `#64748b`
- **Blanc** - `#ffffff`

### Typographie
- **Police principale** - Inter, système
- **Titres** - Font-weight: 700-800
- **Corps de texte** - Font-weight: 400-500

### Composants réutilisables
- **Boutons** - Styles cohérents avec états hover
- **Modals** - Fenêtres modales pour les actions
- **Cards** - Cartes d'information
- **Forms** - Formulaires stylisés

## 🚀 Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire pour la production
- `npm run preview` - Prévisualiser le build
- `npm run lint` - Vérifier le code avec ESLint

## 🌐 Configuration

### Variables d'environnement
- `VITE_API_URL` - URL de l'API backend
- `VITE_SOCKET_URL` - URL du serveur Socket.io

### Configuration Vite
- **React Refresh** - Hot reload en développement
- **ESLint** - Linting du code
- **Build optimisé** - Production optimisée

## 📱 Responsive Design

### Breakpoints
- **Mobile** - < 768px
- **Tablet** - 768px - 1024px
- **Desktop** - > 1024px

### Adaptations
- **Navigation** - Menu hamburger sur mobile
- **Chat** - Interface adaptée aux petits écrans
- **Modals** - Plein écran sur mobile
- **Grilles** - Flexbox responsive

## 🔒 Sécurité

- **JWT Storage** - Tokens stockés sécurisés
- **Validation côté client** - Vérification des formulaires
- **Protection des routes** - Accès contrôlé
- **HTTPS** - Communication sécurisée

## 📝 Auteur

**KONE ISSA**

## 📄 Licence

ISC License
