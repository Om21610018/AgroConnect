import React from "react";

/**
 * Component to render the list of active chats.
 * @param {Array} filteredChats - List of filtered chats.
 * @param {Function} handleSelectChat - Function to handle chat selection.
 * @param {Object} selectedChat - Currently selected chat.
 */
const ActiveChatList = ({ filteredChats, handleSelectChat, selectedChat }) => {
    return (
        <ul className="space-y-2">
            {filteredChats.map((chat) => (
                <li
                    key={chat._id}
                    className={`p-3 rounded cursor-pointer transition-colors ${selectedChat?.roomId === chat.roomId ? "bg-teal-600" : "hover:bg-gray-700"
                        }`}
                    onClick={() => handleSelectChat(chat)}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="font-bold">
                                Buyer : {chat.participants.map((p) => p.name).join(", ") || "Unknown"}
                            </div>
                            {chat.productDetail && (
                                <div className="text-sm text-gray-400">
                                    <span className="font-bold">Product:</span> {chat.productDetail.name} - {chat.productDetail.category} (Quantity: {chat.productDetail.quantity}, Minimum Order: {chat.productDetail.minimumOrderQuantity})
                                </div>
                            )}
                        </div>
                        {chat.hasNewMessage && (
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                <span className="ml-2 text-sm text-red-500">{chat.newMessageCount || 1}</span>
                            </div>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default ActiveChatList;
