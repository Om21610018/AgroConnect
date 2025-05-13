const Product = require("../models/productSchema");

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
    socket.on("sendChatMessage", ({ roomId, sender, message }) => {
      const chatMessage = { sender, message, timestamp: new Date() };
      io.to(roomId).emit("receiveChatMessage", chatMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
      changeStream.close(); // Optional: clean up change stream
    });
  });
}

module.exports = { setupWebSocket };
