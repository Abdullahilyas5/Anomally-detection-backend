const express = require('express');
const cors = require('cors');
const userRoutes = require('./modules/users/routes/users.routes');
const logRoutes = require('./modules/logs/routes/log.routes');
const bodyParser = require('body-parser');
const app = express();

app.use(cors());
app.use(bodyParser.json());
// app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== API ROUTES ==========

// User routes
app.use('/api/users', userRoutes);

// Log routes (admin)
app.use('/api/logs', logRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((error, req, res, next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    
    console.error('Error:', error);
    
    res.status(statusCode).json({
        success: false,
        message,
        status: statusCode
    });
});

module.exports = app;

