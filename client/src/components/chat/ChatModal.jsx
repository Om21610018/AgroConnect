import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import useHttpClient from "../../hooks/api/useHttpClient";

const ChatModal = ({ isOpen, onClose, sellerId, productId }) => {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const messageContainerRef = useRef(null);
    const { sendRequest } = useHttpClient();

    const roomId = `chat-${productId}-${sellerId}`;

    const getCookieValue = (name) => {
        const value = document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="));
        return value ? decodeURIComponent(value.split("=")[1]) : null;
    };

    useEffect(() => {
        if (isOpen) {
            const fetchMessages = async () => {
                try {
                    const response = await sendRequest(`/api/chat/${roomId}/messages`, "GET", null, {}, false, true);
                    console.log("Fetched messages:", response.data);
                    const messages = response.data || [];
                    setMessages(messages.map((message) => ({ ...message })) || []);
                } catch (error) {
                    console.error("Failed to fetch messages:", error);
                }
            };

            fetchMessages();
        }
    }, [isOpen, sellerId, productId]);

    useEffect(() => {
        if (isOpen) {
            const socketUrl = import.meta.env.VITE_SOCKET_URL;
            const newSocket = io(socketUrl);
            setSocket(newSocket);

            newSocket.emit("joinChatRoom", { roomId: roomId, userType: "user" });

            newSocket.on("receiveChatMessage", (chatMessage) => {
                if (chatMessage.senderType === "user") return;
                setMessages((prev) => [...prev, chatMessage]);
                scrollToBottom(); // Scroll to bottom after receiving a message
            });

            return () => {
                if (newSocket) {
                    newSocket.emit("leaveChatRoom", { roomId: roomId });
                    newSocket.disconnect();
                }
            };
        }
    }, [isOpen, roomId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const scrollToBottom = () => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    };

    const sendMessage = () => {
        if (!socket || !message) return;
        const timestamp = new Date().toLocaleTimeString();
        const newMessage = { roomId: roomId, sender: getCookieValue("userId"), senderType: "user", message, timestamp };
        const participants = [getCookieValue("userId"), sellerId];
        socket.emit("sendChatMessage", { ...newMessage, participants });
        setMessages((prev) => [...prev, newMessage]);
        setMessage("");
        scrollToBottom(); // Scroll to bottom after sending a message
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && message.trim() !== "") {
            sendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h2 className="text-lg font-semibold">Chat with Seller</h2>
                    <button
                        onClick={onClose}
                        className="text-red-500 hover:text-red-700 font-bold"
                    >
                        Close
                    </button>
                </div>
                <div
                    className="flex flex-col space-y-3 overflow-y-auto max-h-64 p-2 bg-gray-50 rounded-lg shadow-inner"
                    ref={messageContainerRef}
                >
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex w-full ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`p-3 rounded-xl max-w-[75%] flex flex-col shadow ${msg.senderType === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-emerald-100 text-emerald-900"
                                    }`}
                            >
                                {/* Sender label */}
                                <div className="text-xs font-semibold opacity-80 mb-1">
                                    {msg.senderType === "user" ? "You" : "Seller"}
                                </div>

                                {/* Message content */}
                                <div className="text-sm leading-snug break-words">{msg.message}</div>

                                {/* Timestamp */}
                                <div
                                    className={`text-[10px] mt-1 self-end ${msg.senderType === "user" ? "text-blue-200" : "text-emerald-500"
                                        }`}
                                >
                                    {msg.timestamp}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div ref={messagesEndRef} />
                </div>

                <div className="mt-4 flex items-center space-x-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message"
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                    <button
                        onClick={sendMessage}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;
