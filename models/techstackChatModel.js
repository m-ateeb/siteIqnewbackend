import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true }
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema({
  clerkUserId: { type: String, required: true },
  mode: { type: String, default: "improve" }, // or whatever your use cases are
  title: { type: String, default: "Untitled Chat" },
  history: [messageSchema],
  improvementResponse: { type: String }, // Optional, for storing raw AI result
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model("Conversation", conversationSchema);
