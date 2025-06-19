import User from "../models/User.js";
import Website from "../models/website.js";
import SeoRecommendation from "../models/SeoRecommendation.js";
import Conversation from "../models/techstackChatModel.js";
// 🟦 1. Overview
export const getUserOverview = async (req, res) => {
    console.log("hit the controller");
    const clerkUserId = req.auth?.userId;
    console.log(clerkUserId);
    try {
        const user = await User.findOne({ clerkUserId: req.auth.userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        const overview = {
            name: user.name,
            email: user.email,
            username: user.username,
            plan: user.subscription?.plan || user.membership,
            websiteLimit: user.weeklyWebsiteLimit,
            loginCount: user.loginCount,
        };

        res.json(overview);
    } catch (err) {
        res.status(500).json({ error: "Server error", detail: err.message });
    }
};

// 🟨 2. Websites + populated reports
export const getUserWebsites = async (req, res) => {
    try {
        const websites = await Website.find({ clerkuserId: req.auth.userId })
            .populate("seoReport")
            .populate("seoRecommendation");

        res.json(websites);
    } catch (err) {
        res.status(500).json({ error: "Server error", detail: err.message });
    }
};

// 🟪 3. Chat history
export const getUserChatHistory = async (req, res) => {
    try {
        const websites = await Website.find({ clerkuserId: req.auth.userId }, "domain chatHistory chatCount");
        res.json(websites);
    } catch (err) {
        res.status(500).json({ error: "Server error", detail: err.message });
    }
};

// 🟧 4. SEO Recommendations
export const getUserSeoRecommendations = async (req, res) => {
    try {
        const recommendations = await SeoRecommendation.find({ clerkUserId: req.auth.userId }).populate("seoReport");
        res.json(recommendations);
    } catch (err) {
        res.status(500).json({ error: "Server error", detail: err.message });
    }
};

// 🟥 5. Tec stack
export const getRecentTechStacks = async (req, res) => {
    try {
        const userId = req.auth.userId;

        const recentChats = await Conversation.find({
            clerkUserId: userId,
            mode: "improve", // Only tech stack mode
            improvementResponse: { $ne: null } // Must have improvement data
        })
            .sort({ createdAt: -1 })
            .limit(4)
            .select("title createdAt"); // Only return essential info

        res.status(200).json({ recent: recentChats });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch recent tech stacks", detail: error.message });
    }
};
