'use strict';

const express = require('express');
const BulkHunterService = require('../services/BulkHunterService');
const ResultAggregator = require('../services/ResultAggregator');
const DomainManager = require('../managers/DomainManager');

const router = express.Router();

/**
 * POST /hunt/bulk
 * Runs bulk RTP hunting across multiple domains.
 *
 * Body:
 *   - domains: string[] — explicit list of domain hostnames (optional)
 *   - category: string — hunt all domains in this category (optional)
 *   - tier: number — hunt all domains in this tier (optional)
 *   - minPriority: number — filter by minimum priority (optional)
 *   - maxPriority: number — filter by maximum priority (optional)
 *   - options: { concurrencyLimit, rateLimitMs, retries } (optional)
 *
 * Returns aggregated results report.
 */
router.post('/bulk', async (req, res) => {
  try {
    const { huntRTP } = require('../../rtp-hunter');
    const manager = new DomainManager();
    const aggregator = new ResultAggregator();

    const { domains: domainList, category, tier, minPriority, maxPriority, options = {} } = req.body || {};

    let targetDomains;
    if (domainList && Array.isArray(domainList)) {
      targetDomains = domainList.map((d) => (typeof d === 'string' ? { domain: d } : d));
    } else if (category) {
      targetDomains = manager.getByCategory(category);
    } else if (tier !== undefined) {
      targetDomains = manager.getByTier(Number(tier));
    } else if (minPriority !== undefined || maxPriority !== undefined) {
      targetDomains = manager.filterByPriorityRange(
        minPriority ? Number(minPriority) : undefined,
        maxPriority ? Number(maxPriority) : undefined
      );
    } else {
      return res.status(400).json({
        error: 'Provide domains[], category, tier, or a priority range in the request body.',
      });
    }

    if (!targetDomains || targetDomains.length === 0) {
      return res.status(404).json({ error: 'No matching domains found.' });
    }

    const service = new BulkHunterService(huntRTP, {
      concurrencyLimit: options.concurrencyLimit || 3,
      rateLimitMs: options.rateLimitMs || 1000,
      retries: options.retries !== undefined ? options.retries : 2,
    });

    const { results, errors } = await service.processDomains(targetDomains, options);

    for (const { domain, data } of results) {
      aggregator.addResult(domain, data);
    }
    for (const { domain, error } of errors) {
      aggregator.addError(domain, error);
    }

    res.json(aggregator.buildReport());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /hunt/category/:category
 * Shorthand endpoint: hunt all domains in the named category.
 */
router.post('/category/:category', async (req, res) => {
  req.body = { ...req.body, category: req.params.category };
  return router.handle(
    Object.assign(req, { url: '/bulk', method: 'POST' }),
    res,
    () => {}
  );
});

module.exports = router;
