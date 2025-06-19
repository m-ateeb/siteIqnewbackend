import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { ChatOpenAI } from "@langchain/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { HumanMessage, AIMessage } from "langchain/schema";
import mongoose from "mongoose";

// Initialize MongoDB Vector Store
const vectorStore = new MongoDBAtlasVectorSearch(new OpenAIEmbeddings(), {
    collectionName: "website_vectors",
    databaseName: "siteiq",
    indexName: "vector_index", // Atlas Search index
    mongoClient: mongoose.connection.getClient(),
    searchParams: {
        numNeighbors: 100, // Number of nearest neighbors to retrieve
        path: "embeddings", // Field containing the vector embeddings
    },
});

// 🔥 Chat with AI using LangChain
const chatWithAI = async (website, userMessage) => {
    try {
        // Retrieve relevant website data using MongoDB Vector Search
        const retriever = vectorStore.asRetriever({
            filter: { websiteUrl: website.url }, // Filter by specific website
            k: 5, // Return top 5 relevant chunks
        });

        // Initialize Chat Model (GPT-4)
        const chatModel = new ChatOpenAI({
            modelName: "gpt-4",
            temperature: 0.7, // Balance creativity and focus
            maxTokens: 500, // Limit response length
            openAIApiKey: process.env.OPENAI_API_KEY,
        });

        // Create Conversational Retrieval Chain
        const chain = ConversationalRetrievalQAChain.fromLLM(chatModel, retriever, {
            returnSourceDocuments: true, // Include source documents in response
            verbose: process.env.NODE_ENV === "development", // Log details in development
        });

        // Format chat history for context
        const chatHistory = website.chatHistory.flatMap(chat => [
            new HumanMessage(chat.userMessage),
            new AIMessage(chat.botResponse),
        ]);

        // Generate AI Response
        const { text } = await chain.call({
            question: userMessage,
            chat_history: chatHistory,
        });

        return text;
    } catch (error) {
        console.error("Error in LangChain AI processing:", error);
        throw new Error("Sorry, there was an issue processing your request.");
    }
};

// 🔄 Update Website Vector (Optional: For manual updates)
const updateWebsiteVector = async (website) => {
    try {
        const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
        const textData = `
            URL: ${website.url}
            SEO: ${JSON.stringify(website.seoReport)}
            Recommendations: ${JSON.stringify(website.aiRecommendations)}
            HTML: ${website.html?.substring(0, 5000)} // Limit size
            CSS: ${website.css?.substring(0, 5000)}
        `;

        // Generate new vector embedding
        const vector = await embeddings.embedQuery(textData);

        // Update vector in MongoDB
        await vectorStore.collection.updateOne(
            { websiteUrl: website.url },
            {
                $set: {
                    embeddings: vector,
                    textData: textData,
                    "metadata.lastUpdated": new Date(),
                }
            },
            { upsert: true }
        );

        console.log(`✅ Updated vector for ${website.url}`);
    } catch (error) {
        console.error("❌ Error updating website vector:", error);
        throw new Error("Failed to update website vector.");
    }
};

module.exports = { chatWithAI, updateWebsiteVector };