const express = require("express");
const { chatbotController } = require("../controllers/chatbotController");
const router = express.Router();


// Predict Crops
router.post("/ask", chatbotController);

module.exports = router;
