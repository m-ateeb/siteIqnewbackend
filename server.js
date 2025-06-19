import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express'

// imports for swagger 
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import { apiReference } from '@scalar/express-api-reference';

// Import routes
import userRoutes from './routes/userRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import seoRecommendationsRoutes from './routes/seoRecommendation.routes.js';
import historyRoutes from './routes/history.routes.js';
import lighthouseRoutes from "./routes/lightHouse.routes.js";
import seoRoutes from './routes/seoRoutes.js';
import techStackRoutes from './routes/techstackroute.js';
import techstackChatRoutes from './routes/techstackChatRoute.js';
import stripeRoutes from './routes/stripeRoute.js';
import userChatRoutes from "./routes/userChatRoutes.js";
import dashboardRoutes from "./routes/dashboard.js";
import chatRoutes from './routes/chatRoutes.js';
import websiteRoutes from "./routes/websiteRoutes.js";

// Initialize Express
const app = express();
app.use(
    '/api/webhooks',
    express.raw({ type: 'application/json' }),
    webhookRoutes
);
app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies (e.g. from forms)

const PORT = process.env.PORT || 4500;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Or '*' for testing
  credentials: true
}));

app.use(clerkMiddleware());


//middle wares 

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' })); // Raw body for webhooks
app.use(express.json()); // JSON for other routes





// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));



app.use('/api/users', userRoutes);
app.use('/api/seoreports', seoRoutes); // Mount webhook routes
app.use('/api/history', historyRoutes);
app.use("/api/lighthouse", lighthouseRoutes);
app.use("/api/websites", websiteRoutes);
app.use("/api/techstack", techStackRoutes);
app.use('/api/seoRecommendations', seoRecommendationsRoutes);
app.use("/api/userchat", userChatRoutes);   
app.use("/api/dashboard",dashboardRoutes);




//swagger routes 

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve Scalar API reference at /reference
app.use(
  '/reference',
  apiReference({
    url: '/openapi.json', // Endpoint serving your OpenAPI spec
    theme: 'purple', // Optional: choose a theme
  })
);

// Serve the OpenAPI spec at /openapi.json
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});


// Routes
app.get('/', (req, res) => {
    res.send('Welcome to SiteIQ Backend!');
});

  
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});