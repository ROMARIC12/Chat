import { io } from "socket.io-client";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";
const SOCKET_URL = API_URL.replace(/\/api$/, ''); // Enlève /api si présent

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  withCredentials: true,
});

export default socket;