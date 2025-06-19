// swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Site IQ Backend',
      version: '1.0.0',
      description: 'API documentation of Site IQ Express.js Restful APIs',
    },
    servers: [
      {
        url: 'http://localhost:5000', // Replace with your server URL
      },
    ],
  },
  apis: ['./docs/*.yaml'], // Path to your route files
};
    
const swaggerSpec = swaggerJSDoc(options);
export default swaggerSpec;
