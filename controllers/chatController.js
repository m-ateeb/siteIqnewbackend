
import Website from "../models/website.js";
import SeoReport from "../models/seoModel.js";
import { callOpenAI } from "../utils/openaiClient.js";
// your two helpers

const SEO_EXPERT_SYSTEM_PROMPT = `
You are an advanced SEO assistant with 10+ years’ experience. Give concise,
actionable SEO recommendations based solely on the provided metrics.
`;

export const handleChatMessage = async (req, res) => {
    try {
        const { websiteId, message } = req.body;
        const userId = req.auth?.userId;
        if (!websiteId || !message) {
            return res.status(400).json({ error: "Missing websiteId or message." });
        }

        // 1️⃣ Fetch the Website and ensure ownership
        const website = await Website
            .findById(websiteId)
            .where("clerkuserId").equals(userId)
            .lean();
        if (!website) {
            return res.status(404).json({ error: "Website not found." });
        }

        // 2️⃣ Load its SEO report
        const report = await SeoReport
            .findById(website.seoReport)
            .lean();
        if (!report) {
            return res.status(404).json({ error: "SEO report not found." });
        }

        // 3️⃣ Extract only the `scores` arrays
        const seoScores = (report.phraseResults || [])
            .map(r => r.scores);

        // 4️⃣ Derive Lighthouse summary scores
        const audits = report.lighthouse?.lighthouseReport?.audits || {};
        const perfScore = calculatePerformanceScore(audits);
        const derivedSeo = calculateSeoScore(audits);

        // 5️⃣ Build minimal context JSON
        const contextPayload = {
            website: website.domain,
            seoPhraseScores: seoScores,
            lighthousePerformance: perfScore,
            lighthouseSeo: derivedSeo
        };

        // 6️⃣ Send to OpenAI
        const reply = await callOpenAI([
            { role: "system", content: SEO_EXPERT_SYSTEM_PROMPT },
            {
                role: "system",
                content: `Context:
\`\`\`json
${JSON.stringify(contextPayload, null, 2)}
\`\`\`

Now answer the user’s question as a trusted SEO consultant.`
            },
            { role: "user", content: message }
        ]);

        // 7️⃣ Save history
        await Website.findByIdAndUpdate(websiteId, {
            $push: { chatHistory: { userMessage: message, botResponse: reply } },
            $inc: { chatCount: 1 }
        });

        return res.json({ reply });

    } catch (err) {
        console.error("❌ Chatbot error:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};


/**
 * GET all chatHistory entries for a website
 */
export const getChatHistory = async (req, res) => {
    const userId = req.auth?.userId;
    const { websiteId } = req.params;
    const site = await Website.findById(websiteId)
        .where("clerkuserId").equals(userId)
        .lean();
    if (!site) return res.status(404).json({ error: "Website not found." });
    return res.json({ chatHistory: site.chatHistory });
};

/**
 * GET a single chatHistory entry by index
 */
export const getChatMessage = async (req, res) => {
    const userId = req.auth?.userId;
    const { websiteId, index } = req.params;
    const site = await Website.findById(websiteId)
        .where("clerkuserId").equals(userId)
        .lean();
    if (!site) return res.status(404).json({ error: "Website not found." });

    const i = parseInt(index, 10);
    if (isNaN(i) || i < 0 || i >= site.chatHistory.length) {
        return res.status(400).json({ error: "Invalid message index." });
    }
    return res.json({ message: site.chatHistory[i] });
};




// utils/seoScores.js

export function calculatePerformanceScore(audits) {
    const weights = {
        fcp: 0.1, lcp: 0.25, cls: 0.15,
        fid: 0.1, speedIndex: 0.1, tti: 0.1
    };
    let totalScore = 0, totalWeight = 0;

    const scoreFor = (key, [good, ok]) => {
        const v = audits[key]?.numericValue;
        if (v == null) return null;
        return v <= good ? 100 : v <= ok ? 50 : 0;
    };

    const metrics = {
        fcp: scoreFor("first-contentful-paint", [1800, 3000]),
        lcp: scoreFor("largest-contentful-paint", [2500, 4000]),
        cls: scoreFor("cumulative-layout-shift", [0.1, 0.25]),
        tbt: scoreFor("total-blocking-time", [200, 600]),
        speedIndex: scoreFor("speed-index", [3400, 5800]),
        tti: scoreFor("interactive", [3800, 7300]),
    };

    for (const [k, w] of Object.entries(weights)) {
        const s = metrics[k];
        if (s != null) {
            totalScore += s * w;
            totalWeight += w;
        }
    }
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

export function calculateSeoScore(audits) {
    const keys = [
        "meta-description", "document-title",
        "link-text", "image-alt",
        "hreflang", "canonical"
    ];
    let sum = 0, cnt = 0;
    for (const k of keys) {
        const s = audits[k]?.score;
        if (typeof s === "number") {
            sum += s;
            cnt++;
        }
    }
    return cnt > 0 ? Math.round((sum / cnt) * 100) : 0;
}
