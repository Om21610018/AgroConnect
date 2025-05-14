import { useEffect } from "react";
import { fetchProductDetails, fetchParticipants } from "../utils/chatUtils";

/**
 * Custom hook to manage socket events for chats.
 * @param {Object} socket - Socket instance.
 * @param {Function} setActiveChats - State updater for active chats.
 */
const useChatSocket = (socket, setActiveChats) => {
    useEffect(() => {
        if (!socket) return;

        const handleNewActiveChat = async (newChat) => {
            try {
                const productId = newChat.roomId.split("-")[1];
                const [productDetail] = await fetchProductDetails([productId]);
                const participants = await fetchParticipants(newChat.roomId);

                const updatedChat = { ...newChat, productDetail, participants };

                setActiveChats((prev) => {
                    if (prev.some((chat) => chat._id === newChat._id)) {
                        return prev;
                    }
                    return [...prev, { ...updatedChat, newMessageCount: 1 }];
                });
            } catch (error) {
                console.error("Failed to handle new active chat:", error);
            }
        };

        socket.on("newActiveChat", handleNewActiveChat);

        return () => {
            socket.off("newActiveChat", handleNewActiveChat);
        };
    }, [socket, setActiveChats]);
};

export default useChatSocket;
