import mongoose from "mongoose"; // ✅ FIXED (import mongoose)


const VectorSchema = new mongoose.Schema({
    websiteUrl: {
        type: String,
        required: true,
        unique: true,
        match: /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}\/?.*$/
    },
    embeddings: {
        type: [Number], // Array of floating-point numbers
        required: true
    },
    textData: {
        type: String, // Store raw text for debugging and verification
        required: true
    },
    metadata: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
        lastUpdated: { type: Date, default: Date.now }
    }
});

// Index for faster vector search
VectorSchema.index({ websiteUrl: 1 });
VectorSchema.index({ userId: 1 });
VectorSchema.index({ "metadata.lastUpdated": -1 });


const WebsiteVector = mongoose.model("WebsiteVector", VectorSchema);
export default WebsiteVector;
