import express from "express";
import mockClerkAuth from "../middleware/testclerkauth.js";
import {
  generateAndScoreReport,
  deleteReport,
  returnReport,
  getSeoReports,
  deletePhraseResultByPhrase
} from '../controllers/seoController.js';

const router = express.Router(); 


router.post("/generate", generateAndScoreReport);   // body {domain, phrase}awe

router.delete("/delete/:jid", deleteReport); // params {jid} 

router.get("/return/:jid", returnReport);  // params {jid}

router.get("/websites/:websiteId", getSeoReports);

router.delete("/delete/:websiteId/:phrase",deletePhraseResultByPhrase); // params {websiteId, phrase}

export default router;