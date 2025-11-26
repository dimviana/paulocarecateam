
/**
 * ==============================================================================
 *           Backend Server for Jiu-Jitsu Hub SAAS
 *           MVC ARCHITECTURE (Refactored)
 * ==============================================================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectToDatabase } = require('./backend/config/db');
const apiRoutes = require('./backend/routes/index');

const { PORT = 3001, FRONTEND_URL } = process.env;

const app = express();
app.set('trust proxy', 1);

// CORS Configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (origin === FRONTEND_URL || origin.includes('localhost') || origin.includes('abildeveloper.com.br')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
}));

app.use(express.json({ limit: '10mb' }));

// Use API Routes
app.use('/api', apiRoutes);

// Start Server
(async () => {
    await connectToDatabase();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
