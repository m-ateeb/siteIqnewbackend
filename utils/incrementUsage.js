import User from '../models/User.js'; // Import User model

/**
 * Increments usage count for the given Clerk user ID and recommendation type.
 * @param {String} clerkUserId - The Clerk user ID (from req.auth.userId).
 * @param {'seo'|'techstack'} type - The type of recommendation.
 */
const incrementUsage = async (clerkUserId, type) => {
  try {
    const user = await User.findOne({ clerkUserId });
    if (!user) {
      console.warn(`❌ No user found with clerkUserId: ${clerkUserId}`);
      return;
    }

    // Ensure weekly tracking is still valid (optional safety)
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const weekStart = new Date(user.subscription.usage.weekStart || now);
    if (now - weekStart > oneWeek) {
      user.subscription.usage.seoRecommendations = 0;
      user.subscription.usage.techStackRecommendations = 0;
      user.subscription.usage.weekStart = now;
    }

    if (type === 'seo') {
      user.subscription.usage.seoRecommendations++;
    } else if (type === 'techstack') {
      user.subscription.usage.techStackRecommendations++;
    }

    await user.save();
    console.log(`✅ Incremented ${type} usage for user ${clerkUserId}`);
  } catch (err) {
    console.error(`❌ Error incrementing usage for user ${clerkUserId}:`, err.message);
  }
};

export default incrementUsage;
