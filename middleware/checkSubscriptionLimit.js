import { PLAN_LIMITS } from '../config/subscriptionLimits.js'; // Adjust the path if needed
import User from '../models/User.js'; // Make sure path is correct

const checkSubscriptionLimit = (type) => {
  return async (req, res, next) => {
    try {
      console.log("✅ Step 1: Extracting user ID from auth...");
      const clerkUserId = req.auth.userId;
      console.log("Clerk User ID:", clerkUserId);

      if (!clerkUserId) {
        console.warn("❌ Missing auth context.");
        return res.status(401).json({ message: "Unauthorized: Missing Clerk User ID" });
      }

      const user = await User.findOne({ clerkUserId });

      if (!user) {
        console.warn("❌ User not found.");
        return res.status(404).json({ message: "User not found" });
      }

      // Reset usage if a new week started
      const now = new Date();
      const weekStart = new Date(user.subscription.usage.weekStart);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      if (now - weekStart > oneWeek) {
        user.subscription.usage.seoRecommendations = 0;
        user.subscription.usage.techStackRecommendations = 0;
        user.subscription.usage.weekStart = now;
        await user.save();
      }

      const limit = PLAN_LIMITS[user.subscription.plan];

      // Check limits if not business plan
      if (user.subscription.plan !== 'business') {
        if (type === 'seo' && user.subscription.usage.seoRecommendations >= limit) {
          return res.status(429).json({ message: "SEO limit reached for the week" });
        }

        if (type === 'techstack' && user.subscription.usage.techStackRecommendations >= limit) {
          return res.status(429).json({ message: "TechStack limit reached for the week" });
        }
      }

      // Attach user to request for use in next middleware/route if needed
      req.user = user;

      next();
    } catch (error) {
      console.error("❌ Error in checkSubscriptionLimit:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
};

export default checkSubscriptionLimit;
