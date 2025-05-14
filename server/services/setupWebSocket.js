const Product = require("../models/productSchema");
const Chat = require("../models/chatSchema"); // Ensure Chat model is imported
const mongoose = require("mongoose"); // Import mongoose for ObjectId conversion

function setupWebSocket(io) {
  io.on("connection", (socket) => {
    console.log("A user connected");

    const changeStream = Product.watch();

    changeStream.on("change", (change) => {
      if (
        change.operationType === "update" &&
        change.updateDescription.updatedFields &&
        change.updateDescription.updatedFields.quantity
      ) {
        socket.emit(
          "stockUpdate",
          change.updateDescription.updatedFields.quantity
        );
      }
    });

    const chatChangeStream = Chat.watch();

    chatChangeStream.on("change", (change) => {
      if (change.operationType === "insert") {
        const newChat = change.fullDocument;
        console.log("Emitting newActiveChat event for:", newChat);

        // Emit only if the chat is not already emitted
        io.emit("newActiveChat", newChat);
      }
    });

    // ✅ Correctly scoped socket event handlers
    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      console.log(`User joined room: ${roomId}`);
    });

    socket.on("sendMessage", ({ roomId, message }) => {
      io.to(roomId).emit("receiveMessage", message);
    });

    // Handle joining a chat room
    socket.on("joinChatRoom", ({ roomId, userType }) => {
      socket.join(roomId);
      console.log(`${userType} joined room: ${roomId}`);
    });

    // Handle sending messages in a chat room
    socket.on("sendChatMessage", async ({ roomId, sender, senderType, message, participants }) => {
      const timestamp = new Date();

      const senderValue = new mongoose.Types.ObjectId(sender); // Convert sender to ObjectId

      const chatMessage = { sender: senderValue, message, senderType, timestamp };

      try {
        // Save the message to the database
        const updatedChat = await Chat.findOneAndUpdate(
          { roomId },
          {
            $push: { messages: chatMessage },
            $addToSet: { participants: { $each: participants.map((p) => new mongoose.Types.ObjectId(p)) } },
          },
          { new: true, upsert: true }
        );

        // Debugger to verify chat storage
        console.log("Updated Chat:", updatedChat);

        // Emit the message to all clients in the room
        io.to(roomId).emit("receiveChatMessage", chatMessage);

        // Emit a notification for new messages
        console.log("Emitting newMessageNotification for room:", roomId, "message:", message);
        io.emit("newMessageNotification", { roomId, message, senderType });
      } catch (error) {
        console.error("Error saving chat message:", error);
      }
    });

    // Handle leaving a chat room
    socket.on("leaveChatRoom", ({ roomId }) => {
      socket.leave(roomId);
      console.log(`User left room: ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
      changeStream.close(); // Optional: clean up change stream
      chatChangeStream.close(); // Optional: clean up change stream
    });
  });
}

module.exports = { setupWebSocket };
