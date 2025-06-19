import { analyzeWebsite, recommendingTechStack } from "../services/tech_stack_aiservice.js";
import Conversation from "../models/techstackChatModel.js";
import { fetchWebsiteHTML, extractWebsiteInfo } from "../services/tech_stack_scrapper.js";
import { extractHostname } from "../services/techstackUrlHelper.js"; // helper we'll define

// RECOMMEND new tech stack (no website)
export async function recommendStack(req, res) {
  const { useCase, seoFocused, performanceFocused } = req.body;

  if (!useCase || typeof seoFocused !== "boolean" || typeof performanceFocused !== "boolean") {
    return res.status(400).json({ error: "Use case, SEO focus, and performance focus are required" });
  }

  try {
    const recommendation = await recommendingTechStack( useCase, seoFocused, performanceFocused);

    res.json({
      mode: "recommend",
      recommendation
    });
  } catch (error) {
    console.error("Error in recommendStack:", error.message);
    res.status(500).json({ error: "Failed to get recommendation" });
  }
}

// IMPROVE existing website
export async function improveStack(req, res) {
  const { websiteUrl, useCase, seoFocused, performanceFocused } = req.body;
  const clerkUserId = req.auth?.userId;

  if (!websiteUrl || !useCase || typeof seoFocused !== "boolean" || typeof performanceFocused !== "boolean") {
    return res.status(400).json({ error: "Website URL, use case, SEO focus, and performance focus are required" });
  }

  try {
    const html = await fetchWebsiteHTML(websiteUrl);
    if (!html) throw new Error("Failed to fetch website content");

    const { metaTags, scripts } = extractWebsiteInfo(html);

    const recommendation = await analyzeWebsite(metaTags, scripts, useCase, seoFocused, performanceFocused);

    // Save the response to a new conversation
    const conversation = new Conversation({
      clerkUserId,
      mode: "improve",
      title: `Improvements for ${extractHostname(websiteUrl)} [${new Date().toLocaleString()}]`,
      improvementResponse: JSON.stringify(recommendation),
      history: [
    {
      role: "assistant",
      content: JSON.stringify(recommendation) // or format nicely
    }
  ]
    });

    await conversation.save();

    res.json({
      mode: "improve",
      website: extractHostname(websiteUrl),
      websiteTitle: metaTags.title || "Untitled",
      websiteDescription: metaTags.description || "No description available",
      scripts,
      websiteUrl,
      recommendation,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error("Error in improveStack:", error.message);
    res.status(500).json({ error: "Failed to analyze website" });
  }
}
