// routes/websiteHistoryRoutes.js
import express from 'express';

import mockClerkAuth from "../middleware/testclerkauth.js";
import {
  createHistory,
  getUserHistory,
  getHistoryById,
  updateHistory,
  deleteHistory,
} from "../controllers/history.controller.js";

const router = express.Router();

// ✅ Apply Clerk mock authentication middleware

// ✅ CREATE - Add a new history record
router.post('/', createHistory);

// ✅ READ ALL - Get all history records for authenticated user
router.get('/', getUserHistory);

// ✅ READ ONE - Get a specific history record by ID
router.get('/:id', getHistoryById);

// ✅ UPDATE - Update a history record by ID
router.put('/:id', updateHistory);

// ✅ DELETE ONE - Delete a history record by ID
router.delete('/:id', deleteHistory);


export default router;
