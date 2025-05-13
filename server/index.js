require("./config/connectDB.js");
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data"); // Correct import

const PORT = 8000;
const app = express();

const corsOptions = {
  origin: ["https://localhost:5173"], // Add your frontend URL here
  credentials: true, // Allow credentials
};

app.use(cors(corsOptions));
const { setupWebSocket } = require("./services/setupWebSocket");

const product = require("./routes/product");
const review = require("./routes/review");
const order = require("./routes/order");
const faq = require("./routes/faq");
const graph = require("./routes/graph.js");
const ai = require("./routes/ai.js");
const auth = require("./routes/auth");
const chatbot = require("./routes/chatbot.js");
const payment = require("./routes/payment.js");
const negotiation = require("./routes/negotiation.js");
const contacts = require("./routes/contacts");

app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://localhost:5173"], // Add your frontend URL here
    credentials: true, // Allow credentials
  },
});

setupWebSocket(io);

// Health Check
app.get("/", (req, res) => {
  res.send("CropConnect Server is running");
});

// Routes
app.use("/auth", auth);
app.use("/products", product);
app.use("/reviews", review);
app.use("/order", order);
app.use("/faqs", faq);
app.use("/graph", graph);
app.use("/ai", ai);
app.use("/chatbot", chatbot);
app.use("/payment", payment);
app.use("/negotiation", negotiation);
app.use("/api/contacts", contacts);

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
