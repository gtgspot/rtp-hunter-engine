'use strict';

const express = require('express');
const cors = require('cors');

const DomainManager = require('./src/managers/DomainManager');
const BulkHunterService = require('./src/services/BulkHunterService');
const ResultAggregator = require('./src/services/ResultAggregator');
const domainRoutes = require('./src/routes/domainRoutes');
const huntingRoutes = require('./src/routes/huntingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Domain management routes: GET /domains[/*]
app.use('/domains', domainRoutes);

// Hunting operation routes: POST /hunt/bulk, POST /hunt/category/:category
app.use('/hunt', huntingRoutes);

/**
 * GET /hunt/:domain
 * Hunts RTP data for a single domain.
 * The domain is URL-encoded if it contains slashes or special characters.
 */
app.get('/hunt/:domain(*)', async (req, res) => {
    try {
        const { huntRTP } = require('./rtp-hunter');
        const domain = req.params.domain;
        const result = await huntRTP(domain);
        res.json({ domain, findings: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /report
 * Returns a statistical summary of all configured domains.
 */
app.get('/report', (req, res) => {
    try {
        const manager = new DomainManager();
        res.json(manager.getSummary());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /health
 * Health check endpoint.
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`RTP Hunter Engine running on port ${PORT}`);
});