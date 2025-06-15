const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const logger = require('./src/utils/logger');
const config = require('./src/config/config');

// Import routes
const registrarRoutes = require('./src/routes/registrarRoutes');
const stampReporterRoutes = require('./src/routes/stampReporterRoutes');
const benchClerkRoutes = require('./src/routes/benchClerkRoutes');
const judgeRoutes = require('./src/routes/judgeRoutes');
const lawyerRoutes = require('./src/routes/lawyerRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define routes
app.use('/api/registrar', registrarRoutes);
app.use('/api/stampreporter', stampReporterRoutes);
app.use('/api/benchclerk', benchClerkRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/lawyer', lawyerRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'eVAULT Hyperledger Fabric API',
        version: '1.0.0'
    });
});

// Error handler
app.use((err, req, res, next) => {
    logger.error(`API Error: ${err.stack}`);
    res.status(err.status || 500).json({
        error: {
            message: err.message,
            status: err.status || 500
        }
    });
});

// Start the server
const PORT = config.port;
app.listen(PORT, () => {
    logger.info(`eVAULT API server running on port ${PORT}`);
    console.log(`eVAULT API server running on port ${PORT}`);
});

module.exports = app;
