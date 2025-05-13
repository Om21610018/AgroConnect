import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import useHttpClient from "../../hooks/api/useHttpClient";

const ChatRoom = () => {
    const [socket, setSocket] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const { sendRequest } = useHttpClient();
    const [authInfo, setAuthInfo] = useState({ userType: null, selfId: null });
    const lastFetchedType = useRef(null);
    const currentRoomId = useRef(null);

    const getCookieValue = (name) => {
        const value = document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="));
        return value ? decodeURIComponent(value.split("=")[1]) : null;
    };

    const getAuthFromCookies = () => {
        const userToken = getCookieValue("user_access_token");
        const sellerToken = getCookieValue("seller_access_token");

        if (userToken) {
            return { userType: "user", selfId: getCookieValue("userId") || null };
        } else if (sellerToken) {
            return { userType: "seller", selfId: getCookieValue("userId") || null };
        }
        return { userType: null, selfId: null };
    };

    useEffect(() => {
        const auth = getAuthFromCookies();
        setAuthInfo(auth);
    }, []);

    useEffect(() => {
        const newSocket = io("http://localhost:8000");
        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        const { userType, selfId } = authInfo; // Ensure selfId is destructured from authInfo
        console.log("Auth Info:", authInfo); // Debugging log to verify authInfo

        if (!socket || !selfId) return;

        const handleReceiveMessage = (chatMessage) => {
            console.log("Received message:", chatMessage); // Debugging log to verify received message
            if (chatMessage.sender === authInfo.selfId) return; // skip self messages
            setMessages((prev) => [...prev, chatMessage]);
        };

        socket.on("receiveChatMessage", handleReceiveMessage);

        return () => {
            socket.off("receiveChatMessage", handleReceiveMessage);
        };
    }, [socket, authInfo]);

    useEffect(() => {
        const fetchContacts = async () => {
            const { userType } = authInfo;
            if (!userType || lastFetchedType.current === userType) return;
            try {
                const endpoint = userType === "user" ? "/api/contacts/sellers" : "/api/contacts/users";
                const response = await sendRequest(endpoint, "GET", null, {}, false, true);
                const contactsData = response.data;
                setContacts(Array.isArray(contactsData) ? contactsData : []);
                lastFetchedType.current = userType;
            } catch (error) {
                console.error("Failed to fetch contacts:", error);
                setContacts([]);
            }
        };
        fetchContacts();
    }, [authInfo]);

    const getRoomId = (contact) => {
        const { userType, selfId } = authInfo;
        if (!contact?.id || !selfId) return null;
        const userId = userType === "user" ? selfId : contact.id;
        const sellerId = userType === "seller" ? selfId : contact.id;
        return `chat-${[userId, sellerId].sort().join("-")}`;
    };

    const joinRoom = (contact) => {
        const roomId = getRoomId(contact);
        if (socket && roomId) {
            setSelectedContact(contact);
            currentRoomId.current = roomId;
            socket.emit("joinChatRoom", { roomId, userType: authInfo.userType });
        }
    };

    // leave room when unmounting or when selectedContact changes
    useEffect(() => {
        return () => {
            if (socket && currentRoomId.current) {
                socket.emit("leaveChatRoom", currentRoomId.current);
                currentRoomId.current = null;
            }
        };
    }, [socket, selectedContact]);


    const sendMessage = () => {
        const { selfId } = authInfo;

        // Guard: Must have a message, selectedContact, and joined room
        if (!socket || !message || !selectedContact || !currentRoomId.current) return;

        const timestamp = new Date().toLocaleTimeString();
        const newMessage = {
            roomId: currentRoomId.current,
            sender: selfId,
            message,
            timestamp,
        };

        console.log("Sending message to room:", currentRoomId.current);

        socket.emit("sendChatMessage", newMessage);
        setMessages((prev) => [...prev, newMessage]);
        setMessage("");
    };


    const filteredMessages = messages.filter((msg) => msg.roomId === currentRoomId.current);
    // const filteredMessages = messages;

    return (
        <div style={styles.chatRoom}>
            <div style={styles.sidebar}>
                <h3>Contacts</h3>
                <ul style={styles.contactList}>
                    {contacts.map((contact) => (
                        <li
                            key={contact.id}
                            style={{
                                ...styles.contactItem,
                                backgroundColor: selectedContact?.id === contact.id ? "#4c6e6e" : "transparent",
                                cursor: authInfo.selfId ? "pointer" : "not-allowed",
                                opacity: authInfo.selfId ? 1 : 0.5,
                            }}
                            onClick={() => authInfo.selfId && joinRoom(contact)}
                        >
                            {contact.name}
                        </li>
                    ))}
                </ul>
            </div>

            <div style={styles.chatArea}>
                <div style={styles.header}>
                    {selectedContact ? (
                        <h2>Chat with {selectedContact.name}</h2>
                    ) : (
                        <h2>Select a contact to start chatting</h2>
                    )}
                </div>

                <div style={styles.messages}>
                    {filteredMessages.map((msg, index) => (
                        <div key={`${msg.roomId}-${msg.sender}-${msg.timestamp}-${index}`} style={styles.message}>
                            <strong>{msg.sender}:</strong> {msg.message}{" "}
                            <em style={{ fontSize: "0.8em", color: "#888" }}>({msg.timestamp})</em>
                        </div>
                    ))}
                </div>

                {selectedContact && (
                    <div style={styles.sendMessageSection}>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message"
                            style={styles.input}
                        />
                        <button
                            onClick={sendMessage}
                            style={styles.button}
                        >
                            Send
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    chatRoom: {
        display: "flex",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f4f7fa",
    },
    sidebar: {
        width: "250px",
        backgroundColor: "#2f4f4f",
        color: "white",
        padding: "10px",
        height: "100%",
        overflowY: "auto",
    },
    contactList: {
        listStyleType: "none",
        padding: 0,
    },
    contactItem: {
        padding: "12px",
        borderBottom: "1px solid #444",
        transition: "background-color 0.3s",
    },
    chatArea: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        backgroundColor: "white",
        borderLeft: "1px solid #ddd",
    },
    header: {
        marginBottom: "10px",
    },
    messages: {
        flex: 1,
        overflowY: "auto",
        border: "1px solid #ddd",
        padding: "10px",
        borderRadius: "4px",
        backgroundColor: "#f9f9f9",
        marginBottom: "10px",
    },
    message: {
        marginBottom: "10px",
        padding: "8px",
        backgroundColor: "#eef",
        borderRadius: "6px",
        maxWidth: "75%",
    },
    sendMessageSection: {
        display: "flex",
    },
    input: {
        flex: 1,
        padding: "10px",
        borderRadius: "4px",
        border: "1px solid #ccc",
        marginRight: "10px",
    },
    button: {
        padding: "10px 16px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
};

export default ChatRoom;
