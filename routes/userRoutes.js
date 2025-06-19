import express from "express";
import { getUserProfile, updateUserProfile, deleteUser, getUserSeoReports, getUserSubscription } from "../controllers/userController.js"; // ✅ FIXED

import authenticateUserByClerkId from "../middleware/authenticateUserByClerkId.js";

const router = express.Router();

router.use(authenticateUserByClerkId);

router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.delete("/", deleteUser);
router.get("/seo-reports", getUserSeoReports);
router.get("/subscription", getUserSubscription);

export default router;
