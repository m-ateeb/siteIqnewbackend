import express from "express";
import {
    getUserOverview,
    getUserWebsites,
    getUserChatHistory,
    getUserSeoRecommendations,
    getRecentTechStacks,
} from "../controllers/dashboardController.js";
import mockClerkAuth from "../middleware/testclerkauth.js";

const router = express.Router();

router.use(mockClerkAuth); // Apply mock authentication middleware


// Routes
router.get("/overview", getUserOverview);
router.get("/websites", getUserWebsites);
router.get("/chat-history", getUserChatHistory);
router.get("/seo-recommendations", getUserSeoRecommendations);
router.get("/techstack", getRecentTechStacks);

export default router;
