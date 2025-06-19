import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const HF_API_KEY = process.env.HF_API_KEY; // Load API key from .env

async function getTechStackRecommendation(metadata, scripts) {
  try {
    const response = await axios.post(
      "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3",
      {
        inputs: `Analyze the following website data and recommend a tech stack:\n\nMeta Data: ${JSON.stringify(metadata)}\n\nScripts: ${JSON.stringify(scripts)}\n\nProvide structured recommendations for Frontend, Backend, Database, and Hosting.`,
      },
      {
        headers: { Authorization: `Bearer ${HF_API_KEY}` },
      }
    );

    return response.data[0].generated_text || "No AI recommendation available.";
  } catch (error) {
    console.error("Hugging Face API Error:", error.message);
    return "Failed to get AI recommendation.";
  }
}

module.exports = getTechStackRecommendation;
