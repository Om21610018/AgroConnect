import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import useHttpClient from "../../hooks/api/useHttpClient";
import axios from "axios";
import { FiRefreshCw, FiX } from "react-icons/fi";

const ChatModal = ({
  isOpen,
  onClose,
  sellerId,
  productId,
  productDetails,
}) => {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [suggestionSeed, setSuggestionSeed] = useState(0);
  const [aiSuggestions, setAiSuggestions] = useState([]); // For Gemini suggestions
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const messagesEndRef = useRef(null);
  const messageContainerRef = useRef(null);
  const { sendRequest } = useHttpClient();
  console.log("Product Details:", productDetails);

    // Removed duplicate declaration of roomId

    const getCookieValue = (name) => {
        const value = document.cookie
            .split("; ")
            .find((row) => row.startsWith(name + "="));
        return value ? decodeURIComponent(value.split("=")[1]) : null;
    };

    const roomId = `chat-${productId}-${sellerId}-${getCookieValue("userId")}`;

  useEffect(() => {
    if (isOpen) {
      const fetchMessages = async () => {
        try {
          const response = await sendRequest(
            `/api/chat/${roomId}/messages`,
            "GET",
            null,
            {},
            false,
            true
          );
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
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch AI negotiation suggestions from Gemini
  useEffect(() => {
    const fetchAiSuggestions = async () => {
      if (!productDetails) return;
      setLoadingSuggestions(true);
      try {
        // Replace YOUR_GEMINI_API_KEY with your actual Gemini API key
        const apiKey = "AIzaSyB5DR_Re8o4HU-zuZM39JLtWfRvb-cr3z8";
        // Optionally, include the latest chat message to personalize suggestions
        const latestMessage =
          messages.length > 0 ? messages[messages.length - 1].message : "";
        const prompt = `Suggest 3 polite short negotiation statements for a buyer to negotiate the price (atleast one statement must contain price) of the following product:\n\nProduct Name: ${
          productDetails.name
        }\nDescription: ${productDetails.description}\nCurrent Price: Rs. ${
          productDetails.pricePerUnit
        } per ${productDetails.measuringUnit}\n${
          latestMessage ? `Previous chat message: "${latestMessage}"\n` : ""
        }Statements and just give 3 statements nothing else dont add any variables like this[slightly lower price].`;
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }
        );
        // Parse Gemini response for suggestions
        const text =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Split into 3 statements (assuming Gemini returns them as a list)
        const suggestions = text
          .split("\n")
          .map((s) => s.replace(/^\d+\.\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 3)
          .map((s) => s.replace(/^"(.*)"$/, "$1")); // Remove surrounding quotes if present
        setAiSuggestions(suggestions);
      } catch (err) {
        setAiSuggestions([]);
      }
      setLoadingSuggestions(false);
    };
    if (isOpen) fetchAiSuggestions();
    // eslint-disable-next-line
  }, [isOpen, productDetails, suggestionSeed]);

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  };

  const sendMessage = () => {
    if (!socket || !message) return;
    const timestamp = new Date().toLocaleTimeString();
    const newMessage = {
      roomId: roomId,
      sender: getCookieValue("userId"),
      senderType: "user",
      message,
      timestamp,
    };
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
  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className=" z-100 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-semibold text-black">Chat with Seller</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 p-1 rounded-full focus:outline-none"
            title="Close"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* AI Negotiation Suggestions */}
        <div className="mb-3">
          <div className="flex items-center mb-1">
            <span className="text-xs text-gray-500 mr-2">
              AI Negotiation Suggestions:
            </span>
            <button
              type="button"
              title="Refresh Suggestions"
              className="text-blue-500 hover:text-blue-700 p-1"
              onClick={() => setSuggestionSeed((s) => s + 1)}
              disabled={loadingSuggestions}
            >
              <FiRefreshCw
                className={`inline ${loadingSuggestions ? "animate-spin" : ""}`}
              />
            </button>
          </div>
          {loadingSuggestions ? (
            <div className="text-gray-400 text-xs">Loading suggestions...</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200"
                  onClick={() => setMessage(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ...rest of your chat UI... */}
        <div
          className="flex flex-col space-y-3 overflow-y-auto max-h-64 p-2 bg-gray-50 rounded-lg shadow-inner"
          ref={messageContainerRef}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex w-full ${
                msg.senderType === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-xl max-w-[75%] flex flex-col shadow ${
                  msg.senderType === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-emerald-100 text-emerald-900"
                }`}
              >
                <div className="text-xs font-semibold opacity-80 mb-1">
                  {msg.senderType === "user" ? "You" : "Seller"}
                </div>
                <div className="text-sm leading-snug break-words">
                  {msg.message}
                </div>
                <div
                  className={`text-[10px] mt-1 self-end ${
                    msg.senderType === "user"
                      ? "text-blue-200"
                      : "text-emerald-500"
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
