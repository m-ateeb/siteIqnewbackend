import mongoose from "mongoose";

const PhraseResultSchema = new mongoose.Schema({
  phrase: { type: String, required: true },
  jid: { type: String, required: true },
  rawResponse: { type: Object },

    // Scoring
    scores: {
      rankingPosition: { type: Number, default: 0 },
      keywordRelevance: { type: Number, default: 0 },
      richSnippets: { type: Number, default: 0 },
      urlStructure: { type: Number, default: 0 },
      visibility: { type: Number, default: 0 },
      competitorAnalysis: { type: Number, default: 0 },
      paginationStrength: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  }, { _id: false, timestamps: false });

  // Lighthouse report sub-schema
  const LighthouseReportSchema = new mongoose.Schema({
    logs: [{ type: String }],
    error: {
      message: String,
      stack: String,
      name: String,
    },
    lighthouseReport: {
      lighthouseVersion: String,
      requestedUrl: String,
      mainDocumentUrl: String,
      finalDisplayedUrl: String,
      finalUrl: String,
      fetchTime: Date,
      gatherMode: String,
      runtimeError: mongoose.Schema.Types.Mixed,
      runWarnings: [String],
      userAgent: String,
      environment: mongoose.Schema.Types.Mixed,
      audits: mongoose.Schema.Types.Mixed,
    },
    createdAt: { type: Date, default: Date.now },
  }, { _id: false }); // prevent _id in subdocument

  const SeoReportSchema = new mongoose.Schema(
    {
      clerkUserId: { type: String, required: true, unique: false },
          website: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Website",
              required: true,
          },
      scanDate: { type: Date, default: Date.now },
      phraseResults: [PhraseResultSchema],
      lighthouse: LighthouseReportSchema // <-- Lighthouse data embedded here
    },
    { timestamps: true }
  );

  const SeoReport = mongoose.model("SeoReport", SeoReportSchema);

export default SeoReport;