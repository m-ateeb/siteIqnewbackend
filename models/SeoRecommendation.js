import mongoose from "mongoose";

const seoRecommendationSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      ref: "User", // Reference to User model
      required: true,
    },
        website: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Website",
            required: true,
        },
    seoReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeoReport", // Reference to SeoReport model
      required: true,
      unique: true // Ensures only one entry per report
    },
    recommendations: {
      lighthouse: {
        type: String,
      },
      seo: {
        type: String,
      }
    },
    action: {
      type: String,
      enum: ["Analyzed", "In Progress", "Completed", "Failed"],
      default: "Analyzed",
    },
  },
  { timestamps: true }
);

const SeoRecommendation = mongoose.model("SeoRecommendation", seoRecommendationSchema);

export default SeoRecommendation;