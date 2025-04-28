require("dotenv").config();
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create an order
const createOrder = async (req, res) => {
    try {
        const { amount } = req.body; // Amount in INR
        const options = {
            amount: amount * 100, // Convert to paise
            currency: "INR",
            receipt: `order_rcptid_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
};

// Verify the payment
const verifyPayment = (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Generate HMAC using Razorpay key secret
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest("hex");

        if (generatedSignature === razorpay_signature) {
            res.json({ success: true, message: "Payment verified successfully!" });
        } else {
            res.status(400).json({ success: false, message: "Payment verification failed!" });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Payment verification error" });
    }
};

module.exports = { createOrder, verifyPayment };
