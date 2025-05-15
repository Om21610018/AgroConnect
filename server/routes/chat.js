const express = require("express");
const router = express.Router();
const { getActiveChats, getChatMessages,
    getProductsByIds, getActiveChatsForUser } = require("../controllers/chatController");
const verifyAccessToken = require("../middlewares/verifyAccessToken");

// Route to fetch active chats for a specific seller
router.get("/active/:sellerId", verifyAccessToken, getActiveChats);

// Route to fetch messages for a specific room
router.get("/:roomId/messages", verifyAccessToken, getChatMessages);

// Route to fetch product details by productId
router.post("/allActiveChatProducts", verifyAccessToken, getProductsByIds);

// Route to fetch active chats for a specific user
router.get("/user/:userId/activeChats", verifyAccessToken, getActiveChatsForUser);

module.exports = router;
