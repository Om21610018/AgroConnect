import React, { useEffect, useState } from "react";
import useHttpClient from "../../hooks/api/useHttpClient";
import { fetchProductDetails } from "../../utils/chatUtils";
import ChatModal from "../../components/chat/ChatModal";

const OpenUserChatsList = () => {
  const [chats, setChats] = useState([]);
  const { sendRequest } = useHttpClient();
  const [showChatModal, setShowChatModal] = useState(false); // State to control chat modal visibility
  const [activeChatId, setActiveChatId] = useState(null);

  const handleOpenChat = (roomId) => {
    setActiveChatId(roomId);
    setShowChatModal(true);
  };

  const handleCloseChat = () => {
    setShowChatModal(false);
    setActiveChatId(null);
  };

  // Function to get the value of a cookie by name
  const getCookieValue = (name) => {
    const value = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return value ? decodeURIComponent(value.split("=")[1]) : null;
  };
  const userId = getCookieValue("userId");

  const fetchProductIdsFromActiveChats = (activeChats) => {
    return activeChats.map((chat) => {
      const productId = chat.roomId.split("-")[1]; // Extract productId from roomId
      return productId;
    });
  };

  // Fetch active chats for the user
  useEffect(() => {
    const fetchChats = async () => {
      const response = await sendRequest(
        `/api/chat/user/${userId}/activeChats`,
        "GET",
        null,
        {},
        false,
        true
      );
      const productIds = fetchProductIdsFromActiveChats(response.data || []);
      const productDetails = await fetchProductDetails(sendRequest, productIds);

      // Map product details to active chats
      const updatedChats = (response.data || []).map((chat) => {
        const productId = chat.roomId.split("-")[1];
        const productDetail = productDetails.find(
          (product) => product._id === productId
        );
        return { ...chat, productDetail };
      });

      console.log("Updated Chats:", updatedChats);

      // Sort chats by most recent activity
      const sortedChats = (updatedChats || []).sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      setChats(sortedChats);
    };

    fetchChats();
  }, []);

  if (!chats || chats.length === 0) {
    return (
      <div className="p-4 text-gray-600 text-sm">
        No active chats available.
      </div>
    );
  }

  return (
    <div className="w-100 bg-gray-900 text-white p-5 space-y-4 shadow-md">
      <h3 className="text-xl font-bold">💬 Active Chats</h3>

      <div className="overflow-y-auto h-[75vh] pr-1">
        <ul className="space-y-2">
          {chats.map((chat) => {
            const isActive = activeChatId === chat.roomId;
            return (
              <li key={chat._id}>
                <button
                  onClick={() => handleOpenChat(chat.roomId)}
                  className={`w-full text-left px-4 py-3 rounded transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-700 text-white"
                      : "bg-gray-800 text-blue-400 hover:bg-gray-700"
                  }`}
                >
                  <div className="font-medium">
                    Chat with {chat.participants[0]?.name || "Seller"}
                  </div>
                  {chat.productDetail && (
                    <div className="text-sm text-gray-400 mt-1">
                      Product: {chat.productDetail.name || "N/A"} —{" "}
                      {chat.productDetail.category || "N/A"}
                      <br />
                      Quantity: {chat.productDetail.quantity || "N/A"}, Min
                      Order: {chat.productDetail.minimumOrderQuantity || "N/A"}
                    </div>
                  )}
                </button>

                {/* Only render modal if this tab is active and modal is open */}
                {isActive && showChatModal && (
                  <ChatModal
                    isOpen={showChatModal}
                    onClose={handleCloseChat}
                    sellerId={chat.participants[0]?._id}
                    productId={chat.productDetail?._id}
                    productDetails={chat.productDetail} // Pass product details here
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default OpenUserChatsList;
