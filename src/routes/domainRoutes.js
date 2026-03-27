'use strict';

const express = require('express');
const DomainManager = require('../managers/DomainManager');

const router = express.Router();
const manager = new DomainManager();

/**
 * GET /domains
 * Returns all domains, with optional query-string filters.
 * Query params: category, tier, minPriority, maxPriority
 */
router.get('/', (req, res) => {
  try {
    let domains = manager.getAll();
    const { category, tier, minPriority, maxPriority } = req.query;

    if (category) {
      domains = domains.filter((d) => d.category === category);
    }
    if (tier) {
      domains = domains.filter((d) => d.tier === Number(tier));
    }
    if (minPriority || maxPriority) {
      domains = manager.filterByPriorityRange(
        minPriority ? Number(minPriority) : undefined,
        maxPriority ? Number(maxPriority) : undefined
      ).filter((d) => {
        if (category && d.category !== category) return false;
        if (tier && d.tier !== Number(tier)) return false;
        return true;
      });
    }

    res.json({ count: domains.length, domains });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /domains/summary
 * Returns a statistical summary of all domains.
 */
router.get('/summary', (req, res) => {
  try {
    res.json(manager.getSummary());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /domains/category/:category
 * Returns all domains in the specified category.
 */
router.get('/category/:category', (req, res) => {
  try {
    const domains = manager.getByCategory(req.params.category);
    if (domains.length === 0) {
      return res.status(404).json({ error: `No domains found for category: ${req.params.category}` });
    }
    res.json({ category: req.params.category, count: domains.length, domains });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /domains/tier/:tier
 * Returns all domains in the specified tier (1–4).
 */
router.get('/tier/:tier', (req, res) => {
  try {
    const tier = Number(req.params.tier);
    const domains = manager.getByTier(tier);
    if (domains.length === 0) {
      return res.status(404).json({ error: `No domains found for tier: ${tier}` });
    }
    res.json({ tier, count: domains.length, domains });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /domains/:domain
 * Returns metadata for a specific domain.
 */
router.get('/:domain(*)', (req, res) => {
  try {
    const domain = manager.getByDomain(req.params.domain);
    if (!domain) {
      return res.status(404).json({ error: `Domain not found: ${req.params.domain}` });
    }
    res.json(domain);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
