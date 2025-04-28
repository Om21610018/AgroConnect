const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "products",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "users"
  },
  orderQty: {
    type: Number,
    required: true,
  },
  orderLocation: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "sellers",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "delivered", "cancelled"],
    default: "pending",
  },
});

orderSchema.index({ sellerId: 1 });

module.exports = mongoose.model("orders", orderSchema);