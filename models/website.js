import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        userMessage: { type: String, required: true },
        botResponse: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const websiteSchema = new mongoose.Schema(
    {
        clerkuserId: { type: String, required: true },

        domain: {
            type: String,
            required: true,
            // optional: ensure it's a valid domain format using regex
            validate: {
                validator: function (v) {
                    return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v.replace(/^https?:\/\//, ''));
                },
                message: props => `${props.value} is not a valid domain`,
            }
        },

    seoReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeoReport",
    },
    seoRecommendation: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "SeoRecommendation",
    }],
    aiRecommendations: {
      type: Object,
      default: {},
    },
    chatHistory: {
      type: [chatMessageSchema],
      default: [],
    },
    chatCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 15,
    },
  },
  { timestamps: true }
);

// 🛠 Pre-save hook to normalize domain
websiteSchema.pre("save", function (next) {
    if (this.isModified("domain")) {
        let raw = this.domain.trim();
        // Strip existing protocol
        raw = raw.replace(/^https?:\/\//i, "");
        // Store as https://domain.tld
        this.domain = `https://${raw}`;
    }
    next();
});

const Website = mongoose.models.Website
  ? mongoose.model("Website")
  : mongoose.model("Website", websiteSchema);

export default Website;

