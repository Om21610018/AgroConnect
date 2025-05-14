const Chat = require("../models/chatSchema");
const Product = require("../models/productSchema"); // Import the Product model

// Fetch active chats for a seller
exports.getActiveChats = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const activeChats = await Chat.find({
            participants: sellerId,
        })
            .select("-messages") // Exclude the messages field
            .populate({
                path: "participants",
                select: "name",
                model: "users",
            });

        res.status(200).json(activeChats || []);
    } catch (error) {
        console.error("Error fetching active chats:", error);
        res.status(500).json({ message: "Failed to fetch active chats" });
    }
};

// fetch chat messages for a specific room
exports.getChatMessages = async (req, res) => {
    try {
        console.log("Fetching chat messages for roomId:", req.params.roomId);
        const { roomId } = req.params;
        const chat = await Chat.findOne({ roomId });
        if (!chat) {
            return res.status(200).json([]); // Return empty array if no chat is found
        }
        res.status(200).json(chat.messages || []);
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        res.status(500).json({ message: "Failed to fetch chat messages" });
    }
};

// Fetch details for multiple products by their productIds
exports.getProductsByIds = async (req, res) => {
    try {
        const { productIds } = req.body; // Expecting an array of productIds in the request body

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({ message: "Invalid or empty productIds array" });
        }

        const products = await Product.find({ _id: { $in: productIds } }).select(
            "name category description pricePerUnit minimumOrderQuantity quantity"
        );

        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products by IDs:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

// fetch active chats for a user
exports.getActiveChatsForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const activeChats = await Chat.find({
            participants: userId,
        })
            .select("-messages") // Exclude the messages field
            .populate({
                path: "participants",
                select: "name",
                model: "sellers",
            });


        res.status(200).json(activeChats || []);
    } catch (error) {
        console.error("Error fetching active chats:", error);
        res.status(500).json({ message: "Failed to fetch active chats" });
    }
};