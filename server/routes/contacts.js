const express = require("express");
const router = express.Router();
const authModelSelector = require("../services/authServices").authModelSelector;

// Get all users (for sellers)
router.get("/users", async (req, res) => {
    try {
        const User = authModelSelector("user", res);
        const users = await User.find({}, "_id name");
        const formattedUsers = users.map((user) => ({ id: user._id, name: user.name, type: "user" }));
        res.json(formattedUsers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Get all sellers (for users)
router.get("/sellers", async (req, res) => {
    try {
        const Seller = authModelSelector("seller", res);
        const sellers = await Seller.find({}, "_id name");
        const formattedSellers = sellers.map((seller) => ({ id: seller._id, name: seller.name, type: "seller" }));
        res.json(formattedSellers);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch sellers" });
    }
});

module.exports = router;
