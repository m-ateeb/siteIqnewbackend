import Website from "../models/website.js";

// GET /api/websites  
export const getAllWebsites = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const sites = await Website
            .find({ clerkuserId: userId }); // only return what you need
        res.json(sites);
    } catch (err) {
        console.error("❌ getAllWebsites error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};

// GET /api/websites/:id  
export const getWebsiteById = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { id } = req.params;

        const site = await Website
            .findOne({ _id: id, clerkuserId: userId })
            .populate({
                path: 'seoReport',
                // no field projection here means you get the entire SeoReport:
                // scanDate, phraseResults, lighthouse, timestamps, etc.
            })
            .populate({
                path: 'seoRecommendation',
                // full SeoRecommendation: clerkUserId, website, seoReport, recommendations, action, timestamps
            });

        if (!site) {
            return res.status(404).json({ error: 'Website not found.' });
        }

        res.json(site);
    } catch (err) {
        console.error('❌ getWebsiteById error:', err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// POST /api/websites  
export const createWebsite = async (req, res) => {
    try {
        const userId = req.auth?.userId,
            { domain } = req.body;
        if (!domain) return res.status(400).json({ error: "Missing domain." });

        const exists = await Website.findOne({ clerkuserId: userId, domain });
        if (exists) return res.status(400).json({ error: "Already added." });

        const site = await Website.create({ clerkuserId: userId, domain });
        res.status(201).json(site);
    } catch (err) {
        console.error("❌ createWebsite error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};

// DELETE /api/websites/:id  
export const deleteWebsite = async (req, res) => {
    try {
        const userId = req.auth?.userId,
            { id } = req.params;
        const deleted = await Website.findOneAndDelete({ _id: id, clerkuserId: userId });
        if (!deleted) return res.status(404).json({ error: "Website not found." });
        res.json({ message: "Deleted." });
    } catch (err) {
        console.error("❌ deleteWebsite error:", err);
        res.status(500).json({ error: "Internal server error." });
    }
};
