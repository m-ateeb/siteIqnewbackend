import SeoReport from "../models/seoModel.js";
import crypto from "crypto";
import axios from "axios";
import dotenv from "dotenv";
import User from "../models/User.js";
import Website from "../models/website.js";

dotenv.config();

const publicKey = process.env.SEO_API_PUBLIC_KEY;
const privateKey = process.env.SEO_API_SECRET_KEY;
const salt = process.env.SEO_SALT;

// Hash generation utility
function generateAuthoritasHash({ publicKey, privateKey, salt }) {
    const ts = Math.floor(Date.now() / 1000);
    const stringToHash = ts + publicKey + salt;
    const hmac = crypto.createHmac("sha256", privateKey);
    const hash = hmac.update(stringToHash).digest("hex");
    return { ts, hash };
}

// Scoring function remains unchanged
function scoreSeoResponse(rawResponse, keyword, domain) {
    const scores = {
        rankingPosition: 0,
        keywordRelevance: 0,
        richSnippets: 0,
        urlStructure: 0,
        visibility: 0,
        competitorAnalysis: 0,
        paginationStrength: 0,
        total: 0,
    };

    const responseData = rawResponse?.response || {};
    const results = responseData.results || {};
    const summary = responseData.summary || {};

    const organicEntries = Object.entries(results.organic || {});

    const universalEntries = Object.entries(results.universal || {});

    const top10 = organicEntries
        .map(([positionStr, result]) => ({
            position: parseInt(positionStr),
            ...result,
        }))
        .filter((r) => r.position <= 10);

    const lowerKeyword = keyword.toLowerCase();

    // 1. Ranking Position (30 pts max)
    const rank = organicEntries.find(([_, r]) => r.url?.includes(domain));
    if (rank) {
        const position = parseInt(rank[0]);
        if (position === 1) scores.rankingPosition = 30;
        else if (position <= 3) scores.rankingPosition = 27;
        else if (position <= 10) scores.rankingPosition = 25;
        else if (position <= 15) scores.rankingPosition = 20;
        else if (position <= 25) scores.rankingPosition = 15;
        else if (position <= 35) scores.rankingPosition = 10;
        else scores.rankingPosition = 5;
    }

    // 2. Keyword Relevance (20 pts max)
    let relevanceScore = 0;
    top10.forEach((result) => {
        if (result.title?.toLowerCase().includes(lowerKeyword)) relevanceScore += 8;
        if (result.description?.toLowerCase().includes(lowerKeyword))
            relevanceScore += 8;
        if (result.url?.toLowerCase().includes(lowerKeyword)) relevanceScore += 4;
    });
    scores.keywordRelevance = Math.min(relevanceScore, 20);

    // 3. Rich Snippets (10 pts max)
    let richScore = 0;
    universalEntries.forEach(([_, result]) => {
        if (
            Array.isArray(result.rich_snippets) &&
            result.rich_snippets.length > 0
        ) {
            richScore += 5;
        }
    });
    scores.richSnippets = Math.min(richScore, 10);

    // 4. URL Structure (10 pts max)
    let cleanUrlScore = 0;
    top10.forEach((result) => {
        try {
            const pathname = new URL(result.url).pathname;
            if (!pathname.includes("?") && !pathname.includes("_")) {
                cleanUrlScore += 2;
            }
        } catch { }
    });
    scores.urlStructure = Math.min(cleanUrlScore, 10);

    // 5. Visibility (10 pts max)
    let visibilityScore = 0;
    top10.forEach((result) => {
        if (result.above_the_fold) visibilityScore += 3;
    });
    scores.visibility = Math.min(visibilityScore, 10);

    // 6. Competitor Analysis (10 pts max)
    try {
        const top10Hosts = top10.map((r) => new URL(r.url).hostname);
        if (top10Hosts.includes(domain)) {
            scores.competitorAnalysis = 10;
        }
    } catch { }

    // 7. Pagination Strength (10 pts max)
    const page1Organic = summary.pages?.["1"]?.organic || 0;
    scores.paginationStrength = Math.min(page1Organic, 10); // 1pt per result on page 1

    // Total Score
    scores.total = Object.values(scores).reduce((sum, val) => sum + val, 0);

    return scores;
}

// Generate & Score Report
// Generate & Score Report - Production Ready
const generateAndScoreReport = async (req, res) => {
    console.log("hit the controller");
    const { phrase, websiteId } = req.body;
    const clerkUserId = req.auth?.userId;

    if (!phrase || !websiteId || !clerkUserId) {
        return res.status(400).json({
            error: "Missing required fields (phrase, websiteId, clerkUserId)",
        });
    }

    try {
        // Step 1: Lookup website to get domain
        const website = await Website.findById(websiteId);
        if (!website) {
            return res.status(404).json({ error: "Website not found." });
        }

        // Step 2: Initiate Authoritas job
        const { ts, hash } = generateAuthoritasHash({
            publicKey,
            privateKey,
            salt,
        });

        let jobResponse;
        try {
            jobResponse = await axios.post(
                "https://v3.api.analyticsseo.com/serps/",
                {
                    search_engine: "google",
                    region: "global",
                    language: "en",
                    max_results: 30,
                    phrase,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `KeyAuth publicKey=${publicKey} hash=${hash} ts=${ts}`,
                    },
                }
            );
        } catch (apiError) {
            console.error("Error initiating Authoritas job:", apiError.response?.data || apiError.message);
            return res.status(500).json({
                error: "Failed to initiate Authoritas job",
                details: apiError.response?.data || apiError.message,
            });
        }

        const jid = jobResponse.data.jid;

        // Step 3: Poll for job completion
        const pollingIntervals = [30_000, 20_000, 15_000, 10_000];
        const maxAttempts = 20;
        let jobReady = false;
        let currentAttempts = 0;
        let rawResponse = null;

        while (!jobReady && currentAttempts < maxAttempts) {
            const pollInterval = pollingIntervals[Math.min(currentAttempts, pollingIntervals.length - 1)];
            currentAttempts++;

            try {
                const { ts: pollTs, hash: pollHash } = generateAuthoritasHash({
                    publicKey,
                    privateKey,
                    salt,
                });

                const pollResponse = await axios.get(`https://v3.api.analyticsseo.com/serps/${jid}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `KeyAuth publicKey=${publicKey} hash=${pollHash} ts=${pollTs}`,
                    },
                });
                console.log("polling response");

                if (pollResponse.data.ready) {
                    jobReady = true;
                    rawResponse = pollResponse.data;
                } else {
                    await new Promise((resolve) => setTimeout(resolve, pollInterval));
                }
            } catch (pollError) {
                console.error(`Polling error for JID ${jid}:`, pollError.message);
                await new Promise((resolve) => setTimeout(resolve, pollInterval));
            }
        }

        if (!jobReady || !rawResponse) {
            return res.status(504).json({
                error: "Authoritas job did not complete in time",
                jid,
                status: "pending",
            });
        }

        // Step 4: Score results
        const scores = scoreSeoResponse(rawResponse, phrase, website.domain);

        // Step 5: Update SeoReport
        let report = await SeoReport.findOne({ clerkUserId, website: websiteId });

        if (!report) {
            return res.status(404).json({
                error: "SeoReport not found for this website and user.",
            });
        }

        // Clean corrupted phraseResults
        const originalLength = report.phraseResults.length;
        report.phraseResults = report.phraseResults.filter(pr =>
            pr && pr.phrase && pr.jid &&
            typeof pr.phrase === 'string' &&
            typeof pr.jid === 'string'
        );
        console.log("saving report");
        if (originalLength !== report.phraseResults.length) {
            console.warn(`Cleaned up ${originalLength - report.phraseResults.length} corrupted phrase results for report ${report._id}`);
        }

        // Update or insert phrase result
        let phraseResult = report.phraseResults.find(p => p.phrase === phrase);
        let message;
        let updatedPhraseResult;

        if (phraseResult) {
            phraseResult.jid = jid;
            phraseResult.rawResponse = rawResponse;
            phraseResult.scores = scores;
            report.markModified('phraseResults');
            updatedPhraseResult = phraseResult;
            message = "Existing phrase updated with new scores";
        } else {
            const newPhraseResult = { phrase, jid, rawResponse, scores };
            report.phraseResults.push(newPhraseResult);
            updatedPhraseResult = newPhraseResult;
            message = "New phrase added to existing report with results and scores";
        }

        await report.save();

        return res.status(200).json({
            message,
            jid,
            reportId: report._id,
            phraseResult: updatedPhraseResult,
        });
    } catch (error) {
        console.error("Fatal error in generateAndScoreReport:", error);
        return res.status(500).json({
            error: "Failed to generate and update SEO report",
            details: error.message,
        });
    }
};

// Delete Report/Phrase
const deleteReport = async (req, res) => {
    const { jid } = req.params;
    const clerkUserId = req.auth.userId;

    if (!jid) {
        return res.status(400).json({ error: "Job ID (jid) is required" });
    }

    try {
        const report = await SeoReport.findOne({
            "phraseResults.jid": jid,
            clerkUserId,
        });

        if (!report) {
            return res
                .status(404)
                .json({ error: "No report found containing this jid" });
        }

        report.phraseResults = report.phraseResults.filter((p) => p.jid !== jid);

        if (report.phraseResults.length === 0) {
            await SeoReport.findByIdAndDelete(report._id);
            return res.status(200).json({
                message: "Report deleted completely as it had only one phrase",
            });
        }

        await report.save();

        res
            .status(200)
            .json({ message: "Phrase result deleted successfully", jid });
    } catch (error) {
        console.error("Error deleting report/phrase:", error.message);
        res.status(500).json({
            error: "Failed to delete report or phrase",
            details: error.message,
        });
    }
};

// Return Report
const returnReport = async (req, res) => {
    const { jid } = req.params;
    const clerkUserId = req.auth.userId;

    if (!jid) {
        return res.status(400).json({ error: "Job ID not included in parameter" });
    }

    try {
        const report = await SeoReport.findOne({
            "phraseResults.jid": jid,
            clerkUserId,
        }).populate("website");

        if (!report) {
            return res
                .status(404)
                .json({ error: "No report found containing this jid", jid });
        }

        const phraseEntry = report.phraseResults.find((p) => p.jid === jid);

        if (!phraseEntry) {
            return res
                .status(404)
                .json({ error: "Phrase entry not found for this jid" });
        }

        return res.status(200).json({
            reportId: report._id,
            website: {
                id: report.website._id,
                domain: report.website.domain,
            },
            scanDate: report.scanDate,
            phraseResult: phraseEntry,
        });
    } catch (error) {
        console.error("Error fetching report:", error.message);
        return res
            .status(500)
            .json({ error: "Internal server error", details: error.message });
    }
};
const getSeoReports = async (req, res) => {
    try {
        const { websiteId } = req.params;

        const website = await Website.findById(websiteId)
            .populate("seoReport") // populate the referenced SeoReport documents
            .exec();

        if (!website) {
            return res.status(404).json({ error: "Website not found" });
        }

        return res.status(200).json({
            seoReport: website.seoReport,
        });
    } catch (err) {
        console.error("Error fetching SEO reports:", err);
        return res.status(500).json({ error: "Server error" });
    }
};

// DELETE /seo-reports/:reportId/phrase/:phrase

const deletePhraseResultByPhrase = async (req, res) => {
    const { websiteId, phrase } = req.params;
    try {
        // 1. Find the Website and get its linked SeoReport
        const website = await Website.findById(websiteId).populate("seoReport");

        if (!website || !website.seoReport) {
            return res.status(404).json({ message: "Website or associated SEO report not found" });
        }

        const seoReportId = website.seoReport._id;

        // 2. Pull the phrase result from the seoReport
        const updatedSeoReport = await SeoReport.findByIdAndUpdate(
            seoReportId,
            {
                $pull: {
                    phraseResults: { phrase: phrase }
                }
            },
            { new: true }
        );

        return res.status(200).json({
            message: `Phrase "${phrase}" deleted successfully.`,
            updatedReport: updatedSeoReport
        });

    } catch (error) {
        console.error("Error deleting phrase:", error);
        return res.status(500).json({ message: "Server error", error });
    }
};

export { generateAndScoreReport, deleteReport, returnReport, getSeoReports, deletePhraseResultByPhrase };
