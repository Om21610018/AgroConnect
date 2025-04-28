const Negotiation = require("../models/negotiationSchema");

// Add a new negotiation (user sends offer)
const addNegotiation = async (req, res) => {
  try {
    const { userId, sellerId, productId, actualPrice, negotiatedPrice,email } = req.body;

    if (!userId || !sellerId || !productId || !actualPrice || !negotiatedPrice) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Only one pending negotiation per user/product/seller
    const existing = await Negotiation.findOne({
      userId,
      sellerId,
      email,
      productId,
      status: "pending",
    });

    if (existing) {
      return res.status(409).json({ message: "Negotiation already pending" });
    }

    const negotiation = new Negotiation({
      userId,
      sellerId,
      productId,
      email,
      actualPrice,
      negotiatedPrice,
      status: "pending",
    });

    await negotiation.save();
    res.status(201).json({ message: "Negotiation submitted", negotiation });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong!" });
    console.log(error);
  }
};

// Accept or reject a negotiation (seller action)
const updateNegotiationStatus = async (req, res) => {
    try {
      const { negotiationId } = req.params;
      const { status } = req.body; // "accepted" or "rejected"
  
      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
  
      const negotiation = await Negotiation.findByIdAndUpdate(
        negotiationId,
        { status },
        { new: true }
      );
  
      if (!negotiation) {
        return res.status(404).json({ message: "Negotiation not found" });
      }
  
      res.status(200).json({ message: `Negotiation ${status}`, negotiation });
    } catch (error) {
      res.status(500).json({ message: "Something went wrong!" });
      console.log(error);
    }
  };


// Get all negotiations (for seller dashboard)
const getAllNegotiations = async (req, res) => {
    try {
        // Extract email from cookies
        const email = req.query.email;;
        if (!email) {
            return res.status(400).json({ message: "Email is required in cookies" });
        }

        // Find negotiations specific to the email
        const negotiations = await Negotiation.find()
            .populate({ path: "userId", select: "name email" })
            .populate({ path: "productId", select: "name" });


        res.status(200).json({ negotiations });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong!" });
        console.log(error);
    }
};

module.exports = {
  addNegotiation,
  updateNegotiationStatus,
  getAllNegotiations,
};