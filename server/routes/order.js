const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyAccessToken = require('../middlewares/verifyAccessToken');

// Add Order Item
router.post("/", verifyAccessToken, orderController.addOrder);

// Retrieve Order Item according to Seller Id
router.get("/", verifyAccessToken, orderController.showOrdersBySeller);

// Retrieve Orders by User ID or Email
router.get("/user", orderController.showOrdersByUser);
// Example for routes/order.js
router.patch("/orderStatusUpdate", orderController.updateOrderStatus);

module.exports = router;