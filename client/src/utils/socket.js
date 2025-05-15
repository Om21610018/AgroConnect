import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL;
const socket = io(socketUrl);

export default socket;
