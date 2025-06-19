import express from "express";
import { recommendStack, improveStack } from "../controllers/techStackController.js"
import mockClerkAuth from "../middleware/testclerkauth.js"; // Mock authentication middleware
const router = express.Router();

router.use(mockClerkAuth);

router.post("/recommend", recommendStack);
router.post("/improve", improveStack);
export default router;
