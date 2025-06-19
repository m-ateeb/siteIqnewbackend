import express from "express";
import mockClerkAuth from "../middleware/testclerkauth.js";
import {
    getAllWebsites,
    getWebsiteById
} from "../controllers/websiteController.js";

const router = express.Router();

// all endpoints require an authenticated user
router.use(mockClerkAuth);

// GET all websites for the user
router.get("/", getAllWebsites);

// GET one website by ID
router.get("/:id", getWebsiteById);

export default router;
