// routes/chatRoutes.js

import express from "express";
import mockClerkAuth from "../middleware/testclerkauth.js";
import {
    handleChatMessage,
    getChatHistory,
    getChatMessage
} from "../controllers/chatController.js";

const router = express.Router();

// — send a new message & AI reply
router.post("/", mockClerkAuth, handleChatMessage);

// — fetch the entire chat history array
router.get("/:websiteId", mockClerkAuth, getChatHistory);

// — fetch a single message by its index
router.get("/:websiteId/:index", mockClerkAuth, getChatMessage);



export default router;
