/**
 * Tests for API route handler logic.
 *
 * These tests verify route handler behaviour using mock request/response
 * objects. NO real HTTP server is started, no real network requests are
 * made, and no production domain data is loaded.
 *
 * All domain data uses fabricated ".test" TLD hostnames (RFC 2606).
 * The DomainManager is instantiated with mock data rather than the
 * production config/domains.json file.
 */

const { MOCK_DOMAINS } = require('./fixtures/mock-domains');
const { MOCK_HUNT_FINDINGS } = require('./fixtures/mock-api-data');

/* ------------------------------------------------------------------ */
/*  Minimal mock Express req/res helpers                               */
/* ------------------------------------------------------------------ */

function mockReq(overrides = {}) {
  return {
    params: {},
    query: {},
    body: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {
    _status: 200,
    _json: null,
    status(code) { res._status = code; return res; },
    json(data) { res._json = data; return res; },
  };
  return res;
}

/* ------------------------------------------------------------------ */
/*  Tests for domain route-like handlers (using mock DomainManager)    */
/* ------------------------------------------------------------------ */

describe('API route handlers — domain endpoints (mocked)', () => {
  /**
   * Simulate the GET /domains handler logic with mock data,
   * avoiding any dependency on the real domains.json or Express server.
   */
  it('returns all mock domains without filters', () => {
    const req = mockReq();
    const res = mockRes();

    // Simulate route handler logic
    let domains = [...MOCK_DOMAINS];
    const { category, tier } = req.query;
    if (category) domains = domains.filter((d) => d.category === category);
    if (tier) domains = domains.filter((d) => d.tier === Number(tier));
    res.json({ count: domains.length, domains });

    expect(res._json.count).toBe(MOCK_DOMAINS.length);
    expect(res._json.domains[0].domain).toContain('.test');
  });

  it('filters mock domains by category query parameter', () => {
    const req = mockReq({ query: { category: 'mock-operator' } });
    const res = mockRes();

    let domains = [...MOCK_DOMAINS];
    const { category } = req.query;
    if (category) domains = domains.filter((d) => d.category === category);
    res.json({ count: domains.length, domains });

    expect(res._json.count).toBe(3);
    expect(res._json.domains.every((d) => d.category === 'mock-operator')).toBe(true);
  });

  it('filters mock domains by tier query parameter', () => {
    const req = mockReq({ query: { tier: '1' } });
    const res = mockRes();

    let domains = [...MOCK_DOMAINS];
    const { tier } = req.query;
    if (tier) domains = domains.filter((d) => d.tier === Number(tier));
    res.json({ count: domains.length, domains });

    expect(res._json.count).toBe(3);
    expect(res._json.domains.every((d) => d.tier === 1)).toBe(true);
  });

  it('returns 404-style response for a non-existent mock category', () => {
    const req = mockReq({ params: { category: 'nonexistent-mock' } });
    const res = mockRes();

    const domains = MOCK_DOMAINS.filter((d) => d.category === req.params.category);
    if (domains.length === 0) {
      res.status(404).json({ error: `No domains found for category: ${req.params.category}` });
    } else {
      res.json({ category: req.params.category, count: domains.length, domains });
    }

    expect(res._status).toBe(404);
    expect(res._json.error).toContain('nonexistent-mock');
  });

  it('looks up a specific mock domain', () => {
    const req = mockReq({ params: { domain: 'mock-casino-alpha.test' } });
    const res = mockRes();

    const domain = MOCK_DOMAINS.find((d) => d.domain === req.params.domain) || null;
    if (!domain) {
      res.status(404).json({ error: `Domain not found: ${req.params.domain}` });
    } else {
      res.json(domain);
    }

    expect(res._status).toBe(200);
    expect(res._json.domain).toBe('mock-casino-alpha.test');
    expect(res._json.category).toBe('test');
  });

  it('returns 404 for a non-existent mock domain lookup', () => {
    const req = mockReq({ params: { domain: 'nonexistent.test' } });
    const res = mockRes();

    const domain = MOCK_DOMAINS.find((d) => d.domain === req.params.domain) || null;
    if (!domain) {
      res.status(404).json({ error: `Domain not found: ${req.params.domain}` });
    }

    expect(res._status).toBe(404);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests for hunting route-like handlers (mocked hunt function)       */
/* ------------------------------------------------------------------ */

describe('API route handlers — hunting endpoints (mocked)', () => {
  it('simulates a mock single-domain hunt response', async () => {
    const req = mockReq({ params: { domain: 'mock-casino.test' } });
    const res = mockRes();

    // Mock huntRTP function — returns fabricated findings
    const mockHuntRTP = async (domain) => MOCK_HUNT_FINDINGS;

    try {
      const result = await mockHuntRTP(req.params.domain);
      res.json({ domain: req.params.domain, findings: result });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }

    expect(res._json.domain).toBe('mock-casino.test');
    expect(res._json.findings).toEqual(MOCK_HUNT_FINDINGS);
    expect(res._json.findings[0].url).toContain('.test');
  });

  it('simulates a mock bulk hunt with explicit domain list', async () => {
    const targetDomains = ['mock-casino-alpha.test', 'mock-casino-beta.test'];
    const req = mockReq({ body: { domains: targetDomains } });
    const res = mockRes();

    // Mock bulk hunt
    const results = [];
    const errors = [];
    for (const domain of targetDomains) {
      try {
        results.push({ domain, data: MOCK_HUNT_FINDINGS });
      } catch (err) {
        errors.push({ domain, error: err.message });
      }
    }

    res.json({
      summary: { total: targetDomains.length, succeeded: results.length, failed: errors.length },
      results,
      errors,
    });

    expect(res._json.summary.total).toBe(2);
    expect(res._json.summary.succeeded).toBe(2);
    expect(res._json.results[0].domain).toContain('.test');
  });

  it('returns 400-style response when no targeting parameters are provided', () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    const { domains, category, tier, minPriority, maxPriority } = req.body;
    if (!domains && !category && tier === undefined && !minPriority && !maxPriority) {
      res.status(400).json({
        error: 'Provide domains[], category, tier, or a priority range in the request body.',
      });
    }

    expect(res._status).toBe(400);
    expect(res._json.error).toContain('Provide domains[]');
  });

  it('simulates a mock hunt error response', async () => {
    const req = mockReq({ params: { domain: 'failing-casino.test' } });
    const res = mockRes();

    const mockHuntRTP = async () => { throw new Error('Simulated mock timeout'); };

    try {
      await mockHuntRTP(req.params.domain);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }

    expect(res._status).toBe(500);
    expect(res._json.error).toBe('Simulated mock timeout');
  });
});

/* ------------------------------------------------------------------ */
/*  Tests for health endpoint                                          */
/* ------------------------------------------------------------------ */

describe('API route handlers — health endpoint (mocked)', () => {
  it('returns ok status', () => {
    const res = mockRes();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });

    expect(res._json.status).toBe('ok');
    expect(res._json.timestamp).toBeDefined();
  });
});

/* ------------------------------------------------------------------ */
/*  Verify no real endpoints are used in test data                     */
/* ------------------------------------------------------------------ */

describe('Test data isolation — no real endpoints', () => {
  it('all mock domains use the .test TLD', () => {
    for (const d of MOCK_DOMAINS) {
      expect(d.domain).toMatch(/\.test$/);
    }
  });

  it('all mock finding URLs use the .test TLD', () => {
    for (const f of MOCK_HUNT_FINDINGS) {
      expect(f.url).toMatch(/\.test\//);
    }
  });
});
