const express = require('express');
const router = express.Router();
const verifyAccessToken = require('../middlewares/verifyAccessToken');

const negotiationController = require("../controllers/negotiationController");
router.post("/", negotiationController.addNegotiation);
router.patch("/:negotiationId", negotiationController.updateNegotiationStatus);
router.get("", negotiationController.getAllNegotiations);

module.exports = router;
