import React, { useState, useEffect, useRef } from "react";
import socket from "../../utils/socket";
import useHttpClient from "../../hooks/api/useHttpClient";
import useChatSocket from "../../hooks/useChatSocket";
import ActiveChatList from "./ActiveChatList";
import { fetchProductDetails } from "../../utils/chatUtils";

const ChatRoom = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const { sendRequest } = useHttpClient();
    const currentRoomId = useRef(null);
    const [activeChats, setActiveChats] = useState([]); // List of active chats for sellers
    const messageContainerRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");

    const getCookieValue = (name) => {
        const value = document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="));
        return value ? decodeURIComponent(value.split("=")[1]) : null;
    };

    const fetchProductIdsFromActiveChats = (activeChats) => {
        return activeChats.map((chat) => {
            const productId = chat.roomId.split('-')[1]; // Extract productId from roomId
            return productId;
        });
    };

    useEffect(() => {
        const fetchActiveChats = async () => {
            try {
                const response = await sendRequest(`/api/chat/active/${getCookieValue("userId")}`, "GET", null, {}, false, true);
                const productIds = fetchProductIdsFromActiveChats(response.data || []);
                const productDetails = await fetchProductDetails(sendRequest, productIds);

                // Map product details to active chats
                const updatedChats = (response.data || []).map((chat) => {
                    const productId = chat.roomId.split('-')[1];
                    const productDetail = productDetails.find((product) => product._id === productId);
                    return { ...chat, productDetail };
                });

                // Sort chats by most recent activity
                const sortedChats = (updatedChats || []).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

                setActiveChats(updatedChats);
            } catch (error) {
                console.error("Failed to fetch active chats:", error);
            }
        };
        fetchActiveChats();

    }, [socket, sendRequest]);

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        const handleNewMessageNotification = ({ roomId, message, senderType }) => {
            console.log("New message notification received for room:", roomId, "message:", message);

            // Only set hasNewMessage to true if the sender is not the seller
            if (senderType !== "seller") {
                setActiveChats((prev) => {
                    return prev.map((chat) => {
                        if (chat.roomId === roomId) {
                            return { ...chat, hasNewMessage: true };
                        }
                        return chat;
                    });
                });
            }
        };

        socket.on("newMessageNotification", handleNewMessageNotification);

        return () => {
            socket.off("newMessageNotification", handleNewMessageNotification);
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        const handleReceiveChatMessage = (chatMessage) => {
            console.log("Received chat message:", chatMessage);
            if (chatMessage.senderType === "seller") return; // Ignore messages from the seller
            setMessages((prev) => [...prev, chatMessage]);
            if (messageContainerRef.current) {
                messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
            }
        };

        socket.on("receiveChatMessage", handleReceiveChatMessage);

        return () => {
            socket.off("receiveChatMessage", handleReceiveChatMessage);
        };
    }, [socket]);

    const handleSelectChat = async (chat) => {
        try {
            if (socket) {
                socket.emit("leaveChatRoom", { roomId: currentRoomId.current });
            }

            currentRoomId.current = chat.roomId;
            setSelectedChat(chat);

            // Reset the hasNewMessage property for the selected chat
            setActiveChats((prev) =>
                prev.map((c) =>
                    c.roomId === chat.roomId ? { ...c, hasNewMessage: false } : c
                )
            );

            // Notify the navbar about the change
            socket.emit("chatOpened", { roomId: chat.roomId });

            // Fetch messages for the selected chat room
            const response = await sendRequest(`/api/chat/${chat.roomId}/messages`, "GET", null, {}, false, true);
            setMessages(response.data || []);

            socket.emit("joinChatRoom", { roomId: chat.roomId });

            // Auto-scroll to the bottom of the chat area
            if (messageContainerRef.current) {
                messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
            }
        } catch (error) {
            console.error("Failed to fetch messages for the selected chat room:", error);
        }
    };

    const sendMessage = () => {
        const roomId = currentRoomId.current;
        if (!socket || !message || !roomId) return;
        const userId = getCookieValue('userId');
        const timestamp = new Date().toLocaleTimeString();
        const participants = [userId, ...(selectedChat?.participants?.map(p => p._id) || [])];
        const newMessage = { roomId, sender: userId, senderType: "seller", message, timestamp };
        socket.emit("sendChatMessage", { ...newMessage, participants });
        setMessages((prev) => [...prev, newMessage]);
        setMessage("");

        // Auto-scroll to the bottom of the chat area
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && message.trim() !== "") {
            sendMessage();
        }
    };

    useChatSocket(socket, setActiveChats);

    const filteredChats = activeChats.filter((chat) => {
        const productDetail = chat.productDetail || {};
        const participantNames = chat.participants.map((p) => p.name).join(", ");
        const searchFields = [
            participantNames,
            productDetail.name,
            productDetail.category,
            productDetail.description,
            productDetail.quantity?.toString(),
            productDetail.minimumOrderQuantity?.toString(),
        ];
        return searchFields.some((field) =>
            field?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <div className="flex h-[95vh] font-sans bg-gray-100">
            {/* Sidebar */}
            <div className="w-80 bg-gray-900 text-white p-5 space-y-4 shadow-md">
                <h3 className="text-xl font-bold">💬 Active Chats</h3>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product details..."
                    className="w-full p-2 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="overflow-y-auto h-[75vh] pr-1">
                    <ActiveChatList
                        filteredChats={filteredChats}
                        handleSelectChat={handleSelectChat}
                        selectedChat={selectedChat}
                    />
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col p-6 bg-white border-l border-gray-300">
                {/* Chat Header */}
                <div className="mb-4 border-b pb-2">
                    {selectedChat ? (
                        <h2 className="text-2xl font-semibold text-gray-800">Chat with <span className="text-blue-600">{selectedChat.participants.map(p => p.name).join(", ")}</span></h2>
                    ) : (
                        <h2 className="text-2xl font-semibold text-gray-500">Select a contact to start chatting</h2>
                    )}
                </div>

                {/* Message Area */}
                <div
                    className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg shadow-inner"
                    ref={messageContainerRef}
                >
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex w-full ${msg.senderType === "seller" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`p-3 rounded-xl max-w-[75%] flex flex-col shadow ${msg.senderType === "seller"
                                    ? "bg-blue-600 text-white"
                                    : "bg-emerald-100 text-emerald-900"
                                    }`}
                            >
                                {/* Sender label */}
                                <div className="text-xs font-semibold opacity-80 mb-1">
                                    {msg.senderType === "seller" ? "Seller (You)" : "Buyer"}
                                </div>

                                {/* Message content */}
                                <div className="text-sm leading-snug break-words">{msg.message}</div>

                                {/* Timestamp */}
                                <div className={`text-[10px] mt-1 self-end ${msg.senderType === "seller" ? "text-blue-200" : "text-emerald-500"
                                    }`}>
                                    {msg.timestamp}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


                {/* Message Input */}
                {selectedChat && (
                    <div className="flex mt-4 items-center space-x-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                        />
                        <button
                            onClick={sendMessage}
                            className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>

    );
};

export default ChatRoom;
