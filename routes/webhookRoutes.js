import express from "express";
const router = express.Router();
import { handleClerkWebhook } from "../controllers/webhookController.js";


router.post('/', express.raw({ type: 'application/json' }), handleClerkWebhook);

export default router; // ✅ Correct ES Modules export

