
/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS
 *           MVC ARCHITECTURE - STATELESS JWT
 * ==============================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./backend/config/db');
const apiRoutes = require('./backend/routes/index');

const { PORT = 3001 } = process.env;

const app = express();
app.set('trust proxy', 1);

// CORS Configuration
app.use(cors({
  origin: '*', // Allow all origins for development; restrict in production if needed
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

app.use(express.json({ limit: '10mb' }));

// Use API Routes - Mounts all routes under /api
app.use('/api', apiRoutes);

// Root route for health check
app.get('/', (req, res) => {
    res.send('Jiu-Jitsu Hub API is running.');
});

// Start Server
(async () => {
    await connectToDatabase();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
