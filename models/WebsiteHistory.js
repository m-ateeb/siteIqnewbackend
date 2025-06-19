// models/WebsiteHistory.js
import mongoose from "mongoose";

const WebsiteHistorySchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      ref: "User",
      required: true,
    },
    url: {
      type: String,
      required: true,
      match: /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}\/?.*$/,
    },
    seoReport: {
      type: Object,
      default: {},
    },
    seoRecommendations: [
      {
        type: Object,
        default: {},
      },
    ],
    action: {
      type: String,
      enum: ["Analyzed", "Updated", "Deleted"],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const WebsiteHistory = mongoose.model("WebsiteHistory", WebsiteHistorySchema);
export default WebsiteHistory;
