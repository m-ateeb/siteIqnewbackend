// routes/seoReportRoutes.js
import express from 'express';
import mockClerkAuth from '../middleware/testclerkauth.js';

import {
  analyzeWebsite,   // ✅ CREATE
  getReport,        // 📄 READ ONE
  getAllReports,    // 📄 READ ALL
  updateReport,     // 📝 UPDATE
  deleteReport      // ❌ DELETE
} from '../controllers/lightHouse.controller.js';

const router = express.Router();

// ✅ Apply mock authentication middleware globally

// ✅ CREATE - Start analysis
router.post('/analyze', analyzeWebsite);

// 📄 READ ALL - Get all reports for logged-in user
router.get('/', getAllReports);

// 📄 READ ONE - Get specific report by ID
router.get('/:id', getReport);

// 📝 UPDATE - Update report by ID
router.put('/:id', updateReport);

// ❌ DELETE - Delete report by ID
router.delete('/:id', deleteReport);

export default router;
