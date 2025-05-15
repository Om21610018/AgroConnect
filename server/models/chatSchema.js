const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        roomId: { type: String, required: true },
        participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        messages: [
            {
                sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                message: { type: String, required: true },
                senderType: { type: String, enum: ["user", "seller"], required: true },
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
