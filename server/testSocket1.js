const { io } = require("socket.io-client");

const socket = io("http://localhost:8000");

socket.on("connect", () => {
    console.log("Connected to server");

    socket.emit("joinRoom", "room1");

    socket.emit("sendMessage", {
        roomId: "room1",
        message: "Hello from second client!"
    });

});

socket.on("receiveMessage", (msg) => {
    console.log("Received message:", msg);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});

socket.on("connect_error", (err) => {
    console.error("Connection error:", err.message);
});
