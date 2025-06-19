import User from '../models/User.js';

const authenticateUserByClerkId = async (req, res, next) => {
    const authHeader = req.headers.authorization;   
    console.log(authHeader);
    if (!authHeader || !authHeader.startsWith("Clerk")) {
        return res.status(401).json({ error: "Unauthorized: Clerk user ID missing" });
    }

    const clerkUserId = authHeader.split(" ")[1];

    try {
        const user = await User.findOne({ clerkUserId }); // Match clerkUserId in the database

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        req.user = user; // Attach user to the request
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({ error:   "Internal server error" });
    }
};

export default authenticateUserByClerkId; // ✅ FIXED
