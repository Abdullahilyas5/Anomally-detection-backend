const express = require('express');
const cors = require('cors');
const userRoutes = require('./modules/users/routes/users.routes');
const logRoutes = require('./modules/logs/routes/log.routes');
const otpRoutes = require('./modules/otp/routes/otp.route');
const reportRoutes = require('./modules/reports/routes/reports.routes');
const procurementRoutes = require('./modules/aimodel/routes/procurement.route');
const anomalyRoutes = require('./modules/aimodel/routes/anomaly.routes');
const flagRoutes = require('./modules/aimodel/routes/flag.routes');
const bodyParser = require('body-parser');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(bodyParser.json());
// app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== API ROUTES ==========

// User routes
app.use('/api/users', userRoutes);

// Log routes (admin)
app.use('/api/logs', logRoutes);

// OTP routes
app.use('/api/otp', otpRoutes);

// reports routes
app.use('/api/reports', reportRoutes);

app.use('/api/procurement', procurementRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/flags', flagRoutes);

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
