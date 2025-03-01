// Connect to MongoDB
const mongoose = require("mongoose");

const mediaSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, enum: ["image", "video"], required: true },
  filePath: { type: String, required: true },
});

const productSchema = new mongoose.Schema({
  image: { type: String, required: true },
  media: [mediaSchema], // New field added
  brand: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  pricePerUnit: { type: Number, required: true },
  measuringUnit: { type: String, required: true },
  minimumOrderQuantity: { type: Number, required: true },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  quantity: { type: Number, required: true },
  shelfLife: { type: String, required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "sellers" },
  date: { type: Date, default: Date.now },
});

// Add index for efficient search
productSchema.index({ category: 1, sellerId: 1 });

module.exports =
  mongoose.models.products || mongoose.model("products", productSchema);
