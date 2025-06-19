// routes/techstackChatRoutes.js
import express from "express";
import { handleImproveChat, getMessagesByConversation } from "../controllers/techstackChatController.js";
import mockClerkAuth from "../middleware/testclerkauth.js"; // Mock authentication middleware

const router = express.Router();

// Use the mockClerkAuth middleware to authenticate users
router.use(mockClerkAuth);

// Route to handle chat improvement (send message and get AI reply)
router.post("/chat", handleImproveChat);

// Route to fetch messages by conversationId
router.get("/chat/:conversationId", getMessagesByConversation);

export default router;
