import express from 'express';
import cors from 'cors';
import { huntRTP } from './rtp-hunter.js';

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

app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.get('/hunt', async (req, res) => {
    const { domain } = req.query;
    if (!domain) {
        return res.status(400).json({ error: 'domain query param required' });
    }
    try {
        const result = await huntRTP(domain);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
