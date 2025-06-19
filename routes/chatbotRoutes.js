import express from 'express';
const router = express.Router();
import chatWithWebsite from "../controllers/chatbotController";
import getChatHistory  from "../controllers/chatbotController";
import authenticateUserByClerkId from "../middleware/authenticateUserByClerkId.js";

// 💬 Chat with the AI about a website (Process user queries)
router.post("/chat", authenticateUserByClerkId, chatWithWebsite);

// 📜 Get previous chat history for a website
router.get("/history/:websiteUrl", authenticateUserByClerkId, getChatHistory);

module.exports = router;
